import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, ILike } from 'typeorm';
import { User, UserLevel } from './entities/user.entity';
import { ContestMember } from '../contests/entities/contest-member.entity';
import { Contest } from '../contests/entities/contest.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { PointsEngineService } from '../points/points-engine.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ContestMember)
    private readonly contestMemberRepository: Repository<ContestMember>,
    @InjectRepository(Contest)
    private readonly contestRepository: Repository<Contest>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    private readonly pointsEngineService: PointsEngineService,
  ) {}

  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { phoneNumber } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: { kyc: true },
    });
  }

  async upsertUser(phoneNumber: string, deviceId: string): Promise<User> {
    let user = await this.findByPhoneNumber(phoneNumber);

    if (user) {
      user.deviceId = deviceId;
      return this.userRepository.save(user);
    }

    user = this.userRepository.create({
      phoneNumber,
      deviceId,
      currentTier: UserLevel.BRONZE,
      lifetimePoints: 0,
      pointsBalance: 0,
      walletBalanceInr: 0.0,
      isActive: true,
    });

    return this.userRepository.save(user);
  }

  async addCash(userId: string, amount: number): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const balanceBefore = Number(user.walletBalanceInr);
    user.walletBalanceInr = balanceBefore + amount;
    const saved = await this.userRepository.save(user);

    await this.transactionRepo.save(this.transactionRepo.create({
      userId,
      type: 'deposit',
      cashAmount: amount,
      cashBalanceBefore: balanceBefore,
      cashBalanceAfter: Number(saved.walletBalanceInr),
      description: `Deposit of \u20B9${amount}`,
      status: 'completed',
    }));

    return saved;
  }

  async joinContest(userId: string, entryFee: number, pointsEarned: number): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (Number(user.walletBalanceInr) < entryFee) {
      throw new BadRequestException('Insufficient wallet balance');
    }
    const multiplier = this.pointsEngineService.getMultiplier(user.currentTier);
    const finalPoints = this.pointsEngineService.calculatePoints(pointsEarned, user.currentTier);
    user.walletBalanceInr = Number(user.walletBalanceInr) - entryFee;
    user.pointsBalance = Number(user.pointsBalance) + finalPoints;
    user.lifetimePoints = Number(user.lifetimePoints) + finalPoints;

    // Update tier rank based on lifetime points
    if (user.lifetimePoints >= 5000) {
      user.currentTier = UserLevel.PLATINUM;
    } else if (user.lifetimePoints >= 2000) {
      user.currentTier = UserLevel.GOLD;
    } else if (user.lifetimePoints >= 1000) {
      user.currentTier = UserLevel.SILVER;
    }

    await this.userRepository.save(user);

    await this.pointsEngineService.logPointAction(userId, 'contest_join', pointsEarned, multiplier, finalPoints);

    return user;
  }

  async redeemReward(userId: string, pointsCost: number): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (Number(user.pointsBalance) < pointsCost) {
      throw new BadRequestException('Insufficient points balance');
    }
    user.pointsBalance = Number(user.pointsBalance) - pointsCost;
    return this.userRepository.save(user);
  }

  async awardPoints(userId: string, points: number): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    user.pointsBalance = Number(user.pointsBalance) + points;
    user.lifetimePoints = Number(user.lifetimePoints) + points;

    if (user.lifetimePoints >= 5000) {
      user.currentTier = UserLevel.PLATINUM;
    } else if (user.lifetimePoints >= 2000) {
      user.currentTier = UserLevel.GOLD;
    } else if (user.lifetimePoints >= 1000) {
      user.currentTier = UserLevel.SILVER;
    }

    return this.userRepository.save(user);
  }

  async updateUser(user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  async updateBankDetails(
    userId: string,
    data: {
      bankAccountNumber?: string;
      bankIfsc?: string;
      bankName?: string;
      upiId?: string;
    },
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (data.bankAccountNumber !== undefined) user.bankAccountNumber = data.bankAccountNumber;
    if (data.bankIfsc !== undefined) user.bankIfsc = data.bankIfsc;
    if (data.bankName !== undefined) user.bankName = data.bankName;
    if (data.upiId !== undefined) user.upiId = data.upiId;

    return this.userRepository.save(user);
  }

  async getProfile(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { kyc: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateProfile(
    userId: string,
    updateData: { fullName?: string; email?: string; avatarUrl?: string },
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateData.fullName !== undefined) {
      user.fullName = updateData.fullName;
    }
    if (updateData.email !== undefined) {
      if (updateData.email && !updateData.email.includes('@')) {
        throw new BadRequestException('Invalid email format');
      }
      user.email = updateData.email;
    }
    if (updateData.avatarUrl !== undefined) {
      user.avatarUrl = updateData.avatarUrl;
    }

    return this.userRepository.save(user);
  }

  async getMultiplierInfo(userId: string): Promise<{
    currentTier: string;
    currentMultiplier: number;
    lifetimePoints: number;
    pointsToNextTier: number | null;
    nextTier: string | null;
    nextMultiplier: number | null;
  }> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const { tier, multiplier } = this.pointsEngineService.getTierInfo(user.lifetimePoints);
    const { nextTier, nextMultiplier, pointsToNextTier } = this.pointsEngineService.getNextTierInfo(user.lifetimePoints);

    return {
      currentTier: tier,
      currentMultiplier: multiplier,
      lifetimePoints: user.lifetimePoints,
      pointsToNextTier,
      nextTier,
      nextMultiplier,
    };
  }

  async getUserStats(userId: string) {
    const memberEntries = await this.contestMemberRepository.find({ where: { userId } });
    const contestIds = memberEntries.map(m => m.contestId);

    const totalContestsJoined = memberEntries.length;
    const totalPointsEarned = memberEntries.reduce((sum, m) => sum + m.pointsEarned, 0);

    if (totalContestsJoined === 0) {
      return {
        totalContestsJoined: 0,
        totalContestsWon: 0,
        totalPointsEarned: 0,
        totalEntryFeesSpent: 0,
        averageRank: 0,
        bestRank: null,
        winRate: 0,
      };
    }

    let wonCount = 0;
    let totalRanks = 0;
    let bestRank = Number.MAX_SAFE_INTEGER;

    for (const contestId of contestIds) {
      const allMembers = await this.contestMemberRepository.find({
        where: { contestId },
        order: { pointsEarned: 'DESC', joinedAt: 'ASC' },
      });
      const rank = allMembers.findIndex(m => m.userId === userId) + 1;
      totalRanks += rank;
      if (rank < bestRank) bestRank = rank;
      if (rank === 1) wonCount++;
    }

    const contests = await this.contestRepository.find({
      where: { id: In(contestIds) },
    });
    const totalEntryFeesSpent = contests.reduce(
      (sum, c) => sum + Number(c.entryFeeInr),
      0,
    );

    const averageRank = Math.round((totalRanks / totalContestsJoined) * 10) / 10;
    const winRate = Math.round((wonCount / totalContestsJoined) * 100 * 10) / 10;

    return {
      totalContestsJoined,
      totalContestsWon: wonCount,
      totalPointsEarned,
      totalEntryFeesSpent,
      averageRank,
      bestRank,
      winRate,
    };
  }

  async getMyContests(userId: string): Promise<{ contests: any[] }> {
    const members = await this.contestMemberRepository.find({
      where: { userId },
      relations: { contest: true },
      order: { joinedAt: 'DESC' },
    });

    const contests = await Promise.all(members.map(async (member) => {
      const myPoints = member.pointsEarned;

      const rankResult = await this.contestMemberRepository
        .createQueryBuilder('cm')
        .select('COUNT(*)', 'rank')
        .where('cm.contestId = :contestId', { contestId: member.contestId })
        .andWhere('cm.pointsEarned > :myPoints', { myPoints })
        .getRawOne();
      const myRank = Number(rankResult?.rank || 0) + 1;

      return { ...member.contest, myPoints, myRank };
    }));

    return { contests };
  }

  async getMyHomeContests(userId: string): Promise<{ contests: any[] }> {
    const members = await this.contestMemberRepository.find({
      where: { userId },
      relations: { contest: true },
      order: { joinedAt: 'DESC' },
    });

    const contests = await Promise.all(members.map(async (member) => {
      const contest = member.contest;
      if (!contest) return null;

      const myPoints = member.pointsEarned;

      const rankResult = await this.contestMemberRepository
        .createQueryBuilder('cm')
        .select('COUNT(*)', 'rank')
        .where('cm.contestId = :contestId', { contestId: member.contestId })
        .andWhere('cm.pointsEarned > :myPoints', { myPoints })
        .getRawOne();
      const myRank = Number(rankResult?.rank || 0) + 1;

      // Calculate total members in this contest
      const totalMembers = await this.contestMemberRepository.count({
        where: { contestId: member.contestId },
      });

      // Calculate time-based progress for running contests
      let progressPercentage = 0;
      if (contest.status === 'running') {
        const now = new Date().getTime();
        const start = new Date(contest.startTime).getTime();
        const end = new Date(contest.endTime).getTime();
        const total = end - start;
        const elapsed = now - start;
        progressPercentage = total > 0 ? Math.min(100, Math.max(0, Math.round((elapsed / total) * 100))) : 0;
      } else if (contest.status === 'completed') {
        progressPercentage = 100;
      }

      // Calculate points to first place
      const firstPlace = await this.contestMemberRepository.findOne({
        where: { contestId: member.contestId },
        order: { pointsEarned: 'DESC' },
      });
      const pointsToFirst = firstPlace && firstPlace.userId !== member.userId
        ? firstPlace.pointsEarned - myPoints
        : null;

      return {
        id: contest.id,
        title: contest.title,
        type: contest.type,
        entryFeeInr: contest.entryFeeInr,
        pointsToJoin: contest.pointsToJoin,
        maxSlots: contest.maxSlots,
        filledSlots: contest.filledSlots,
        prize: contest.prize,
        badgeText: contest.badgeText,
        badgeColor: contest.badgeColor,
        startTime: contest.startTime,
        endTime: contest.endTime,
        status: contest.status,
        inviteCode: contest.inviteCode,
        rules: contest.rules,
        myPoints,
        myRank,
        totalMembers,
        progressPercentage,
        pointsToFirst,
      };
    }));

    // Filter out nulls and sort: running first, upcoming second, then by start time ascending
    const filtered = contests
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .sort((a, b) => {
        const statusOrder: Record<string, number> = { running: 0, upcoming: 1, completed: 2, cancelled: 3 };
        const aOrder = statusOrder[a.status] ?? 99;
        const bOrder = statusOrder[b.status] ?? 99;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      });

    return { contests: filtered };
  }

  async searchUsers(query: string, page: number = 1, limit: number = 20): Promise<{ users: Partial<User>[]; total: number }> {
    const [users, total] = await this.userRepository.findAndCount({
      where: [
        { fullName: ILike(`%${query.trim()}%`) },
        { phoneNumber: ILike(`%${query.trim()}%`) },
      ],
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        currentTier: true,
        lifetimePoints: true,
      },
      order: { lifetimePoints: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { users, total };
  }
}

