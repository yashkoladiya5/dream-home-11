import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  HttpStatus,
} from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { REDIS_CLIENT } from '../../src/redis/redis.constants';

import { User, UserRole, UserLevel } from '../../src/users/entities/user.entity';
import { Kyc, KycStatus } from '../../src/kyc/entities/kyc.entity';
import { Contest } from '../../src/contests/entities/contest.entity';
import { ContestMember } from '../../src/contests/entities/contest-member.entity';
import { PointLog } from '../../src/points/entities/point-log.entity';
import { FcmToken } from '../../src/notifications/entities/fcm-token.entity';
import { Reminder } from '../../src/notifications/entities/reminder.entity';
import { NotificationLog } from '../../src/notifications/entities/notification-log.entity';
import { Share } from '../../src/share-tracker/entities/share.entity';
import { Reward } from '../../src/rewards/entities/reward.entity';
import { RewardRedemption } from '../../src/rewards/entities/reward-redemption.entity';
import { Banner } from '../../src/banners/entities/banner.entity';
import { Achievement } from '../../src/achievements/entities/achievement.entity';
import { UserAchievement } from '../../src/achievements/entities/user-achievement.entity';
import { PrizeHome } from '../../src/prize-homes/entities/prize-home.entity';
import { Transaction } from '../../src/transactions/entities/transaction.entity';
import { Payment } from '../../src/payments/entities/payment.entity';
import { SavedPaymentMethod } from '../../src/payment-methods/entities/saved-payment-method.entity';
import { Withdrawal, WithdrawalStatus } from '../../src/withdrawals/entities/withdrawal.entity';
import { Post } from '../../src/feed/entities/post.entity';
import { Like } from '../../src/feed/entities/like.entity';
import { Comment } from '../../src/feed/entities/comment.entity';
import { Poll } from '../../src/polls/entities/poll.entity';
import { PollVote } from '../../src/polls/entities/poll-vote.entity';
import { Referral } from '../../src/referral/entities/referral.entity';
import { Chat } from '../../src/chat/entities/chat.entity';
import { ChatMessage } from '../../src/chat/entities/chat-message.entity';
import { ChatParticipant } from '../../src/chat/entities/chat-participant.entity';
import { SupportTicket } from '../../src/support/entities/support-ticket.entity';
import { SystemConfig } from '../../src/config/entities/system-config.entity';
import { CompensationLog } from '../../src/compensation/entities/compensation.entity';
import { AuditLog } from '../../src/audit/entities/audit-log.entity';

const ALL_ENTITIES = [
  User, Kyc, Contest, ContestMember, PointLog,
  FcmToken, Reminder, NotificationLog, Share, Reward,
  RewardRedemption, Banner, Achievement, UserAchievement, PrizeHome,
  Transaction, Payment, SavedPaymentMethod, Withdrawal,
  Post, Like, Comment, Poll, PollVote,
  Referral, Chat, ChatMessage, ChatParticipant,
  SupportTicket, SystemConfig, CompensationLog, AuditLog,
];

function createQueryBuilderMock() {
  return {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    having: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({ total: 0 }),
    getRawMany: jest.fn().mockResolvedValue([]),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
    getCount: jest.fn().mockResolvedValue(0),
    execute: jest.fn().mockResolvedValue({ affected: 0 }),
  };
}

function createMockRepo() {
  return {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    findOneBy: jest.fn().mockResolvedValue(null),
    findOneOrFail: jest.fn().mockRejectedValue(new Error('Not found')),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
    count: jest.fn().mockResolvedValue(0),
    save: jest.fn().mockImplementation((e: any) => Promise.resolve(e)),
    create: jest.fn().mockImplementation((e: any) => e || {}),
    update: jest.fn().mockResolvedValue({ affected: 1, generatedMaps: [] }),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    insert: jest.fn().mockResolvedValue({ identifiers: [{ id: 'mock' }], generatedMaps: [] }),
    upsert: jest.fn().mockResolvedValue({ identifiers: [], generatedMaps: [] }),
    softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
    restore: jest.fn().mockResolvedValue({ affected: 1 }),
    createQueryBuilder: jest.fn(() => createQueryBuilderMock()),
    target: {},
    manager: { transaction: jest.fn(), query: jest.fn() },
    metadata: { columns: [], relations: [] },
    query: jest.fn().mockResolvedValue([]),
  };
}

describe('Wallet Flow E2E', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let jwtService: JwtService;
  let mockUserRepo: ReturnType<typeof createMockRepo>;
  let mockTxRepo: ReturnType<typeof createMockRepo>;
  let mockWithdrawalRepo: ReturnType<typeof createMockRepo>;
  let mockPaymentRepo: ReturnType<typeof createMockRepo>;
  let mockDataSource: any;

  const USER_ID = '00000000-0000-0000-0000-000000000001';
  let userToken: string;

  const mockUser = {
    id: USER_ID,
    phoneNumber: '+911234567890',
    role: UserRole.USER,
    isActive: true,
    walletBalanceInr: 5000,
    pointsBalance: 1000,
    lifetimePoints: 2000,
    weeklyPoints: 50,
    monthlyPoints: 200,
    currentTier: UserLevel.GOLD,
    fullName: 'Test User',
    email: 'test@example.com',
    avatarUrl: null,
    referralCode: 'TEST123',
    state: 'Maharashtra',
    bankAccountNumber: '1234567890',
    bankIfsc: 'HDFC0001234',
    bankName: 'HDFC Bank',
    upiId: 'test@upi',
    referredBy: null,
    deviceId: 'device-1',
    currentStreak: 0,
    longestStreak: 0,
    lastStreakDate: null,
    kyc: { id: 'kyc-1', userId: USER_ID, status: KycStatus.APPROVED },
    createdAt: new Date(),
  };

  const mockTransaction = {
    id: 'tx-1',
    userId: USER_ID,
    type: 'deposit',
    cashAmount: 1000,
    pointsAmount: 0,
    cashBalanceBefore: 4000,
    cashBalanceAfter: 5000,
    pointsBalanceBefore: 1000,
    pointsBalanceAfter: 1000,
    description: 'Deposit of ₹1000',
    referenceType: 'payment',
    referenceId: 'pay-1',
    status: 'completed',
    createdAt: new Date(),
  };

  beforeAll(async () => {
    mockDataSource = {
      name: 'default',
      options: { type: 'postgres' },
      isInitialized: true,
      entityMetadatas: [],
      manager: { transaction: jest.fn(), query: jest.fn() },
      getRepository: jest.fn().mockReturnValue(createMockRepo()),
      getTreeRepository: jest.fn().mockReturnValue(createMockRepo()),
      getMongoRepository: jest.fn().mockReturnValue(createMockRepo()),
      destroy: jest.fn(),
      initialize: jest.fn(),
      transaction: jest.fn().mockImplementation(async (cb: Function) => {
        const mockEntityManager = {
          findOne: jest.fn().mockImplementation(async (entity: any, opts?: any) => {
            if (entity === User) return mockUserRepo.findOne(opts);
            return null;
          }),
          find: jest.fn().mockResolvedValue([]),
          save: jest.fn().mockImplementation((arg1: any, arg2?: any) => Promise.resolve(arg2 ? arg2 : arg1)),
          create: jest.fn().mockImplementation((cls: any, obj: any) => obj ? obj : (cls || {})),
        };
        return cb(mockEntityManager);
      }),
    };

    const mockRedisClient = {
      status: 'close',
      connect: jest.fn().mockRejectedValue(new Error('mock')),
      disconnect: jest.fn(),
      ping: jest.fn(),
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      multi: jest.fn(() => ({
        incr: jest.fn(),
        pttl: jest.fn(),
        exec: jest.fn().mockResolvedValue([[null, 1], [null, -1]]),
      })),
      incr: jest.fn().mockResolvedValue(1),
      pttl: jest.fn().mockResolvedValue(-1),
      pexpire: jest.fn().mockResolvedValue(1),
      pipeline: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        exec: jest.fn().mockResolvedValue([]),
      })),
      on: jest.fn(),
      ttl: jest.fn().mockResolvedValue(-1),
      keys: jest.fn().mockResolvedValue([]),
      del: jest.fn().mockResolvedValue(1),
      quit: jest.fn().mockResolvedValue('OK'),
      scan: jest.fn().mockResolvedValue(['0', []]),
      setex: jest.fn().mockResolvedValue('OK'),
    };

    let builder = Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DataSource)
      .useValue(mockDataSource as any)
      .overrideProvider(REDIS_CLIENT)
      .useValue(mockRedisClient as any);

    const repoMocks: Record<string, ReturnType<typeof createMockRepo>> = {};
    for (const entity of ALL_ENTITIES) {
      const mock = createMockRepo();
      repoMocks[(entity as any).name || String(entity)] = mock;
      builder = builder
        .overrideProvider(getRepositoryToken(entity))
        .useValue(mock);
    }

    mockUserRepo = repoMocks['User'];
    mockTxRepo = repoMocks['Transaction'];
    mockWithdrawalRepo = repoMocks['Withdrawal'];
    mockPaymentRepo = repoMocks['Payment'];

    mockUserRepo.findOne.mockImplementation(async (opts: any) => {
      const id = opts?.where?.id;
      if (id === USER_ID) return mockUser;
      return null;
    });
    mockUserRepo.save.mockImplementation(async (u: any) => Promise.resolve(u));

    mockTxRepo.findAndCount.mockResolvedValue([[mockTransaction], 1]);
    mockTxRepo.createQueryBuilder.mockReturnValue({
      ...createQueryBuilderMock(),
      getRawMany: jest.fn().mockResolvedValue([
        { type: 'deposit', status: 'completed', totalCash: 5000, totalPoints: 0 },
        { type: 'entry_fee', status: 'completed', totalCash: 500, totalPoints: 0 },
        { type: 'points_earned', status: 'completed', totalCash: 0, totalPoints: 2000 },
      ]),
    });

    mockWithdrawalRepo.find.mockResolvedValue([]);
    mockWithdrawalRepo.findAndCount.mockResolvedValue([[], 0]);
    mockWithdrawalRepo.createQueryBuilder.mockReturnValue({
      ...createQueryBuilderMock(),
      getRawOne: jest.fn().mockResolvedValue({ totalWithdrawn: 0 }),
    });

    mockPaymentRepo.findOne.mockResolvedValue(null);
    mockPaymentRepo.save.mockImplementation(async (p: any) => Promise.resolve(p));

    moduleFixture = await builder.compile();
    app = moduleFixture.createNestApplication();
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    userToken = jwtService.sign({ sub: USER_ID, phoneNumber: '+911234567890' });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockDataSource.transaction.mockImplementation(async (cb: Function) => {
      const mockEntityManager = {
        findOne: jest.fn().mockImplementation(async (entity: any, opts?: any) => {
          if (entity === User) return mockUserRepo.findOne(opts);
          return null;
        }),
        find: jest.fn().mockResolvedValue([]),
        save: jest.fn().mockImplementation((arg1: any, arg2?: any) => Promise.resolve(arg2 ? arg2 : arg1)),
        create: jest.fn().mockImplementation((cls: any, obj: any) => obj ? obj : (cls || {})),
      };
      return cb(mockEntityManager);
    });
  });

  describe('Wallet balance', () => {
    it('should return correct wallet balance via profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(res.body).toHaveProperty('walletBalanceInr');
      expect(Number(res.body.walletBalanceInr)).toBe(5000);
    });

    it('should return balance summary via transactions/balance', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/transactions/balance')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(res.body).toHaveProperty('totalCashDeposited');
      expect(res.body).toHaveProperty('totalCashSpent');
      expect(res.body).toHaveProperty('totalPointsEarned');
    });
  });

  describe('Withdrawal with KYC checks', () => {
    it('should reject withdrawal without KYC', async () => {
      const noKycUser = { ...mockUser, kyc: null };
      mockUserRepo.findOne.mockImplementation(async (opts: any) => {
        const id = opts?.where?.id;
        if (id === USER_ID) return noKycUser;
        return null;
      });

      await request(app.getHttpServer())
        .post('/api/v1/payments/withdraw')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amount: 500 })
        .expect(HttpStatus.FORBIDDEN);

      mockUserRepo.findOne.mockImplementation(async (opts: any) => {
        const id = opts?.where?.id;
        if (id === USER_ID) return mockUser;
        return null;
      });
    });

    it('should reject withdrawal with insufficient balance', async () => {
      const lowBalanceUser = { ...mockUser, walletBalanceInr: 10 };
      mockDataSource.transaction.mockImplementation(async (cb: Function) => {
        const emFindOne = jest.fn().mockImplementation(async (entity: any) => {
          if (entity === User) return lowBalanceUser;
          return null;
        });
        return cb({
          findOne: emFindOne,
          save: jest.fn(),
          create: jest.fn(),
          find: jest.fn().mockResolvedValue([]),
        });
      });

      await request(app.getHttpServer())
        .post('/api/v1/payments/withdraw')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amount: 5000 })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject withdrawal with amount below minimum', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/payments/withdraw')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amount: 10 })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should successfully process withdrawal with valid KYC and balance', async () => {
      mockDataSource.transaction.mockImplementation(async (cb: Function) => {
        const emFindOne = jest.fn().mockImplementation(async (entity: any) => {
          if (entity === User) {
            return { ...mockUser, walletBalanceInr: 5000 };
          }
          if (entity === Kyc) {
            return { id: 'kyc-1', userId: USER_ID, status: KycStatus.APPROVED };
          }
          return null;
        });
        const emSave = jest.fn().mockImplementation(async (arg1: any, arg2?: any) => {
          const obj = arg2 ? arg2 : arg1;
          if (arg1 === Withdrawal || obj.constructor?.name === 'Withdrawal' || obj.userId) {
            return { ...obj, id: 'wd-1', createdAt: new Date(), status: 'pending' };
          }
          return obj;
        });
        const emCreate = jest.fn().mockImplementation((e: any, data: any) => data || e);
        return cb({
          findOne: emFindOne,
          save: emSave,
          create: emCreate,
          find: jest.fn().mockResolvedValue([]),
        });
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/payments/withdraw')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amount: 500, bankAccountNumber: '1234567890', bankIfsc: 'HDFC0001234', bankName: 'HDFC Bank' })
        .expect(HttpStatus.OK);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('amount');
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('createdAt');
    });
  });

  describe('Transaction history', () => {
    it('should return paginated transactions', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(res.body).toHaveProperty('transactions');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page');
      expect(res.body).toHaveProperty('limit');
    });

    it('should filter transactions by type', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/transactions?type=deposit')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(res.body.transactions).toBeInstanceOf(Array);
    });
  });

  describe('Double-spend prevention', () => {
    it('should reject duplicate payment verification for same order', async () => {
      const completedPayment = {
        id: 'pay-1',
        userId: USER_ID,
        orderId: 'ORD_123',
        paymentId: 'pay_abc123',
        amount: 1000,
        status: 'completed',
        bonusPoints: 20,
      };
      mockPaymentRepo.findOne.mockResolvedValueOnce(completedPayment);

      await request(app.getHttpServer())
        .post('/api/v1/payments/verify')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ orderId: 'ORD_123', paymentId: 'pay_abc123' })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('Bonus points on deposit', () => {
    it('should award correct bonus points for deposit amount', async () => {
      const pendingPayment = {
        id: 'pay-2',
        userId: USER_ID,
        orderId: 'ORD_456',
        paymentId: null,
        amount: 1000,
        status: 'pending',
        bonusPoints: 0,
      };
      mockPaymentRepo.findOne.mockResolvedValueOnce(pendingPayment);
      mockPaymentRepo.save.mockImplementationOnce(async (p: any) => ({
        ...p,
        status: 'completed',
        bonusPoints: 300,
      }));

      const res = await request(app.getHttpServer())
        .post('/api/v1/payments/verify')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ orderId: 'ORD_456', paymentId: 'pay_def456' })
        .expect(HttpStatus.OK);

      expect(res.body).toHaveProperty('success', true);
    });
  });
});
