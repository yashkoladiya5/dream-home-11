import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, ILike } from 'typeorm';
import { ConsentService } from '../common/consent/consent.service';
import { ConsentType } from '../common/entities/consent-record.entity';
import { User, UserLevel } from './entities/user.entity';
import { ContestMember } from '../contests/entities/contest-member.entity';
import { Contest } from '../contests/entities/contest.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { CompensationLog } from '../compensation/entities/compensation.entity';
import { PointsEngineService } from '../points/points-engine.service';
import { EncryptionService } from '../common/encryption/encryption.service';
import { maskBankAccount, maskUpi } from '../common/encryption/pii-transform';
import { WalletService } from '../wallet/wallet.service';
import { randomBytes } from 'crypto';

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
    @InjectRepository(CompensationLog)
    private readonly compensationLogRepo: Repository<CompensationLog>,
    private readonly dataSource: DataSource,
    private readonly pointsEngineService: PointsEngineService,
    private readonly encryptionService: EncryptionService,
    private readonly consentService: ConsentService,
    @Inject(forwardRef(() => WalletService))
    private readonly walletService: WalletService,
  ) {}

  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { phoneNumber },
      select: {
        id: true,
        phoneNumber: true,
        fullName: true,
        isActive: true,
        referralCode: true,
        role: true,
        password: true,
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: { kyc: true, wallet: true },
      select: {
        id: true,
        phoneNumber: true,
        fullName: true,
        walletBalanceInr: true,
        pointsBalance: true,
        lifetimePoints: true,
        currentTier: true,
        avatarUrl: true,
        isActive: true,
        role: true,
        kyc: { status: true },
        wallet: { id: true, balanceInr: true, pointsBalance: true },
      },
    });
  }

  async upsertUser(phoneNumber: string, deviceId: string): Promise<User> {
    let user = await this.findByPhoneNumber(phoneNumber);

    if (user) {
      user.deviceId = deviceId;
      return this.userRepository.save(user);
    }

    let referralCode: string;
    let exists: User | null;
    do {
      referralCode = randomBytes(4).toString('hex').toUpperCase();
      exists = await this.userRepository.findOne({ where: { referralCode } });
    } while (exists);

    user = this.userRepository.create({
      phoneNumber,
      deviceId,
      referralCode,
      currentTier: UserLevel.BRONZE,
      lifetimePoints: 0,
      pointsBalance: 0,
      walletBalanceInr: 0.0,
      isActive: true,
    });

    const savedUser = await this.userRepository.save(user);
    await this.walletService.initializeWallet(savedUser.id);
    return savedUser;
  }

  async addCash(userId: string, amount: number): Promise<User> {
    const { wallet } = await this.walletService.creditBalance(userId, amount, {
      type: 'deposit',
      id: '',
      description: `Deposit of \u20B9${amount}`,
    });
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    user.walletBalanceInr = Number(wallet.balanceInr);
    return this.userRepository.save(user);
  }

  async awardPoints(userId: string, points: number): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    await this.walletService.creditPoints(userId, points);

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

    if (data.bankAccountNumber !== undefined)
      user.bankAccountNumber = this.encryptionService.encrypt(data.bankAccountNumber);
    if (data.bankIfsc !== undefined) user.bankIfsc = data.bankIfsc;
    if (data.bankName !== undefined) user.bankName = data.bankName;
    if (data.upiId !== undefined)
      user.upiId = this.encryptionService.encrypt(data.upiId);

    return this.userRepository.save(user);
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { kyc: true, wallet: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let decryptedBankAccount: string | undefined;
    let decryptedUpi: string | undefined;
    try {
      if (user.bankAccountNumber) {
        decryptedBankAccount = this.encryptionService.decrypt(user.bankAccountNumber);
      }
    } catch {
      decryptedBankAccount = undefined;
    }
    try {
      if (user.upiId) {
        decryptedUpi = this.encryptionService.decrypt(user.upiId);
      }
    } catch {
      decryptedUpi = undefined;
    }

    return {
      id: user.id,
      phoneNumber: user.phoneNumber,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      currentTier: user.currentTier,
      lifetimePoints: user.lifetimePoints,
      weeklyPoints: user.weeklyPoints,
      monthlyPoints: user.monthlyPoints,
      walletBalanceInr: user.walletBalanceInr,
      pointsBalance: user.pointsBalance,
      isActive: user.isActive,
      state: user.state,
      referralCode: user.referralCode,
      role: user.role,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastStreakDate: user.lastStreakDate,
      bankAccountNumber: decryptedBankAccount
        ? maskBankAccount(decryptedBankAccount)
        : null,
      bankIfsc: user.bankIfsc,
      bankName: user.bankName,
      upiId: decryptedUpi ? maskUpi(decryptedUpi) : null,
      kyc: user.kyc,
      wallet: user.wallet
        ? {
            id: user.wallet.id,
            balanceInr: user.wallet.balanceInr,
            lockedBalanceInr: user.wallet.lockedBalanceInr,
            pointsBalance: user.wallet.pointsBalance,
          }
        : null,
    };
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

    const { tier, multiplier } = this.pointsEngineService.getTierInfo(
      user.lifetimePoints,
    );
    const { nextTier, nextMultiplier, pointsToNextTier } =
      this.pointsEngineService.getNextTierInfo(user.lifetimePoints);

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
    const memberEntries = await this.contestMemberRepository.find({
      where: { userId },
    });
    const contestIds = memberEntries.map((m) => m.contestId);

    const totalContestsJoined = memberEntries.length;
    const totalPointsEarned = memberEntries.reduce(
      (sum, m) => sum + m.pointsEarned,
      0,
    );

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

    // Batch load all members for all contests at once
    const allMembers = await this.contestMemberRepository.find({
      where: { contestId: In(contestIds) },
      order: { pointsEarned: 'DESC', joinedAt: 'ASC' },
    });

    // Build a map: contestId -> member[]
    const membersByContest = new Map<string, typeof allMembers>();
    for (const m of allMembers) {
      if (!membersByContest.has(m.contestId))
        membersByContest.set(m.contestId, []);
      membersByContest.get(m.contestId)!.push(m);
    }

    // Calculate stats from the map
    for (const contestId of contestIds) {
      const contestMembers = membersByContest.get(contestId) || [];
      const rank = contestMembers.findIndex((m) => m.userId === userId) + 1;
      totalRanks += rank || 1;
      if (rank > 0 && rank < bestRank) bestRank = rank;
      if (rank === 1) wonCount++;
    }

    const contests = await this.contestRepository.find({
      where: { id: In(contestIds) },
    });
    const totalEntryFeesSpent = contests.reduce(
      (sum, c) => sum + Number(c.entryFeeInr),
      0,
    );

    const averageRank =
      Math.round((totalRanks / totalContestsJoined) * 10) / 10;
    const winRate =
      Math.round((wonCount / totalContestsJoined) * 100 * 10) / 10;

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

    if (members.length === 0) return { contests: [] };

    const contestIds = members.map((m) => m.contestId);

    // Batch rank calculation using window function
    const rankResults = await this.contestMemberRepository
      .createQueryBuilder('cm')
      .select('cm.contestId', 'contestId')
      .addSelect(
        'RANK() OVER (PARTITION BY cm.contestId ORDER BY cm.pointsEarned DESC)',
        'rank',
      )
      .where('cm.userId = :userId', { userId })
      .andWhere('cm.contestId IN (:...contestIds)', { contestIds })
      .getRawMany();

    const rankMap = new Map(
      rankResults.map((r) => [r.contestId, parseInt(r.rank)]),
    );

    const contests = members.map((member) => {
      const myPoints = member.pointsEarned;
      const myRank = rankMap.get(member.contestId) ?? 1;
      return { ...member.contest, myPoints, myRank };
    });

    return { contests };
  }

  async acceptTerms(userId: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.termsAcceptedAt = new Date();
    const saved = await this.userRepository.save(user);
    await this.consentService.recordConsent(userId, ConsentType.TERMS_OF_SERVICE, true);
    return saved;
  }

  async getMyHomeContests(userId: string): Promise<{ contests: any[] }> {
    const members = await this.contestMemberRepository.find({
      where: { userId },
      relations: { contest: true },
      order: { joinedAt: 'DESC' },
    });

    if (members.length === 0) return { contests: [] };

    const contestIds = members.map((m) => m.contestId);

    // Batch rank calculation using window function
    const rankResults = await this.contestMemberRepository
      .createQueryBuilder('cm')
      .select('cm.contestId', 'contestId')
      .addSelect(
        'RANK() OVER (PARTITION BY cm.contestId ORDER BY cm.pointsEarned DESC)',
        'rank',
      )
      .where('cm.userId = :userId', { userId })
      .andWhere('cm.contestId IN (:...contestIds)', { contestIds })
      .getRawMany();
    const rankMap = new Map(
      rankResults.map((r) => [r.contestId, parseInt(r.rank)]),
    );

    // Batch total members count per contest
    const memberCounts = await this.contestMemberRepository
      .createQueryBuilder('cm')
      .select('cm.contestId', 'contestId')
      .addSelect('COUNT(*)', 'count')
      .where('cm.contestId IN (:...contestIds)', { contestIds })
      .groupBy('cm.contestId')
      .getRawMany();
    const totalMembersMap = new Map(
      memberCounts.map((m) => [m.contestId, parseInt(m.count)]),
    );

    // Batch first place points per contest
    const firstPlaceResults = await this.contestMemberRepository
      .createQueryBuilder('cm')
      .select('cm.contestId', 'contestId')
      .addSelect('MAX(cm.pointsEarned)', 'maxPoints')
      .where('cm.contestId IN (:...contestIds)', { contestIds })
      .groupBy('cm.contestId')
      .getRawMany();
    const firstPlaceMap = new Map(
      firstPlaceResults.map((r) => [r.contestId, parseInt(r.maxPoints)]),
    );

    const contests = members.map((member) => {
      const contest = member.contest;
      if (!contest) return null;

      const myPoints = member.pointsEarned;
      const myRank = rankMap.get(member.contestId) ?? 1;
      const totalMembers = totalMembersMap.get(member.contestId) ?? 0;
      const maxPoints = firstPlaceMap.get(member.contestId) ?? myPoints;
      const pointsToFirst = maxPoints > myPoints ? maxPoints - myPoints : null;

      let progressPercentage = 0;
      if (contest.status === 'running') {
        const now = new Date().getTime();
        const start = new Date(contest.startTime).getTime();
        const end = new Date(contest.endTime).getTime();
        const total = end - start;
        const elapsed = now - start;
        progressPercentage =
          total > 0
            ? Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)))
            : 0;
      } else if (contest.status === 'completed') {
        progressPercentage = 100;
      }

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
    });

    // Filter out nulls and sort: running first, upcoming second, then by start time ascending
    const filtered = contests
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .sort((a, b) => {
        const statusOrder: Record<string, number> = {
          running: 0,
          upcoming: 1,
          completed: 2,
          cancelled: 3,
        };
        const aOrder = statusOrder[a.status] ?? 99;
        const bOrder = statusOrder[b.status] ?? 99;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return (
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
      });

    return { contests: filtered };
  }

  async searchUsers(
    query: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ users: Partial<User>[]; total: number }> {
    const [users, total] = await this.userRepository.findAndCount({
      where: [{ fullName: ILike(`%${query.trim()}%`) }],
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

  async getUserCompensations(
    userId: string,
    query: { page?: number; limit?: number },
  ) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const [logs, total] = await this.compensationLogRepo.findAndCount({
      where: { userId },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: { contest: true },
    });

    return {
      compensations: logs.map((l) => ({
        id: l.id,
        contestId: l.contestId,
        contestTitle: l.contest?.title || null,
        entryFeeInr: Number(l.entryFeeInr),
        compensationPoints: l.compensationPoints,
        status: l.status,
        processedAt: l.processedAt,
        createdAt: l.createdAt,
      })),
      total,
      page,
      limit,
    };
  }
}
