import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { Kyc } from '../kyc/entities/kyc.entity';
import {
  Contest,
  ContestStatus,
  CompensationStatus as ContestCompensationStatus,
} from '../contests/entities/contest.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Withdrawal } from '../withdrawals/entities/withdrawal.entity';
import { SystemConfig } from '../config/entities/system-config.entity';
import { SupportTicket } from '../support/entities/support-ticket.entity';
import { Banner } from '../banners/entities/banner.entity';
import { PrizeHome } from '../prize-homes/entities/prize-home.entity';
import { Warning, WarningStatus } from './entities/warning.entity';
import { FraudAlert, FraudStatus } from './entities/fraud-alert.entity';
import { Reward } from '../rewards/entities/reward.entity';
import { Poll } from '../polls/entities/poll.entity';
import { Referral } from '../referral/entities/referral.entity';
import { CompensationService } from '../compensation/compensation.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SmsService } from '../sms/sms.service';

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
    @InjectRepository(Banner)
    private readonly bannerRepo: Repository<Banner>,
    @InjectRepository(PrizeHome)
    private readonly prizeHomeRepo: Repository<PrizeHome>,
    @InjectRepository(Warning)
    private readonly warningRepo: Repository<Warning>,
    @InjectRepository(FraudAlert)
    private readonly fraudAlertRepo: Repository<FraudAlert>,
    @InjectRepository(Reward)
    private readonly rewardRepo: Repository<Reward>,
    @InjectRepository(Poll)
    private readonly pollRepo: Repository<Poll>,
    @InjectRepository(Referral)
    private readonly referralRepo: Repository<Referral>,
    private readonly compensationService: CompensationService,
    private readonly notificationsService: NotificationsService,
    private readonly smsService: SmsService,
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

    const allowedFields = [
      'role',
      'isActive',
      'currentTier',
      'state',
      'fullName',
      'email',
    ];
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
    const activeUsers = await this.userRepo.count({
      where: { isActive: true },
    });
    const adminUsers = await this.userRepo.count({
      where: { role: UserRole.ADMIN },
    });

    const totalContests = await this.contestRepo.count();
    const runningContests = await this.contestRepo.count({
      where: { status: ContestStatus.RUNNING },
    });
    const upcomingContests = await this.contestRepo.count({
      where: { status: ContestStatus.UPCOMING },
    });
    const completedContests = await this.contestRepo.count({
      where: { status: ContestStatus.COMPLETED },
    });

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

    const pendingKyc = await this.kycRepo.count({
      where: { status: 'pending' as any },
    });
    const openTickets = await this.supportTicketRepo.count({
      where: { status: 'open' },
    });

    const compensationStats =
      await this.compensationService.getCompensationStats();

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
      compensationStats: {
        totalPaid: compensationStats.total,
        pending: compensationStats.pending,
        thisMonth: compensationStats.totalPoints,
      },
      recentUsers: recentUsers.map((u) => ({
        id: u.id,
        _id: u.id,
        fullName: u.fullName,
        phoneNumber: u.phoneNumber,
        phone: u.phoneNumber,
        currentTier: u.currentTier,
        role: u.role,
        isActive: u.isActive,
        kycStatus: u.kyc?.status || 'not_submitted',
        createdAt: u.createdAt,
      })),
      recentTransactions: recentTx.map((t) => ({
        id: t.id,
        _id: t.id,
        userId: t.userId,
        user: t.user ? { fullName: t.user.fullName } : null,
        type: t.type,
        cashAmount: t.cashAmount,
        amount: Number(t.cashAmount),
        pointsAmount: t.pointsAmount,
        description: t.description,
        createdAt: t.createdAt,
      })),
    };
  }

  async getContests(query: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    search?: string;
  }) {
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
    const contest = await this.contestRepo.findOne({
      where: { id },
      relations: { members: { user: true } },
    });
    if (!contest) throw new NotFoundException('Contest not found');

    const memberCount = await this.contestRepo
      .createQueryBuilder('c')
      .innerJoin('contest_members', 'cm', 'cm.contest_id = c.id')
      .where('c.id = :id', { id })
      .getCount();

    return { ...contest, memberCount };
  }

  async getKycSubmissions(query: {
    page?: number;
    limit?: number;
    status?: string;
    userId?: string;
  }) {
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
    (kyc as any).rejectionReason =
      reason || 'KYC documents do not meet verification requirements';
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
      'appName',
      'appVersion',
      'apiVersion',
      'environment',
      'maintenanceMode',
      'minAppVersionAndroid',
      'minAppVersionIos',
      'maxWithdrawalAmount',
      'minWithdrawalAmount',
      'dailySpinEnabled',
      'pollsEnabled',
      'feedEnabled',
      'chatEnabled',
      'referralEnabled',
      'maxDailyPosts',
      'maxDailySpins',
      'supportEmail',
      'restrictedStates',
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

  async getSupportTickets(query: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
  }) {
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

  async updateTicketStatus(id: string, status: string) {
    const ticket = await this.supportTicketRepo.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Support ticket not found');

    ticket.status = status;
    await this.supportTicketRepo.save(ticket);
    return ticket;
  }

  async compensateContest(contestId: string) {
    const contest =
      await this.compensationService.findContestWithMembers(contestId);
    if (!contest) throw new NotFoundException('Contest not found');

    if (contest.compensationStatus !== ContestCompensationStatus.NONE) {
      throw new Error(
        `Contest already has compensation status: ${contest.compensationStatus}`,
      );
    }

    return this.compensationService.processCompensation(contest);
  }

  async processPendingCompensations() {
    return this.compensationService.processPendingCompensations();
  }

  async getCompensationLogs(query: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    return this.compensationService.getCompensationLogs(query);
  }

  async getDetailedCompensationStats() {
    const total = await this.compensationService.getCompensationStats();

    const dailyAgg = await this.compensationService
      .getCompensationLogRepo()
      .createQueryBuilder('cl')
      .select('DATE(cl.created_at)', 'date')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(cl.compensation_points), 0)', 'points')
      .groupBy('DATE(cl.created_at)')
      .orderBy('DATE(cl.created_at)', 'DESC')
      .limit(30)
      .getRawMany();

    return {
      ...total,
      dailyBreakdown: dailyAgg.map((d: any) => ({
        date: d.date,
        count: Number(d.count),
        points: Number(d.points),
      })),
    };
  }

  async broadcastPush(title: string, message: string, tier?: string) {
    let sentCount: number;

    if (tier) {
      sentCount = await this.notificationsService.broadcastToUsersByTier(
        tier,
        title,
        message,
      );
    } else {
      sentCount = await this.notificationsService.broadcastToAllUsers(
        title,
        message,
      );
    }

    return { sent: sentCount, title, message, tier: tier || 'all' };
  }

  async broadcastSms(message: string, tier?: string) {
    const where: any = { isActive: true };
    if (tier) where.currentTier = tier;

    const users = await this.userRepo.find({
      where,
      select: { id: true, phoneNumber: true },
    });
    let sentCount = 0;

    for (const user of users) {
      if (user.phoneNumber) {
        try {
          await this.smsService.sendSms(user.phoneNumber, message);
          sentCount++;
        } catch (error) {
          this.logger.error(
            `Failed to send SMS to user ${user.id}: ${(error as Error).message}`,
          );
        }
      }
    }

    this.logger.log(`Broadcast SMS sent to ${sentCount}/${users.length} users`);
    return {
      sent: sentCount,
      total: users.length,
      message,
      tier: tier || 'all',
    };
  }

  async createContest(dto: any): Promise<Contest> {
    const contest = this.contestRepo.create({
      title: dto.title,
      type: dto.type,
      entryFeeInr: dto.entryFee || 0,
      pointsToJoin: dto.pointsToJoin || 0,
      maxSlots: dto.maxSlots,
      prize: dto.prize,
      rules: dto.rules,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      status: ContestStatus.DRAFT,
    });
    return this.contestRepo.save(contest);
  }

  async updateContest(id: string, dto: any): Promise<Contest> {
    const contest = await this.contestRepo.findOne({ where: { id } });
    if (!contest) throw new NotFoundException('Contest not found');

    const allowedFields = ['title', 'type', 'entryFeeInr', 'pointsToJoin', 'maxSlots', 'prize', 'rules', 'badgeText', 'badgeColor'];
    for (const field of allowedFields) {
      if (dto[field] !== undefined) {
        (contest as any)[field] = dto[field];
      }
    }
    if (dto.startTime) contest.startTime = new Date(dto.startTime);
    if (dto.endTime) contest.endTime = new Date(dto.endTime);
    if (dto.status) contest.status = dto.status;
    if (dto.entryFee !== undefined) contest.entryFeeInr = dto.entryFee;

    return this.contestRepo.save(contest);
  }

  async deleteContest(id: string): Promise<void> {
    const contest = await this.contestRepo.findOne({ where: { id } });
    if (!contest) throw new NotFoundException('Contest not found');
    contest.status = ContestStatus.CANCELLED;
    await this.contestRepo.save(contest);
  }

  async getBanners(): Promise<Banner[]> {
    return this.bannerRepo.find({ order: { sortOrder: 'ASC' } });
  }

  async createBanner(dto: any): Promise<Banner> {
    const banner = this.bannerRepo.create({
      title: dto.title,
      subtitle: dto.subtitle,
      imageUrl: dto.imageUrl || null,
      link: dto.linkUrl || dto.linkId || null,
      linkLabel: dto.linkType || null,
      backgroundColor: dto.bgColor || null,
      sortOrder: dto.order ?? 0,
      isActive: dto.isActive ?? true,
    });
    return this.bannerRepo.save(banner);
  }

  async updateBanner(id: string, dto: any): Promise<Banner> {
    const banner = await this.bannerRepo.findOne({ where: { id } });
    if (!banner) throw new NotFoundException('Banner not found');

    if (dto.title !== undefined) banner.title = dto.title;
    if (dto.subtitle !== undefined) banner.subtitle = dto.subtitle;
    if (dto.imageUrl !== undefined) banner.imageUrl = dto.imageUrl;
    if (dto.linkUrl !== undefined) banner.link = dto.linkUrl;
    if (dto.linkType !== undefined) banner.linkLabel = dto.linkType;
    if (dto.bgColor !== undefined) banner.backgroundColor = dto.bgColor;
    if (dto.order !== undefined) banner.sortOrder = dto.order;
    if (dto.isActive !== undefined) banner.isActive = dto.isActive;

    return this.bannerRepo.save(banner);
  }

  async deleteBanner(id: string): Promise<void> {
    const banner = await this.bannerRepo.findOne({ where: { id } });
    if (!banner) throw new NotFoundException('Banner not found');
    await this.bannerRepo.remove(banner);
  }

  async reorderBanners(dto: { bannerId: string; newOrder: number; swapWithId: string; swapWithOrder: number }): Promise<void> {
    await this.bannerRepo.update(dto.bannerId, { sortOrder: dto.newOrder });
    await this.bannerRepo.update(dto.swapWithId, { sortOrder: dto.swapWithOrder });
  }

  async getPrizeHomes(): Promise<PrizeHome[]> {
    return this.prizeHomeRepo.find({ order: { sortOrder: 'ASC' } });
  }

  async createPrizeHome(dto: any): Promise<PrizeHome> {
    const prizeHome = this.prizeHomeRepo.create({
      title: dto.title || dto.name,
      description: dto.description,
      imageUrl: Array.isArray(dto.images) ? dto.images[0] : dto.imageUrl,
      city: dto.city,
      state: dto.state,
      location: dto.location,
      valueInr: dto.value || dto.valueInr,
      bedrooms: dto.bedrooms || dto.bhk,
      bathrooms: dto.bathrooms,
      area: dto.area,
      features: dto.features || dto.amenities,
      type: dto.type,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
    });
    return this.prizeHomeRepo.save(prizeHome);
  }

  async updatePrizeHome(id: string, dto: any): Promise<PrizeHome> {
    const prizeHome = await this.prizeHomeRepo.findOne({ where: { id } });
    if (!prizeHome) throw new NotFoundException('Prize home not found');

    if (dto.title !== undefined) prizeHome.title = dto.title;
    if (dto.name !== undefined) prizeHome.title = dto.name;
    if (dto.description !== undefined) prizeHome.description = dto.description;
    if (dto.imageUrl !== undefined) prizeHome.imageUrl = dto.imageUrl;
    if (dto.images !== undefined) prizeHome.imageUrl = dto.images[0];
    if (dto.city !== undefined) prizeHome.city = dto.city;
    if (dto.state !== undefined) prizeHome.state = dto.state;
    if (dto.location !== undefined) prizeHome.location = dto.location;
    if (dto.value !== undefined) prizeHome.valueInr = dto.value;
    if (dto.valueInr !== undefined) prizeHome.valueInr = dto.valueInr;
    if (dto.bedrooms !== undefined) prizeHome.bedrooms = dto.bedrooms;
    if (dto.bhk !== undefined) prizeHome.bedrooms = dto.bhk;
    if (dto.bathrooms !== undefined) prizeHome.bathrooms = dto.bathrooms;
    if (dto.area !== undefined) prizeHome.area = dto.area;
    if (dto.features !== undefined) prizeHome.features = dto.features;
    if (dto.amenities !== undefined) prizeHome.features = dto.amenities;
    if (dto.sortOrder !== undefined) prizeHome.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) prizeHome.isActive = dto.isActive;

    return this.prizeHomeRepo.save(prizeHome);
  }

  async deletePrizeHome(id: string): Promise<void> {
    const prizeHome = await this.prizeHomeRepo.findOne({ where: { id } });
    if (!prizeHome) throw new NotFoundException('Prize home not found');
    await this.prizeHomeRepo.remove(prizeHome);
  }

  async getWarnings(query: { page?: number; limit?: number; status?: string; userId?: string }): Promise<{ warnings: Warning[]; total: number; page: number; limit: number }> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 50, 100);
    const skip = (page - 1) * limit;
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.userId) where.userId = query.userId;

    const [warnings, total] = await this.warningRepo.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: { user: true },
    });
    return { warnings, total, page, limit };
  }

  async issueWarning(dto: { userId: string; level: number; reason: string; notes?: string }, adminId: string): Promise<Warning> {
    const user = await this.userRepo.findOne({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User not found');

    const pointsDeducted = dto.level === 3 ? 0 : dto.level === 2 ? 1000 : 200;
    const expiresAt = dto.level < 3 ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) : null;

    const warning = this.warningRepo.create({
      userId: dto.userId,
      level: dto.level,
      reason: dto.reason,
      notes: dto.notes,
      pointsDeducted,
      issuedBy: adminId,
      expiresAt,
      status: WarningStatus.ACTIVE,
    });

    if (pointsDeducted > 0 && user.pointsBalance >= pointsDeducted) {
      user.pointsBalance -= pointsDeducted;
      await this.userRepo.save(user);
    }

    return this.warningRepo.save(warning);
  }

  async resolveWarning(id: string): Promise<Warning> {
    const warning = await this.warningRepo.findOne({ where: { id } });
    if (!warning) throw new NotFoundException('Warning not found');
    warning.status = WarningStatus.RESOLVED;
    warning.resolvedAt = new Date();
    return this.warningRepo.save(warning);
  }

  async getFraudAlerts(query: { page?: number; limit?: number; severity?: string; status?: string; search?: string }): Promise<{ alerts: FraudAlert[]; total: number; page: number; limit: number }> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 50, 100);
    const skip = (page - 1) * limit;
    const where: any = {};
    if (query.severity) where.severity = query.severity;
    if (query.status) where.status = query.status;

    const [alerts, total] = await this.fraudAlertRepo.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: { user: true },
    });
    return { alerts, total, page, limit };
  }

  async getFraudStats(): Promise<any> {
    const totalAlerts = await this.fraudAlertRepo.count();
    const openAlerts = await this.fraudAlertRepo.count({ where: { status: FraudStatus.OPEN } });
    const criticalAlerts = await this.fraudAlertRepo.count({ where: { severity: 'critical' as any, status: FraudStatus.OPEN } });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const resolvedToday = await this.fraudAlertRepo.count({
      where: { status: FraudStatus.RESOLVED, resolvedAt: Between(todayStart, new Date()) },
    });

    const alertsBySeverity = await this.fraudAlertRepo
      .createQueryBuilder('fa')
      .select('fa.severity', 'severity')
      .addSelect('COUNT(*)', 'count')
      .groupBy('fa.severity')
      .getRawMany();

    const topRules = await this.fraudAlertRepo
      .createQueryBuilder('fa')
      .select('fa.rule', 'rule')
      .addSelect('COUNT(*)', 'count')
      .groupBy('fa.rule')
      .orderBy('COUNT(*)', 'DESC')
      .limit(10)
      .getRawMany();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const alertsByDay = await this.fraudAlertRepo
      .createQueryBuilder('fa')
      .select('DATE(fa.created_at)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('fa.created_at >= :sevenDaysAgo', { sevenDaysAgo })
      .groupBy('DATE(fa.created_at)')
      .orderBy('DATE(fa.created_at)', 'ASC')
      .getRawMany();

    return {
      totalAlerts,
      openAlerts,
      criticalAlerts,
      resolvedToday,
      alertsBySeverity: alertsBySeverity.map((a: any) => ({ severity: a.severity, count: Number(a.count) })),
      topRules: topRules.map((r: any) => ({ rule: r.rule, count: Number(r.count) })),
      alertsByDay: alertsByDay.map((d: any) => ({ date: d.date, count: Number(d.count) })),
    };
  }

  async updateFraudAlert(id: string, status: string, adminId?: string): Promise<FraudAlert> {
    const alert = await this.fraudAlertRepo.findOne({ where: { id } });
    if (!alert) throw new NotFoundException('Fraud alert not found');
    alert.status = status as FraudStatus;
    if (status === FraudStatus.RESOLVED || status === FraudStatus.DISMISSED) {
      alert.resolvedAt = new Date();
      alert.resolvedBy = adminId || null;
    }
    return this.fraudAlertRepo.save(alert);
  }

  async getTransactions(query: { page?: number; limit?: number; type?: string; userId?: string }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 50, 100);
    const skip = (page - 1) * limit;
    const where: any = {};
    if (query.type) where.type = query.type;
    if (query.userId) where.userId = query.userId;

    const [transactions, total] = await this.transactionRepo.findAndCount({
      where, skip, take: limit,
      order: { createdAt: 'DESC' },
      relations: { user: true },
    });
    return { transactions, total, page, limit };
  }

  async getWithdrawals(query: { page?: number; limit?: number; status?: string }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 50, 100);
    const skip = (page - 1) * limit;
    const where: any = {};
    if (query.status) where.status = query.status;

    const [withdrawals, total] = await this.withdrawalRepo.findAndCount({
      where, skip, take: limit,
      order: { createdAt: 'DESC' },
      relations: { user: true },
    });
    return { withdrawals, total, page, limit };
  }

  async approveWithdrawal(id: string, adminId: string): Promise<any> {
    const withdrawal = await this.withdrawalRepo.findOne({ where: { id } });
    if (!withdrawal) throw new NotFoundException('Withdrawal not found');
    withdrawal.status = 'approved' as any;
    withdrawal.utrNumber = `UTR${Date.now()}`;
    await this.withdrawalRepo.save(withdrawal);
    return withdrawal;
  }

  async rejectWithdrawal(id: string, reason: string, adminId: string): Promise<any> {
    const withdrawal = await this.withdrawalRepo.findOne({ where: { id } });
    if (!withdrawal) throw new NotFoundException('Withdrawal not found');
    withdrawal.status = 'rejected' as any;
    withdrawal.rejectionReason = reason;
    await this.withdrawalRepo.save(withdrawal);
    return withdrawal;
  }

  async getRewards(): Promise<Reward[]> {
    return this.rewardRepo.find({ order: { sortOrder: 'ASC' } });
  }

  async createReward(dto: any): Promise<Reward> {
    const reward = this.rewardRepo.create({
      title: dto.title,
      description: dto.description,
      imageUrl: dto.imageUrl,
      pointsRequired: dto.pointsRequired,
      stock: dto.stock,
      category: dto.category || 'gift_card',
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
    });
    return this.rewardRepo.save(reward);
  }

  async updateReward(id: string, dto: any): Promise<Reward> {
    const reward = await this.rewardRepo.findOne({ where: { id } });
    if (!reward) throw new NotFoundException('Reward not found');
    if (dto.title !== undefined) reward.title = dto.title;
    if (dto.description !== undefined) reward.description = dto.description;
    if (dto.imageUrl !== undefined) reward.imageUrl = dto.imageUrl;
    if (dto.pointsRequired !== undefined) reward.pointsRequired = dto.pointsRequired;
    if (dto.stock !== undefined) reward.stock = dto.stock;
    if (dto.category !== undefined) reward.category = dto.category;
    if (dto.isActive !== undefined) reward.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) reward.sortOrder = dto.sortOrder;
    return this.rewardRepo.save(reward);
  }

  async deleteReward(id: string): Promise<void> {
    const reward = await this.rewardRepo.findOne({ where: { id } });
    if (!reward) throw new NotFoundException('Reward not found');
    await this.rewardRepo.remove(reward);
  }

  async getReferrals(query: { page?: number; limit?: number }): Promise<any> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 50, 100);
    const skip = (page - 1) * limit;

    const [referrals, total] = await this.referralRepo.findAndCount({
      skip, take: limit,
      order: { createdAt: 'DESC' },
      relations: { referrer: true, referee: true },
    });

    const totalReferrers = await this.referralRepo
      .createQueryBuilder('r')
      .select('COUNT(DISTINCT r.referrer_id)', 'count')
      .getRawOne();

    const totalPayouts = await this.referralRepo
      .createQueryBuilder('r')
      .select('COALESCE(SUM(r.signup_reward + r.kyc_reward), 0)', 'total')
      .where('r.status = :status', { status: 'settled' })
      .getRawOne();

    return {
      referrals,
      total,
      page,
      limit,
      stats: {
        totalReferrals: total,
        totalReferrers: Number(totalReferrers?.count || 0),
        totalPayouts: Number(totalPayouts?.total || 0),
        settledCount: await this.referralRepo.count({ where: { status: 'settled' as any } }),
      },
    };
  }

  async getPolls(): Promise<Poll[]> {
    return this.pollRepo.find({ order: { createdAt: 'DESC' } });
  }

  async createPoll(dto: any): Promise<Poll> {
    const poll = this.pollRepo.create({
      question: dto.question,
      options: dto.options,
      activeFrom: new Date(dto.activeFrom),
      activeTo: new Date(dto.activeTo),
      isActive: dto.isActive ?? true,
    });
    return this.pollRepo.save(poll);
  }

  async updatePoll(id: string, dto: any): Promise<Poll> {
    const poll = await this.pollRepo.findOne({ where: { id } });
    if (!poll) throw new NotFoundException('Poll not found');
    if (dto.question !== undefined) poll.question = dto.question;
    if (dto.options !== undefined) poll.options = dto.options;
    if (dto.activeFrom !== undefined) poll.activeFrom = new Date(dto.activeFrom);
    if (dto.activeTo !== undefined) poll.activeTo = new Date(dto.activeTo);
    if (dto.isActive !== undefined) poll.isActive = dto.isActive;
    return this.pollRepo.save(poll);
  }

  async deletePoll(id: string): Promise<void> {
    const poll = await this.pollRepo.findOne({ where: { id } });
    if (!poll) throw new NotFoundException('Poll not found');
    await this.pollRepo.remove(poll);
  }

  async exportReport(type: string, query: any): Promise<any> {
    if (type === 'transactions') {
      const transactions = await this.transactionRepo.find({
        order: { createdAt: 'DESC' },
        relations: { user: true },
        take: 10000,
      });
      return {
        data: transactions.map(t => ({
          id: t.id, userId: t.userId, user: t.user?.fullName || t.user?.phoneNumber,
          type: t.type, cashAmount: Number(t.cashAmount), pointsAmount: t.pointsAmount,
          description: t.description, createdAt: t.createdAt,
        })),
        total: transactions.length,
      };
    }
    if (type === 'users') {
      const users = await this.userRepo.find({
        order: { createdAt: 'DESC' },
        relations: { kyc: true },
        take: 10000,
      });
      return {
        data: users.map(u => ({
          id: u.id, name: u.fullName, phone: u.phoneNumber, email: u.email,
          role: u.role, tier: u.currentTier, kycStatus: u.kyc?.status || 'none',
          walletBalance: Number(u.walletBalanceInr), pointsBalance: u.pointsBalance,
          createdAt: u.createdAt,
        })),
        total: users.length,
      };
    }
    throw new BadRequestException(`Unknown report type: ${type}`);
  }

  async exportCompensations(query: { status?: string }) {
    const where: any = {};
    if (query.status) where.status = query.status;

    const logs = await this.compensationService.getCompensationLogRepo().find({
      where,
      order: { createdAt: 'DESC' },
      relations: { contest: true, user: true },
    });

    return {
      data: logs.map((l) => ({
        id: l.id,
        contestId: l.contestId,
        contestTitle: l.contest?.title || '',
        userId: l.userId,
        userName: l.user?.fullName || l.user?.phoneNumber || '',
        userPhone: l.user?.phoneNumber || '',
        entryFeeInr: Number(l.entryFeeInr),
        compensationPoints: l.compensationPoints,
        status: l.status,
        processedAt: l.processedAt?.toISOString() || '',
        createdAt: l.createdAt.toISOString(),
      })),
      total: logs.length,
    };
  }
}
