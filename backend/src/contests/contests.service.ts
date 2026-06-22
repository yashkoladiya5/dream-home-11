import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { randomBytes } from 'crypto';
import { Contest, ContestStatus, ContestType } from './entities/contest.entity';
import { ContestMember } from './entities/contest-member.entity';
import { User, UserLevel } from '../users/entities/user.entity';
import { QueryContestsDto } from './dto/query-contests.dto';
import { CreatePrivateContestDto } from './dto/create-private-contest.dto';

@Injectable()
export class ContestsService {
  constructor(
    @InjectRepository(Contest)
    private readonly contestRepository: Repository<Contest>,
    @InjectRepository(ContestMember)
    private readonly contestMemberRepository: Repository<ContestMember>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(query: QueryContestsDto): Promise<{ contests: Contest[]; total: number; page: number; limit: number }> {
    const { type, status, page = 1, limit = 20 } = query;
    const where: Record<string, unknown> = {};

    if (type) {
      where.type = type;
    }
    if (status) {
      where.status = status;
    }

    const [contests, total] = await this.contestRepository.findAndCount({
      where,
      order: { startTime: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { contests, total, page, limit };
  }

  async findById(id: string): Promise<Contest | null> {
    return this.contestRepository.findOne({ where: { id } });
  }

  async findByCode(code: string): Promise<Contest | null> {
    return this.contestRepository.findOne({ where: { title: code } });
  }

  async getMembers(contestId: string): Promise<{ members: ContestMember[]; total: number }> {
    const contest = await this.contestRepository.findOne({ where: { id: contestId } });
    if (!contest) {
      throw new NotFoundException('Contest not found');
    }
    const [members, total] = await this.contestMemberRepository.findAndCount({
      where: { contestId },
      order: { joinedAt: 'DESC' },
      relations: { user: true },
    });
    return { members, total };
  }

  async findByInviteCode(code: string): Promise<Contest> {
    const contest = await this.contestRepository.findOne({ where: { inviteCode: code.toUpperCase() } });
    if (!contest) {
      throw new NotFoundException('Contest not found for this invite code');
    }
    return contest;
  }

  async createPrivateContest(
    userId: string,
    dto: CreatePrivateContestDto,
  ): Promise<{ contest: Contest; inviteCode: string }> {
    const inviteCode = randomBytes(4).toString('hex').toUpperCase().slice(0, 8);

    const now = new Date();
    const contest = this.contestRepository.create({
      title: dto.title,
      type: ContestType.PRIVATE,
      entryFeeInr: dto.entryFeeInr,
      pointsToJoin: dto.pointsToJoin,
      maxSlots: dto.maxSlots,
      filledSlots: 0,
      prize: dto.prize,
      badgeText: 'PRIVATE',
      badgeColor: '#F97316',
      rules: dto.rules || '1. Entry fee is non-refundable.\n2. This is a private contest — invite only.\n3. Winners will be announced after the contest ends.\n4. Must complete KYC within 7 days of winning.\n5. Dream11 reserves the right to modify these rules.\n6. By joining, you agree to all terms and conditions.',
      inviteCode,
      startTime: dto.startTime || now,
      endTime: dto.endTime || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      status: ContestStatus.RUNNING,
    });

    await this.contestRepository.save(contest);

    const member = this.contestMemberRepository.create({
      contestId: contest.id,
      userId,
      pointsEarned: 0,
    });
    await this.contestMemberRepository.save(member);

    contest.filledSlots = 1;
    await this.contestRepository.save(contest);

    return { contest, inviteCode };
  }

  async joinContest(userId: string, contestId: string): Promise<{ user: User; contest: Contest; member: ContestMember }> {
    return this.dataSource.transaction(async (entityManager) => {
      const contest = await entityManager.findOne(Contest, {
        where: { id: contestId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!contest) {
        throw new NotFoundException('Contest not found');
      }

      if (contest.status !== ContestStatus.RUNNING) {
        throw new BadRequestException('Contest is not currently running');
      }

      if (contest.filledSlots >= contest.maxSlots) {
        throw new BadRequestException('Contest is full');
      }

      const user = await entityManager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.isActive) {
        throw new BadRequestException('User account is suspended');
      }

      if (Number(user.walletBalanceInr) < Number(contest.entryFeeInr)) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      const existingMember = await entityManager.findOne(ContestMember, {
        where: { contestId, userId },
      });

      if (existingMember) {
        throw new BadRequestException('Already joined this contest');
      }

      user.walletBalanceInr = Number(user.walletBalanceInr) - Number(contest.entryFeeInr);
      user.pointsBalance = Number(user.pointsBalance) + contest.pointsToJoin;
      user.lifetimePoints = Number(user.lifetimePoints) + contest.pointsToJoin;

      if (user.lifetimePoints >= 5000) {
        user.currentTier = UserLevel.PLATINUM;
      } else if (user.lifetimePoints >= 2000) {
        user.currentTier = UserLevel.GOLD;
      } else if (user.lifetimePoints >= 1000) {
        user.currentTier = UserLevel.SILVER;
      }

      await entityManager.save(user);

      const member = entityManager.create(ContestMember, {
        contestId,
        userId,
        pointsEarned: contest.pointsToJoin,
      });
      await entityManager.save(member);

      contest.filledSlots += 1;
      await entityManager.save(contest);

      return { user, contest, member };
    });
  }
}
