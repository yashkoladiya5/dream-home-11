import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { Kyc } from '../kyc/entities/kyc.entity';
import { Contest, ContestStatus } from '../contests/entities/contest.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Withdrawal } from '../withdrawals/entities/withdrawal.entity';
import { SystemConfig } from '../config/entities/system-config.entity';
import { SupportTicket } from '../support/entities/support-ticket.entity';
import { CompensationService } from '../compensation/compensation.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Kyc)
    private readonly kycRepo: Repository<Kyc>,
    @InjectRepository(Contest)
    private readonly contestRepo: Repository<Contest>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(Withdrawal)
    private readonly withdrawalRepo: Repository<Withdrawal>,
    @InjectRepository(SystemConfig)
    private readonly configRepo: Repository<SystemConfig>,
    @InjectRepository(SupportTicket)
    private readonly supportTicketRepo: Repository<SupportTicket>,
    private readonly compensationService: CompensationService,
  ) {}

  async getUsers(query: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
    tier?: string;
    kycStatus?: string;
  }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { fullName: ILike(`%${query.search}%`) },
        { phoneNumber: ILike(`%${query.search}%`) },
        { email: ILike(`%${query.search}%`) },
      ];
    }
    if (query.role) where.role = query.role;
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.tier) where.currentTier = query.tier;

    const [users, total] = await this.userRepo.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: { kyc: true },
    });

    return {
      users: users.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        phoneNumber: u.phoneNumber,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        currentTier: u.currentTier,
        state: u.state,
        kycStatus: u.kyc?.status || 'not_submitted',
        walletBalanceInr: u.walletBalanceInr,
        pointsBalance: u.pointsBalance,
        createdAt: u.createdAt,
      })),
      total,
      page,
      limit,
    };
  }

  async getUserById(id: string) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: { kyc: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const contestCount = await this.contestRepo
      .createQueryBuilder('c')
      .innerJoin('contest_members', 'cm', 'cm.contest_id = c.id')
      .where('cm.user_id = :userId', { userId: id })
      .getCount();

    const deposits = await this.transactionRepo
      .createQueryBuilder('t')
      .select('COALESCE(SUM(t.cashAmount), 0)', 'total')
      .where('t.userId = :userId', { userId: id })
      .andWhere('t.type = :type', { type: 'deposit' })
      .getRawOne();

    const withdrawals = await this.withdrawalRepo
      .createQueryBuilder('w')
      .select('COALESCE(SUM(w.amount), 0)', 'total')
      .where('w.userId = :userId', { userId: id })
      .andWhere('w.status = :status', { status: 'approved' })
      .getRawOne();

    return {
      ...user,
      contestCount,
      totalDeposits: Number(deposits?.total || 0),
      totalWithdrawals: Number(withdrawals?.total || 0),
    };
  }

  async updateUser(id: string, dto: Partial<User>) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const allowedFields = ['role', 'isActive', 'currentTier', 'state', 'fullName', 'email'];
    for (const field of allowedFields) {
      if (dto[field as keyof typeof dto] !== undefined) {
        (user as any)[field] = dto[field as keyof typeof dto];
      }
    }
    await this.userRepo.save(user);
    return user;
  }

  async getDashboardStats() {
    const totalUsers = await this.userRepo.count();
    const activeUsers = await this.userRepo.count({ where: { isActive: true } });
    const adminUsers = await this.userRepo.count({ where: { role: UserRole.ADMIN } });

    const totalContests = await this.contestRepo.count();
    const runningContests = await this.contestRepo.count({ where: { status: ContestStatus.RUNNING } });
    const upcomingContests = await this.contestRepo.count({ where: { status: ContestStatus.UPCOMING } });
    const completedContests = await this.contestRepo.count({ where: { status: ContestStatus.COMPLETED } });

    const depositsAgg = await this.transactionRepo
      .createQueryBuilder('t')
      .select('COALESCE(SUM(t.cashAmount), 0)', 'total')
      .where("t.type = 'deposit'")
      .getRawOne();

    const pointsAgg = await this.transactionRepo
      .createQueryBuilder('t')
      .select('COALESCE(SUM(t.pointsAmount), 0)', 'total')
      .where("t.type = 'points_earned' OR t.type = 'points_bonus'")
      .getRawOne();

    const pendingKyc = await this.kycRepo.count({ where: { status: 'pending' as any } });
    const openTickets = await this.supportTicketRepo.count({ where: { status: 'open' as any } });

    const compensationStats = await this.compensationService.getCompensationStats();

    const recentUsers = await this.userRepo.find({
      order: { createdAt: 'DESC' },
      take: 10,
      relations: { kyc: true },
    });

    const recentTx = await this.transactionRepo.find({
      order: { createdAt: 'DESC' },
      take: 10,
      relations: { user: true },
    });

    return {
      totalUsers,
      activeUsers,
      adminUsers,
      totalContests,
      runningContests,
      upcomingContests,
      completedContests,
      totalDeposits: Number(depositsAgg?.total || 0),
      totalPointsEarned: Number(pointsAgg?.total || 0),
      pendingKycCount: pendingKyc,
      openSupportTickets: openTickets,
      totalCompensations: compensationStats.total,
      pendingCompensations: compensationStats.pending,
      totalCompensationPoints: compensationStats.totalPoints,
      recentUsers: recentUsers.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        phoneNumber: u.phoneNumber,
        role: u.role,
        isActive: u.isActive,
        kycStatus: u.kyc?.status || 'not_submitted',
        createdAt: u.createdAt,
      })),
      recentTransactions: recentTx.map((t) => ({
        id: t.id,
        userId: t.userId,
        type: t.type,
        cashAmount: t.cashAmount,
        pointsAmount: t.pointsAmount,
        description: t.description,
        createdAt: t.createdAt,
      })),
    };
  }

  async getContests(query: { page?: number; limit?: number; status?: string; type?: string; search?: string }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.search) where.title = ILike(`%${query.search}%`);

    const [contests, total] = await this.contestRepo.findAndCount({
      where,
      skip,
      take: limit,
      order: { startTime: 'DESC' },
    });

    return { contests, total, page, limit };
  }

  async getContestById(id: string) {
    const contest = await this.contestRepo.findOne({ where: { id } });
    if (!contest) throw new NotFoundException('Contest not found');

    const memberCount = await this.contestRepo
      .createQueryBuilder('c')
      .innerJoin('contest_members', 'cm', 'cm.contest_id = c.id')
      .where('c.id = :id', { id })
      .getCount();

    return { ...contest, memberCount };
  }

  async getKycSubmissions(query: { page?: number; limit?: number; status?: string; userId?: string }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.userId) where.userId = query.userId;

    const [submissions, total] = await this.kycRepo.findAndCount({
      where,
      skip,
      take: limit,
      order: { id: 'DESC' },
      relations: { user: true },
    });

    return { submissions, total, page, limit };
  }

  async approveKyc(id: string) {
    const kyc = await this.kycRepo.findOne({ where: { id } });
    if (!kyc) throw new NotFoundException('KYC submission not found');

    kyc.status = 'approved' as any;
    kyc.verifiedAt = new Date();
    await this.kycRepo.save(kyc);
    return kyc;
  }

  async rejectKyc(id: string, reason?: string) {
    const kyc = await this.kycRepo.findOne({ where: { id } });
    if (!kyc) throw new NotFoundException('KYC submission not found');

    kyc.status = 'rejected' as any;
    (kyc as any).rejectionReason = reason || 'KYC documents do not meet verification requirements';
    kyc.verifiedAt = new Date();
    await this.kycRepo.save(kyc);
    return kyc;
  }

  async updateSystemConfig(dto: Partial<SystemConfig>) {
    const configs = await this.configRepo.find();
    let config = configs[0];
    if (!config) {
      config = this.configRepo.create();
      await this.configRepo.save(config);
    }

    const allowedFields: (keyof SystemConfig)[] = [
      'appName', 'appVersion', 'apiVersion', 'environment',
      'maintenanceMode', 'minAppVersionAndroid', 'minAppVersionIos',
      'maxWithdrawalAmount', 'minWithdrawalAmount',
      'dailySpinEnabled', 'pollsEnabled', 'feedEnabled', 'chatEnabled', 'referralEnabled',
      'maxDailyPosts', 'maxDailySpins', 'supportEmail', 'restrictedStates',
    ];

    const filtered: any = {};
    for (const key of allowedFields) {
      if (key in dto) {
        filtered[key] = (dto as any)[key];
      }
    }
    if (Object.keys(filtered).length === 0) return config;

    await this.configRepo.update(config.id, filtered);
    return this.configRepo.findOne({ where: { id: config.id } });
  }

  async getSupportTickets(query: { page?: number; limit?: number; status?: string; category?: string }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.category) where.category = query.category;

    const [tickets, total] = await this.supportTicketRepo.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: { user: true },
    });

    return { tickets, total, page, limit };
  }

  async compensateContest(contestId: string) {
    const contest = await this.compensationService.findContestWithMembers(contestId);
    if (!contest) throw new NotFoundException('Contest not found');

    if (contest.compensationStatus !== ('none' as any)) {
      throw new Error(`Contest already has compensation status: ${contest.compensationStatus}`);
    }

    return this.compensationService.processCompensation(contest);
  }

  async processPendingCompensations() {
    return this.compensationService.processPendingCompensations();
  }

  async getCompensationLogs(query: { page?: number; limit?: number; status?: string }) {
    return this.compensationService.getCompensationLogs(query);
  }
}
