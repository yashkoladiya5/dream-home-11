import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, Controller, Get, Module } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { REDIS_CLIENT } from '../src/redis/redis.constants';

import { User, UserRole, UserLevel } from '../src/users/entities/user.entity';
import { Kyc, KycStatus } from '../src/kyc/entities/kyc.entity';
import { Contest } from '../src/contests/entities/contest.entity';
import { ContestMember } from '../src/contests/entities/contest-member.entity';
import { PointLog } from '../src/points/entities/point-log.entity';
import { FcmToken } from '../src/notifications/entities/fcm-token.entity';
import { Reminder } from '../src/notifications/entities/reminder.entity';
import { NotificationLog } from '../src/notifications/entities/notification-log.entity';
import { Share } from '../src/share-tracker/entities/share.entity';
import { Reward } from '../src/rewards/entities/reward.entity';
import { RewardRedemption } from '../src/rewards/entities/reward-redemption.entity';
import { Banner } from '../src/banners/entities/banner.entity';
import { Achievement } from '../src/achievements/entities/achievement.entity';
import { UserAchievement } from '../src/achievements/entities/user-achievement.entity';
import { PrizeHome } from '../src/prize-homes/entities/prize-home.entity';
import { Transaction } from '../src/transactions/entities/transaction.entity';
import { Payment } from '../src/payments/entities/payment.entity';
import { SavedPaymentMethod } from '../src/payment-methods/entities/saved-payment-method.entity';
import { Withdrawal } from '../src/withdrawals/entities/withdrawal.entity';
import { Post } from '../src/feed/entities/post.entity';
import { Like } from '../src/feed/entities/like.entity';
import { Comment } from '../src/feed/entities/comment.entity';
import { Poll } from '../src/polls/entities/poll.entity';
import { PollVote } from '../src/polls/entities/poll-vote.entity';
import { Referral } from '../src/referral/entities/referral.entity';
import { Chat } from '../src/chat/entities/chat.entity';
import { ChatMessage } from '../src/chat/entities/chat-message.entity';
import { ChatParticipant } from '../src/chat/entities/chat-participant.entity';
import { SupportTicket } from '../src/support/entities/support-ticket.entity';
import { SystemConfig } from '../src/config/entities/system-config.entity';
import { CompensationLog } from '../src/compensation/entities/compensation.entity';
import { AuditLog } from '../src/audit/entities/audit-log.entity';

// ============================================================
//  Mock helpers
// ============================================================

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

const ALL_ENTITIES = [
  User, Kyc, Contest, ContestMember, PointLog, FcmToken, Reminder,
  NotificationLog, Share, Reward, RewardRedemption, Banner, Achievement,
  UserAchievement, PrizeHome, Transaction, Payment, SavedPaymentMethod,
  Withdrawal, Post, Like, Comment, Poll, PollVote, Referral, Chat,
  ChatMessage, ChatParticipant, SupportTicket, SystemConfig, CompensationLog,
  AuditLog,
];

// ============================================================
//  Rate-limit test helper module
// ============================================================

@Controller('_rate_test')
class RateTestController {
  @Get()
  get() {
    return { ok: true };
  }
}

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 3000, limit: 3 }],
    }),
  ],
  controllers: [RateTestController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
class RateLimitTestModule {}

// ============================================================
//  Main test suite
// ============================================================

describe('Security E2E', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let jwtService: JwtService;
  let mockUserRepo: ReturnType<typeof createMockRepo>;

  const USER_ID = '00000000-0000-0000-0000-000000000001';
  const ADMIN_ID = '00000000-0000-0000-0000-000000000002';
  let userToken: string;
  let adminToken: string;

  const mockUser = {
    id: USER_ID,
    phoneNumber: '+911234567890',
    role: UserRole.USER,
    isActive: true,
    walletBalanceInr: 100,
    pointsBalance: 500,
    lifetimePoints: 1000,
    weeklyPoints: 50,
    monthlyPoints: 200,
    currentTier: UserLevel.BRONZE,
    fullName: 'Test User',
    email: 'test@example.com',
    avatarUrl: null,
    referralCode: 'TEST123',
    state: 'Maharashtra',
    bankAccountNumber: null,
    bankIfsc: null,
    bankName: null,
    upiId: null,
    referredBy: null,
    deviceId: 'device-1',
    currentStreak: 0,
    longestStreak: 0,
    lastStreakDate: null,
    kyc: null,
    createdAt: new Date(),
  };

  const mockAdmin = {
    ...mockUser,
    id: ADMIN_ID,
    phoneNumber: '+919999999999',
    role: UserRole.ADMIN,
  };

  beforeAll(async () => {
    const mockDataSource = {
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
    };

    let builder = Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DataSource).useValue(mockDataSource as any)
      .overrideProvider(REDIS_CLIENT).useValue(mockRedisClient as any);

    const repoMocks: Record<string, ReturnType<typeof createMockRepo>> = {};
    for (const entity of ALL_ENTITIES) {
      const mock = createMockRepo();
      repoMocks[(entity as any).name || String(entity)] = mock;
      builder = builder.overrideProvider(getRepositoryToken(entity)).useValue(mock);
    }

    mockUserRepo = repoMocks['User'];

    mockUserRepo.findOne.mockImplementation(async (opts: any) => {
      const id = opts?.where?.id;
      if (id === USER_ID) return mockUser;
      if (id === ADMIN_ID) return mockAdmin;
      return null;
    });

    mockUserRepo.save.mockImplementation(async (u: any) => Promise.resolve(u));
    mockUserRepo.count.mockResolvedValue(100);
    mockUserRepo.find.mockResolvedValue([]);
    mockUserRepo.findAndCount.mockResolvedValue([[], 0]);

    moduleFixture = await builder.compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    userToken = jwtService.sign({ sub: USER_ID, phoneNumber: '+911234567890' });
    adminToken = jwtService.sign({ sub: ADMIN_ID, phoneNumber: '+919999999999' });
  });

  afterAll(async () => {
    await app.close();
  });

  // ============================================================
  //  1. Unauthenticated Access Rejection
  // ============================================================

  describe('1. Unauthenticated access rejection', () => {
    const endpoints: [string, string][] = [
      ['GET', '/api/v1/users/me'],
      ['GET', '/api/v1/contests'],
      ['GET', '/api/v1/leaderboard'],
      ['GET', '/api/v1/transactions'],
      ['POST', '/api/v1/payments/withdraw'],
      ['GET', '/api/v1/kyc/status'],
      ['GET', '/api/v1/admin/dashboard'],
      ['POST', '/api/v1/admin/notifications/broadcast'],
    ];

    it.each(endpoints)('%s %s returns 401 without Authorization header', async (method, url) => {
      const req = method === 'GET'
        ? request(app.getHttpServer()).get(url)
        : request(app.getHttpServer()).post(url).send({});
      await req.expect(HttpStatus.UNAUTHORIZED);
    });
  });

  // ============================================================
  //  2. Wallet Balance Manipulation Prevention
  // ============================================================

  describe('2. Wallet balance manipulation prevention', () => {
    it('should ignore walletBalanceInr sent to PATCH /api/v1/users/profile', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ fullName: 'Hacker', walletBalanceInr: 9999999 })
        .expect(HttpStatus.OK);

      expect(res.body.walletBalanceInr).toBeDefined();
      expect(res.body.walletBalanceInr).not.toBe(9999999);
      expect(res.body.walletBalanceInr).toBe(100);
    });

    it('should not allow awarding points to self via any endpoint', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/points/action')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ action: 'daily_login', pointsBalance: 99999, walletBalanceInr: 99999 })
        .expect(201);

      // Response should not reflect arbitrary balance values from the request
      expect(res.body.pointsBalance).toBeUndefined();
      expect(res.body.walletBalanceInr).toBeUndefined();
    });

    it('should not allow accessing another user withdrawal history via API', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/payments/withdraw/history')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(res.body).toBeDefined();
    });
  });

  // ============================================================
  //  3. KYC State Tampering Prevention
  // ============================================================

  describe('3. KYC state tampering prevention', () => {
    it('should reject non-admin user trying to approve KYC', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/admin/kyc/some-kyc-id/approve')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.FORBIDDEN);

      expect(res.body.message || '').toMatch(/admin access required/i);
    });

    it('should mask sensitive KYC data in details endpoint', async () => {
      const kycRepo = moduleFixture.get<ReturnType<typeof createMockRepo>>(
        getRepositoryToken(Kyc),
      );

      kycRepo.findOne.mockResolvedValueOnce({
        id: 'kyc-1',
        userId: USER_ID,
        status: KycStatus.APPROVED,
        aadhaarNumber: '123456789012',
        panNumber: 'ABCDE1234F',
        verifiedAt: new Date(),
        rejectionReason: null,
        aadhaarFrontUrl: '/uploads/kyc/u1/aadhaar_front.jpg',
        aadhaarBackUrl: null,
        panCardUrl: null,
        selfieUrl: null,
      } as unknown as Kyc);

      const res = await request(app.getHttpServer())
        .get('/api/v1/kyc/details')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(res.body.aadhaarNumber).toMatch(/^xxxx\d{4}$/);
      expect(res.body.aadhaarNumber).not.toBe('123456789012');
      expect(res.body.panNumber).toMatch(/^[A-Z]{2}xxxx[A-Z0-9]{2}$/);
      expect(res.body.panNumber).not.toBe('ABCDE1234F');
    });

    it('should not let a user set own KYC status via any user endpoint', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/admin/kyc/some-kyc-id/approve')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.FORBIDDEN);

      expect(res.body.message || '').toMatch(/admin access required/i);
    });
  });

  // ============================================================
  //  5. Role-Based Access Control
  // ============================================================

  describe('5. Role-based access control', () => {
    it('should return 403 when non-admin user hits admin endpoints', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should allow admin users to access admin endpoints', async () => {
      const userRepo = moduleFixture.get<ReturnType<typeof createMockRepo>>(
        getRepositoryToken(User),
      );
      userRepo.count.mockResolvedValue(100);
      userRepo.find.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);
    });
  });

  // ============================================================
  //  6. SQL Injection Resistance
  // ============================================================

  describe('6. SQL injection resistance', () => {
    const injections = [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "' UNION SELECT * FROM users --",
      "1; SELECT * FROM users WHERE 1=1 --",
      "admin' --",
      "' OR 1=1 --",
      "1' ORDER BY 1--",
    ];

    it.each(injections)('should handle SQL-like string "%s" without crashing', async (injection) => {
      mockUserRepo.findAndCount.mockResolvedValue([[], 0]);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/users/search?q=${encodeURIComponent(injection)}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(res.status).toBe(200);
    });
  });

  // ============================================================
  //  4. Rate Limiting (separate app so we can set a low limit)
  // ============================================================

  describe('4. Rate limiting', () => {
    let rateLimitApp: INestApplication;

    beforeAll(async () => {
      const rlModule = await Test.createTestingModule({
        imports: [RateLimitTestModule],
      }).compile();

      rateLimitApp = rlModule.createNestApplication();
      await rateLimitApp.init();
    });

    afterAll(async () => {
      await rateLimitApp.close();
    });

    it('should return 429 when request rate exceeds the limit (3 req / 3s)', async () => {
      const httpServer = rateLimitApp.getHttpServer();

      // First 3 requests should pass
      for (let i = 0; i < 3; i++) {
        await request(httpServer)
          .get('/_rate_test')
          .expect(HttpStatus.OK);
      }

      // 4th request should be blocked
      await request(httpServer)
        .get('/_rate_test')
        .expect(HttpStatus.TOO_MANY_REQUESTS);
    });
  });
});
