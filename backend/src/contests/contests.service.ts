import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  DataSource,
  Like,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
  In,
} from 'typeorm';
import { randomBytes } from 'crypto';
import { Contest, ContestStatus, ContestType } from './entities/contest.entity';
import { ContestMember } from './entities/contest-member.entity';
import { User, UserLevel } from '../users/entities/user.entity';
import { PointsEngineService } from '../points/points-engine.service';
import { Transaction } from '../transactions/entities/transaction.entity';
import { QueryContestsDto } from './dto/query-contests.dto';
import { CreatePrivateContestDto } from './dto/create-private-contest.dto';

@Injectable()
export class ContestsService {
  static readonly DEFAULT_POINTS_NORMAL = 50;
  static readonly DEFAULT_POINTS_PREMIUM = 100;

  constructor(
    @InjectRepository(Contest)
    private readonly contestRepository: Repository<Contest>,
    @InjectRepository(ContestMember)
    private readonly contestMemberRepository: Repository<ContestMember>,
    private readonly dataSource: DataSource,
    private readonly pointsEngineService: PointsEngineService,
  ) {}

  async findAll(query: QueryContestsDto): Promise<{
    contests: Contest[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      type,
      status,
      page = 1,
      limit = 20,
      search,
      sortBy,
      sortOrder,
      prizeMin,
      prizeMax,
      feeMin,
      feeMax,
    } = query;
    const where: Record<string, unknown> = {};

    if (type) {
      where.type = type;
    }
    if (status) {
      where.status = status;
    }
    if (search) {
      where.title = Like(`%${search}%`);
    }
    if (prizeMin !== undefined && prizeMax !== undefined) {
      where.prize = Between(prizeMin, prizeMax);
    } else {
      if (prizeMin !== undefined) where.prize = MoreThanOrEqual(prizeMin);
      if (prizeMax !== undefined) where.prize = LessThanOrEqual(prizeMax);
    }
    if (feeMin !== undefined && feeMax !== undefined) {
      where.entryFeeInr = Between(feeMin, feeMax);
    } else {
      if (feeMin !== undefined) where.entryFeeInr = MoreThanOrEqual(feeMin);
      if (feeMax !== undefined) where.entryFeeInr = LessThanOrEqual(feeMax);
    }

    const order: Record<string, string> = {};
    if (sortBy) {
      const sortMap: Record<string, string> = {
        entry_fee: 'entryFeeInr',
        prize_pool: 'prize',
        start_time: 'startTime',
        created_at: 'createdAt',
      };
      order[sortMap[sortBy] || 'startTime'] = sortOrder || 'ASC';
    } else {
      order.startTime = 'ASC';
    }

    const [contests, total] = await this.contestRepository.findAndCount({
      where,
      order,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        entryFeeInr: true,
        prize: true,
        maxSlots: true,
        filledSlots: true,
        status: true,
        startTime: true,
        endTime: true,
        type: true,
        inviteCode: true,
        rules: true,
      },
    });

    return { contests, total, page, limit };
  }

  async findById(id: string): Promise<Contest | null> {
    return this.contestRepository.findOne({
      where: { id },
      select: {
        id: true,
        title: true,
        entryFeeInr: true,
        prize: true,
        maxSlots: true,
        filledSlots: true,
        status: true,
        startTime: true,
        endTime: true,
        type: true,
        rules: true,
      },
    });
  }

  async findByCode(code: string): Promise<Contest | null> {
    return this.contestRepository.findOne({ where: { inviteCode: code } });
  }

  async getMembers(
    contestId: string,
  ): Promise<{ members: ContestMember[]; total: number }> {
    const contest = await this.contestRepository.findOne({
      where: { id: contestId },
      select: {
        id: true,
        title: true,
        entryFeeInr: true,
        prize: true,
        maxSlots: true,
        filledSlots: true,
        startTime: true,
        status: true,
      },
    });
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

  async findByInviteCode(
    code: string,
  ): Promise<{ contest: Contest; canJoin: boolean; reason: string | null }> {
    const contest = await this.contestRepository.findOne({
      where: { inviteCode: code.toUpperCase() },
      select: {
        id: true,
        title: true,
        entryFeeInr: true,
        prize: true,
        maxSlots: true,
        filledSlots: true,
        status: true,
        startTime: true,
        type: true,
        rules: true,
      },
    });
    if (!contest) {
      throw new NotFoundException('Contest not found for this invite code');
    }

    let canJoin = true;
    let reason: string | null = null;

    if (contest.status === ContestStatus.COMPLETED) {
      canJoin = false;
      reason = 'This contest has already ended';
    } else if (contest.filledSlots >= contest.maxSlots) {
      canJoin = false;
      reason = 'This contest is already full';
    }

    return { contest, canJoin, reason };
  }

  async createPrivateContest(
    userId: string,
    dto: CreatePrivateContestDto,
  ): Promise<{ contest: Contest; inviteCode: string }> {
    const inviteCode = randomBytes(4).toString('hex').toUpperCase().slice(0, 8);

    return this.dataSource.transaction(async (entityManager) => {
      const now = new Date();
      const pointsToJoin =
        dto.pointsToJoin ?? ContestsService.DEFAULT_POINTS_NORMAL;
      const contest = entityManager.create(Contest, {
        title: dto.title,
        type: ContestType.PRIVATE,
        entryFeeInr: dto.entryFeeInr,
        pointsToJoin,
        maxSlots: dto.maxSlots,
        filledSlots: 0,
        prize: dto.prize,
        badgeText: 'PRIVATE',
        badgeColor: '#F97316',
        rules:
          dto.rules ||
          '1. Entry fee is non-refundable.\n2. This is a private contest — invite only.\n3. Winners will be announced after the contest ends.\n4. Must complete KYC within 7 days of winning.\n5. Dream11 reserves the right to modify these rules.\n6. By joining, you agree to all terms and conditions.',
        inviteCode,
        startTime: dto.startTime || now,
        endTime:
          dto.endTime || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        status: ContestStatus.RUNNING,
      });

      await entityManager.save(contest);

      const member = entityManager.create(ContestMember, {
        contestId: contest.id,
        userId,
        pointsEarned: 0,
      });
      await entityManager.save(member);

      contest.filledSlots = 1;
      await entityManager.save(contest);

      return { contest, inviteCode };
    });
  }

  async getLeaderboard(contestId: string): Promise<{ leaderboard: any[] }> {
    const members = await this.contestMemberRepository.find({
      where: { contestId },
      relations: { user: true },
      order: { pointsEarned: 'DESC', joinedAt: 'ASC' },
    });

    const leaderboard = members.map((member, index) => ({
      userId: member.userId,
      userName: member.user?.fullName || 'Anonymous',
      points: member.pointsEarned,
      rank: index + 1,
    }));

    return { leaderboard };
  }

  async getCompletedContestData(contestId: string): Promise<{
    contest: Contest;
    members: {
      userId: string;
      userName: string;
      points: number;
      rank: number;
    }[];
    stats: {
      totalParticipants: number;
      totalPointsAwarded: number;
      averagePoints: number;
    };
  }> {
    const contest = await this.contestRepository.findOne({
      where: { id: contestId },
    });
    if (!contest) {
      throw new NotFoundException('Contest not found');
    }

    const members = await this.contestMemberRepository.find({
      where: { contestId },
      relations: { user: true },
      order: { pointsEarned: 'DESC', joinedAt: 'ASC' },
    });

    const memberList = members.map((m, index) => ({
      userId: m.userId,
      userName: m.user?.fullName || 'Anonymous',
      points: m.pointsEarned,
      rank: index + 1,
    }));

    const totalPointsAwarded = members.reduce(
      (sum, m) => sum + m.pointsEarned,
      0,
    );

    return {
      contest,
      members: memberList,
      stats: {
        totalParticipants: members.length,
        totalPointsAwarded,
        averagePoints:
          members.length > 0
            ? Math.round(totalPointsAwarded / members.length)
            : 0,
      },
    };
  }

  async joinContest(
    userId: string,
    contestId: string,
  ): Promise<{ user: User; contest: Contest; member: ContestMember }> {
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

      const multiplier = this.pointsEngineService.getMultiplier(
        user.currentTier,
      );
      const finalPoints = this.pointsEngineService.calculatePoints(
        contest.pointsToJoin,
        user.currentTier,
      );
      user.walletBalanceInr =
        Number(user.walletBalanceInr) - Number(contest.entryFeeInr);
      user.pointsBalance = Number(user.pointsBalance) + finalPoints;
      user.lifetimePoints = Number(user.lifetimePoints) + finalPoints;

      if (user.lifetimePoints >= 15000) {
        user.currentTier = UserLevel.PLATINUM;
      } else if (user.lifetimePoints >= 5000) {
        user.currentTier = UserLevel.GOLD;
      } else if (user.lifetimePoints >= 1000) {
        user.currentTier = UserLevel.SILVER;
      }

      await entityManager.save(user);

      await this.pointsEngineService.logPointActionWithEntityManager(
        entityManager,
        userId,
        'contest_join',
        contest.pointsToJoin,
        multiplier,
        finalPoints,
      );

      await entityManager.save(
        Transaction,
        entityManager.create(Transaction, {
          userId,
          type: 'entry_fee',
          cashAmount: Number(contest.entryFeeInr),
          pointsAmount: finalPoints,
          cashBalanceBefore:
            Number(user.walletBalanceInr) + Number(contest.entryFeeInr),
          cashBalanceAfter: Number(user.walletBalanceInr),
          pointsBalanceBefore: Number(user.pointsBalance) - finalPoints,
          pointsBalanceAfter: Number(user.pointsBalance),
          description: `Joined contest: ${contest.title}`,
          referenceType: 'contest',
          referenceId: contestId,
          status: 'completed',
        }),
      );

      const member = entityManager.create(ContestMember, {
        contestId,
        userId,
        pointsEarned: finalPoints,
      });
      await entityManager.save(member);

      contest.filledSlots += 1;
      await entityManager.save(contest);

      return { user, contest, member };
    });
  }

  async getContestWinnersDetail(contestId: string): Promise<{
    contestId: string;
    contestTitle: string;
    prize: string;
    completedAt: Date;
    totalParticipants: number;
    winners: {
      userId: string;
      userName: string;
      points: number;
      rank: number;
    }[];
  }> {
    const contest = await this.contestRepository.findOne({
      where: { id: contestId },
    });
    if (!contest) {
      throw new NotFoundException('Contest not found');
    }

    if (contest.status !== ContestStatus.COMPLETED) {
      throw new BadRequestException('Contest is not completed yet');
    }

    const members = await this.contestMemberRepository.find({
      where: { contestId },
      relations: { user: true },
      order: { pointsEarned: 'DESC' },
      take: 3,
    });

    const winners = members.map((m, index) => ({
      userId: m.userId,
      userName: m.user?.fullName || 'Anonymous',
      points: m.pointsEarned,
      rank: index + 1,
    }));

    const totalParticipants = await this.contestMemberRepository.count({
      where: { contestId },
    });

    return {
      contestId: contest.id,
      contestTitle: contest.title,
      prize: contest.prize || 'N/A',
      completedAt: contest.endTime,
      totalParticipants,
      winners,
    };
  }

  async getWinnersHistory(): Promise<
    {
      contestId: string;
      contestTitle: string;
      prize: string;
      completedAt: Date;
      winners: {
        userId: string;
        userName: string;
        points: number;
        rank: number;
      }[];
    }[]
  > {
    const completedContests = await this.contestRepository.find({
      where: { status: ContestStatus.COMPLETED },
      select: { id: true, title: true, endTime: true, prize: true },
      take: 20,
      order: { endTime: 'DESC' },
    });

    if (completedContests.length === 0) return [];

    const contestIds = completedContests.map((c) => c.id);
    const allMembers = await this.contestMemberRepository.find({
      where: { contestId: In(contestIds) },
      relations: { user: true },
      order: { pointsEarned: 'DESC', joinedAt: 'ASC' },
      select: {
        id: true,
        contestId: true,
        pointsEarned: true,
        userId: true,
        user: { id: true, fullName: true, avatarUrl: true },
      },
    });

    const membersByContest = new Map<string, typeof allMembers>();
    for (const member of allMembers) {
      const list = membersByContest.get(member.contestId) || [];
      list.push(member);
      membersByContest.set(member.contestId, list);
    }

    const result = completedContests.map((contest) => {
      const members = (membersByContest.get(contest.id) || []).slice(0, 3);
      const winners = members.map((m, index) => ({
        userId: m.userId,
        userName: m.user?.fullName || 'Anonymous',
        points: m.pointsEarned,
        rank: index + 1,
      }));

      return {
        contestId: contest.id,
        contestTitle: contest.title,
        prize: contest.prize || 'N/A',
        completedAt: contest.endTime,
        winners,
      };
    });

    return result;
  }

  calculatePrizes(
    contest: Contest,
    members: ContestMember[],
  ): { userId: string; prize: string; amount: number }[] {
    const prizePool =
      Number(contest.entryFeeInr) *
      Math.min(contest.maxSlots, Math.max(members.length, 1));
    const results: { userId: string; prize: string; amount: number }[] = [];
    const topCount = Math.min(10, members.length);

    for (let i = 0; i < topCount; i++) {
      const member = members[i];
      let amount = 0;
      let prizeType = '';

      if (i === 0) {
        amount = Math.round(prizePool * 0.8 * 100) / 100;
        prizeType = 'HOME';
      } else if (i === 1) {
        amount = Math.round(prizePool * 0.15 * 100) / 100;
        prizeType = 'CAR';
      } else {
        const remainingCount = topCount - 2;
        amount =
          remainingCount > 0
            ? Math.round(((prizePool * 0.05) / remainingCount) * 100) / 100
            : 0;
        prizeType = 'CASH';
      }

      results.push({ userId: member.userId, prize: prizeType, amount });
    }

    return results;
  }

  async completeContest(contestId: string): Promise<{
    contest: Contest;
    winners: { userId: string; prize: string; amount: number }[];
  }> {
    return this.dataSource.transaction(async (manager) => {
      const contest = await manager.findOne(Contest, {
        where: { id: contestId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!contest) throw new NotFoundException('Contest not found');
      if (contest.status !== ContestStatus.RUNNING && contest.status !== ContestStatus.FILLED)
        throw new BadRequestException('Contest is not in running status');

      const members = await manager.find(ContestMember, {
        where: { contestId },
        relations: { user: true },
        order: { pointsEarned: 'DESC', joinedAt: 'ASC' },
        lock: { mode: 'pessimistic_write' },
      });

      const winners = this.calculatePrizes(contest, members);

      for (const winner of winners) {
        if (winner.amount > 0) {
          const user = await manager.findOne(User, {
            where: { id: winner.userId },
            lock: { mode: 'pessimistic_write' },
          });

          if (user) {
            const balanceBefore = Number(user.walletBalanceInr);
            user.walletBalanceInr = balanceBefore + winner.amount;
            await manager.save(user);

            const transaction = manager.create(Transaction, {
              userId: winner.userId,
              type: 'prize',
              cashAmount: winner.amount,
              cashBalanceBefore: balanceBefore,
              cashBalanceAfter: Number(user.walletBalanceInr),
              description: `Prize for contest: ${contest.title} (${winner.prize})`,
              referenceType: 'contest',
              referenceId: contestId,
              status: 'completed',
            });
            await manager.save(transaction);
          }
        }
      }

      for (const member of members) {
        if (member.user) {
          const multiplier = this.pointsEngineService.getMultiplier(
            member.user.currentTier,
          );
          const finalPoints = this.pointsEngineService.calculatePoints(
            100,
            member.user.currentTier,
          );

          await this.pointsEngineService.logPointActionWithEntityManager(
            manager,
            member.userId,
            'contest_complete',
            100,
            multiplier,
            finalPoints,
          );

          member.user.pointsBalance =
            Number(member.user.pointsBalance) + finalPoints;
          member.user.lifetimePoints =
            Number(member.user.lifetimePoints) + finalPoints;

          if (member.user.lifetimePoints >= 15000) {
            member.user.currentTier = UserLevel.PLATINUM;
          } else if (member.user.lifetimePoints >= 5000) {
            member.user.currentTier = UserLevel.GOLD;
          } else if (member.user.lifetimePoints >= 1000) {
            member.user.currentTier = UserLevel.SILVER;
          }

          await manager.save(member.user);
        }
      }

      contest.status = ContestStatus.COMPLETED;
      await manager.save(contest);

      return { contest, winners };
    });
  }
}
