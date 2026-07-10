import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { User, UserRole } from '../users/entities/user.entity';
import { Kyc } from '../kyc/entities/kyc.entity';
import { Contest, ContestStatus } from '../contests/entities/contest.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Withdrawal } from '../withdrawals/entities/withdrawal.entity';
import { SystemConfig } from '../config/entities/system-config.entity';
import { SupportTicket } from '../support/entities/support-ticket.entity';
import { Banner } from '../banners/entities/banner.entity';
import { PrizeHome } from '../prize-homes/entities/prize-home.entity';
import { Warning } from './entities/warning.entity';
import { FraudAlert } from './entities/fraud-alert.entity';
import { Reward } from '../rewards/entities/reward.entity';
import { Poll } from '../polls/entities/poll.entity';
import { Referral } from '../referral/entities/referral.entity';
import { CompensationService } from '../compensation/compensation.service';
import { ConsentService } from '../common/consent/consent.service';
import { GdprService } from '../gdpr/gdpr.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SmsService } from '../sms/sms.service';

describe('AdminService', () => {
  let service: AdminService;
  let userRepo: any;
  let kycRepo: any;
  let contestRepo: any;
  let transactionRepo: any;
  let withdrawalRepo: any;
  let configRepo: any;
  let supportTicketRepo: any;

  const mockCompensationService = {
    findContestWithMembers: jest.fn(),
    processCompensation: jest
      .fn()
      .mockResolvedValue({ processed: 0, totalPoints: 0 }),
    processPendingCompensations: jest.fn().mockResolvedValue({
      contestsProcessed: 0,
      membersCompensated: 0,
      totalPointsAwarded: 0,
    }),
    getCompensationLogs: jest
      .fn()
      .mockResolvedValue({ logs: [], total: 0, page: 1, limit: 20 }),
    getCompensationStats: jest
      .fn()
      .mockResolvedValue({ total: 0, pending: 0, totalPoints: 0 }),
  };

  const mockNotificationsService = {
    broadcastToAllUsers: jest.fn().mockResolvedValue(0),
    broadcastToUsersByTier: jest.fn().mockResolvedValue(0),
    sendCompensationNotification: jest.fn().mockResolvedValue(undefined),
  };

  const mockSmsService = {
    sendSms: jest.fn().mockResolvedValue(undefined),
    sendCompensationSms: jest.fn().mockResolvedValue(undefined),
  };

  const mockConsentService = {
    recordConsent: jest.fn().mockResolvedValue(undefined),
    getUserConsents: jest.fn().mockResolvedValue([]),
    getConsentLogs: jest.fn().mockResolvedValue({ records: [], total: 0 }),
  };

  const mockGdprService = {
    exportUserData: jest.fn().mockResolvedValue({}),
    requestAccountDeletion: jest.fn().mockResolvedValue(undefined),
    permanentDeleteAccount: jest.fn().mockResolvedValue(undefined),
  };

  const mockQueryBuilder: any = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({ total: 0 }),
    getCount: jest.fn().mockResolvedValue(0),
  };

  beforeEach(async () => {
    userRepo = {
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      findOne: jest.fn().mockResolvedValue(null),
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockImplementation((u) => Promise.resolve(u)),
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };
    kycRepo = {
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation((k) => Promise.resolve(k)),
      count: jest.fn().mockResolvedValue(0),
    };
    contestRepo = {
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      findOne: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };
    transactionRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      find: jest.fn().mockResolvedValue([]),
    };
    withdrawalRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };
    configRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((d) => d || {}),
      save: jest
        .fn()
        .mockImplementation((c) => Promise.resolve({ id: 'config-1', ...c })),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    supportTicketRepo = {
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      count: jest.fn().mockResolvedValue(0),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Kyc), useValue: kycRepo },
        { provide: getRepositoryToken(Contest), useValue: contestRepo },
        { provide: getRepositoryToken(Transaction), useValue: transactionRepo },
        { provide: getRepositoryToken(Withdrawal), useValue: withdrawalRepo },
        { provide: getRepositoryToken(SystemConfig), useValue: configRepo },
        {
          provide: getRepositoryToken(SupportTicket),
          useValue: supportTicketRepo,
        },
        { provide: getRepositoryToken(Banner), useValue: userRepo },
        { provide: getRepositoryToken(PrizeHome), useValue: userRepo },
        { provide: getRepositoryToken(Warning), useValue: userRepo },
        { provide: getRepositoryToken(FraudAlert), useValue: userRepo },
        { provide: getRepositoryToken(Reward), useValue: userRepo },
        { provide: getRepositoryToken(Poll), useValue: userRepo },
        { provide: getRepositoryToken(Referral), useValue: userRepo },
        { provide: CompensationService, useValue: mockCompensationService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: SmsService, useValue: mockSmsService },
        { provide: ConsentService, useValue: mockConsentService },
        { provide: GdprService, useValue: mockGdprService },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUsers', () => {
    it('should return paginated users', async () => {
      const mockUsers = [
        {
          id: '1',
          fullName: 'John Doe',
          phoneNumber: '+911234567890',
          role: UserRole.USER,
          isActive: true,
          createdAt: new Date(),
          kyc: null,
          email: null,
          currentTier: 'bronze',
          state: null,
          walletBalanceInr: 0,
          pointsBalance: 0,
        },
      ];
      userRepo.findAndCount.mockResolvedValue([mockUsers, 1]);

      const result = await service.getUsers({ page: 1, limit: 10 });
      expect(result.users).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should search by name', async () => {
      await service.getUsers({ search: 'John' });
      expect(userRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ fullName: expect.any(Object) }),
            ]),
          }),
        }),
      );
    });

    it('should filter by role', async () => {
      await service.getUsers({ role: UserRole.ADMIN });
      expect(userRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ role: UserRole.ADMIN }),
        }),
      );
    });
  });

  describe('getUserById', () => {
    it('should return user with aggregations', async () => {
      const mockUser = {
        id: '1',
        fullName: 'John',
        phoneNumber: '+911234567890',
        kyc: { status: 'approved' },
        isActive: true,
      };
      userRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.getUserById('1');
      expect(result).toBeDefined();
      expect(result.fullName).toBe('John');
    });

    it('should throw NotFoundException for missing user', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.getUserById('nonexistent')).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('updateUser', () => {
    it('should update allowed fields', async () => {
      const user = {
        id: '1',
        fullName: 'Old Name',
        role: UserRole.USER,
        isActive: true,
      };
      userRepo.findOne.mockResolvedValue(user);

      const result = await service.updateUser('1', {
        fullName: 'New Name',
        role: UserRole.ADMIN,
      });
      expect(result.fullName).toBe('New Name');
      expect(result.role).toBe(UserRole.ADMIN);
    });

    it('should throw NotFoundException for missing user', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.updateUser('nonexistent', {})).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('getDashboardStats', () => {
    it('should return aggregated stats', async () => {
      userRepo.count.mockResolvedValue(100);
      contestRepo.count.mockResolvedValue(20);
      kycRepo.count.mockResolvedValue(5);
      supportTicketRepo.count.mockResolvedValue(3);
      transactionRepo.find.mockResolvedValue([]);
      userRepo.find.mockResolvedValue([]);

      const result = await service.getDashboardStats();
      expect(result.totalUsers).toBe(100);
      expect(result.totalContests).toBe(20);
      expect(result.pendingKycCount).toBe(5);
      expect(result.openSupportTickets).toBe(3);
    });
  });

  describe('getContests', () => {
    it('should return paginated contests', async () => {
      contestRepo.findAndCount.mockResolvedValue([
        [{ id: 'c1', title: 'Test Contest' }],
        1,
      ]);
      const result = await service.getContests({});
      expect(result.contests).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('getContestById', () => {
    it('should return contest with member count', async () => {
      contestRepo.findOne.mockResolvedValue({ id: 'c1', title: 'Test' });
      mockQueryBuilder.getCount.mockResolvedValue(5);

      const result = await service.getContestById('c1');
      expect(result.title).toBe('Test');
      expect(result.memberCount).toBe(5);
    });

    it('should throw NotFoundException', async () => {
      contestRepo.findOne.mockResolvedValue(null);
      await expect(service.getContestById('none')).rejects.toThrow(
        'Contest not found',
      );
    });
  });

  describe('KYC Management', () => {
    it('should return paginated KYC submissions', async () => {
      kycRepo.findAndCount.mockResolvedValue([
        [{ id: 'k1', status: 'pending' }],
        1,
      ]);
      const result = await service.getKycSubmissions({});
      expect(result.submissions).toHaveLength(1);
    });

    it('should approve KYC', async () => {
      const kyc = { id: 'k1', status: 'pending', save: jest.fn() };
      kycRepo.findOne.mockResolvedValue(kyc);
      const result = await service.approveKyc('k1');
      expect(result.status).toBe('approved');
    });

    it('should reject KYC with reason', async () => {
      const kyc: any = { id: 'k1', status: 'pending' };
      kycRepo.findOne.mockResolvedValue(kyc);
      const result = await service.rejectKyc('k1', 'Invalid document');
      expect(result.status).toBe('rejected');
      expect(result.rejectionReason).toBe('Invalid document');
    });
  });

  describe('updateSystemConfig', () => {
    it('should update existing config', async () => {
      configRepo.find.mockResolvedValue([
        { id: 'cfg-1', maintenanceMode: false },
      ]);
      configRepo.findOne.mockResolvedValue({
        id: 'cfg-1',
        maintenanceMode: true,
      });

      const result = await service.updateSystemConfig({
        maintenanceMode: true,
      });
      expect(result!.maintenanceMode).toBe(true);
    });

    it('should create config if none exists', async () => {
      configRepo.find.mockResolvedValue([]);
      configRepo.findOne.mockResolvedValue({
        id: 'cfg-new',
        maintenanceMode: false,
      });

      const result = await service.updateSystemConfig({
        maintenanceMode: false,
      });
      expect(result).toBeDefined();
    });
  });

  describe('getSupportTickets', () => {
    it('should return paginated tickets', async () => {
      supportTicketRepo.findAndCount.mockResolvedValue([
        [{ id: 't1', subject: 'Help' }],
        1,
      ]);
      const result = await service.getSupportTickets({});
      expect(result.tickets).toHaveLength(1);
    });
  });
});
