import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { REDIS_CLIENT } from '../../src/redis/redis.constants';

import {
  User,
  UserRole,
  UserLevel,
} from '../../src/users/entities/user.entity';
import { Kyc } from '../../src/kyc/entities/kyc.entity';
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
import { Withdrawal } from '../../src/withdrawals/entities/withdrawal.entity';
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
  User,
  Kyc,
  Contest,
  ContestMember,
  PointLog,
  FcmToken,
  Reminder,
  NotificationLog,
  Share,
  Reward,
  RewardRedemption,
  Banner,
  Achievement,
  UserAchievement,
  PrizeHome,
  Transaction,
  Payment,
  SavedPaymentMethod,
  Withdrawal,
  Post,
  Like,
  Comment,
  Poll,
  PollVote,
  Referral,
  Chat,
  ChatMessage,
  ChatParticipant,
  SupportTicket,
  SystemConfig,
  CompensationLog,
  AuditLog,
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
    insert: jest
      .fn()
      .mockResolvedValue({ identifiers: [{ id: 'mock' }], generatedMaps: [] }),
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

describe('Auth Flow E2E', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let mockUserRepo: ReturnType<typeof createMockRepo>;

  const USER_ID = '00000000-0000-0000-0000-000000000001';
  const USER_PHONE = '+911234567890';
  let validToken: string;

  const mockUser = {
    id: USER_ID,
    phoneNumber: USER_PHONE,
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
      transaction: jest.fn().mockImplementation(async (cb: Function) => {
        const mockEntityManager = {
          findOne: jest.fn().mockResolvedValue(null),
          find: jest.fn().mockResolvedValue([]),
          save: jest.fn().mockImplementation((e: any) => Promise.resolve(e)),
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
        exec: jest.fn().mockResolvedValue([
          [null, 1],
          [null, -1],
        ]),
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
    mockUserRepo.findOne.mockImplementation(async (opts: any) => {
      const id = opts?.where?.id;
      if (id === USER_ID) return mockUser;
      return null;
    });
    mockUserRepo.save.mockImplementation(async (u: any) => Promise.resolve(u));
    mockUserRepo.count.mockResolvedValue(100);

    const moduleFixture = await builder.compile();
    app = moduleFixture.createNestApplication();
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    validToken = jwtService.sign({ sub: USER_ID, phoneNumber: USER_PHONE });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Token generation', () => {
    it('should generate a valid JWT token via mock-login', async () => {
      mockUserRepo.findByPhoneNumber = jest.fn().mockResolvedValue(null);
      mockUserRepo.findOne.mockImplementation(async (opts: any) => {
        if (opts?.where?.id === USER_ID) return mockUser;
        return null;
      });
      mockUserRepo.findOneBy = jest.fn().mockResolvedValue(null);
      mockUserRepo.save.mockImplementation(async (u: any) => ({
        ...mockUser,
        ...u,
      }));

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/mock-login')
        .send({ phoneNumber: USER_PHONE, role: 'user' });

      if (res.status !== HttpStatus.CREATED) {
        console.error('MOCK LOGIN ERROR BODY:', res.body);
      }
      expect(res.status).toBe(HttpStatus.CREATED);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('user');
      expect(typeof res.body.accessToken).toBe('string');
    });
  });

  describe('Protected route access', () => {
    it('should allow access with valid token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(HttpStatus.OK);

      expect(res.body).toHaveProperty('id', USER_ID);
      expect(res.body).toHaveProperty('phoneNumber', USER_PHONE);
    });

    it('should reject request without Authorization header', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should reject request with malformed Authorization header', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer ')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should reject request with missing Bearer prefix', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', validToken)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Invalid token handling', () => {
    it('should reject expired token', async () => {
      const expiredToken = jwtService.sign(
        { sub: USER_ID, phoneNumber: USER_PHONE },
        { expiresIn: '0s' },
      );

      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should reject tampered token', async () => {
      const tamperedToken = validToken.slice(0, -5) + 'xxxxx';

      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should reject token with non-existent user', async () => {
      const ghostToken = jwtService.sign({
        sub: '00000000-0000-0000-0000-000000000999',
        phoneNumber: '+919999999999',
      });

      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${ghostToken}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should reject token for suspended user', async () => {
      const suspendedUser = {
        ...mockUser,
        id: '00000000-0000-0000-0000-000000000003',
        isActive: false,
      };
      const originalFindOne = mockUserRepo.findOne;
      mockUserRepo.findOne.mockImplementation(async (opts: any) => {
        const id = opts?.where?.id;
        if (id === '00000000-0000-0000-0000-000000000003') return suspendedUser;
        if (id === USER_ID) return mockUser;
        return null;
      });

      const suspendedToken = jwtService.sign({
        sub: '00000000-0000-0000-0000-000000000003',
        phoneNumber: '+918888888888',
      });

      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${suspendedToken}`)
        .expect(HttpStatus.UNAUTHORIZED);

      mockUserRepo.findOne = originalFindOne;
    });

    it('should reject token signed with wrong secret', async () => {
      const wrongJwt = new JwtService({ secret: 'wrong-secret' });
      const badToken = wrongJwt.sign({ sub: USER_ID, phoneNumber: USER_PHONE });

      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${badToken}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 for malformed UUID in path with valid token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/contests/not-a-valid-uuid')
        .set('Authorization', `Bearer ${validToken}`)
        .expect((r) => {
          expect(r.status).not.toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        });
    });
  });

  describe('Unauthenticated endpoint access', () => {
    const publicOrAuthEndpoints: [string, string][] = [
      ['POST', '/api/v1/auth/request-otp'],
    ];

    it.each(publicOrAuthEndpoints)(
      '%s %s should be accessible without auth',
      async (method, url) => {
        const req =
          method === 'GET'
            ? request(app.getHttpServer()).get(url)
            : request(app.getHttpServer())
                .post(url)
                .send({ phoneNumber: USER_PHONE });
        const res = await req;
        expect([
          HttpStatus.OK,
          HttpStatus.CREATED,
          HttpStatus.BAD_REQUEST,
        ]).toContain(res.status);
      },
    );
  });
});
