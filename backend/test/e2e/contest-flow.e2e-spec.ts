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
import { Kyc, KycStatus } from '../../src/kyc/entities/kyc.entity';
import {
  Contest,
  ContestStatus,
  ContestType,
} from '../../src/contests/entities/contest.entity';
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

describe('Contest Flow E2E', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let jwtService: JwtService;
  let mockContestRepo: ReturnType<typeof createMockRepo>;
  let mockContestMemberRepo: ReturnType<typeof createMockRepo>;
  let mockUserRepo: ReturnType<typeof createMockRepo>;
  let mockDataSource: any;

  const USER_ID = '00000000-0000-0000-0000-000000000001';
  const CONTEST_ID = '00000000-0000-0000-0000-000000000010';
  let userToken: string;

  const mockUser = {
    id: USER_ID,
    phoneNumber: '+911234567890',
    role: UserRole.USER,
    isActive: true,
    walletBalanceInr: 500,
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

  const mockContest = {
    id: CONTEST_ID,
    title: 'Test Contest',
    type: ContestType.NORMAL,
    entryFeeInr: 50,
    pointsToJoin: 10,
    maxSlots: 10,
    filledSlots: 0,
    prize: '₹500',
    badgeText: null,
    badgeColor: null,
    rules: null,
    inviteCode: 'TESTCODE',
    startTime: new Date(),
    endTime: new Date(Date.now() + 86400000),
    status: ContestStatus.RUNNING,
    createdAt: new Date(),
    compensationStatus: 'none',
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
          findOne: jest.fn().mockResolvedValue(null),
          find: jest.fn().mockResolvedValue([]),
          save: jest.fn().mockImplementation((e: any) => Promise.resolve(e)),
          create: jest
            .fn()
            .mockImplementation((cls: any, obj: any) =>
              obj ? obj : cls || {},
            ),
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
      .useValue(mockDataSource)
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
    mockContestRepo = repoMocks['Contest'];
    mockContestMemberRepo = repoMocks['ContestMember'];

    mockUserRepo.findOne.mockImplementation(async (opts: any) => {
      const id = opts?.where?.id;
      if (id === USER_ID) return mockUser;
      return null;
    });
    mockUserRepo.save.mockImplementation(async (u: any) => Promise.resolve(u));
    mockUserRepo.count.mockResolvedValue(100);

    mockContestRepo.findOne.mockImplementation(async (opts: any) => {
      if (opts?.where?.id === CONTEST_ID) return { ...mockContest };
      return null;
    });
    mockContestRepo.findAndCount.mockResolvedValue([[{ ...mockContest }], 1]);
    mockContestRepo.save.mockImplementation(async (c: any) =>
      Promise.resolve(c),
    );

    mockContestMemberRepo.find.mockResolvedValue([]);
    mockContestMemberRepo.findAndCount.mockResolvedValue([[], 0]);
    mockContestMemberRepo.findOne.mockResolvedValue(null);
    mockContestMemberRepo.save.mockImplementation(async (m: any) =>
      Promise.resolve(m),
    );

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
        findOne: jest.fn().mockResolvedValue(null),
        find: jest.fn().mockResolvedValue([]),
        save: jest.fn().mockImplementation((e: any) => Promise.resolve(e)),
        create: jest
          .fn()
          .mockImplementation((cls: any, obj: any) => (obj ? obj : cls || {})),
      };
      return cb(mockEntityManager);
    });
  });

  describe('GET /api/v1/contests', () => {
    it('should return contest list with pagination', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/contests')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(res.body).toHaveProperty('contests');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page');
      expect(res.body).toHaveProperty('limit');
    });

    it('should filter contests by type', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/contests?type=normal')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(res.body.contests).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/v1/contests/:id/join', () => {
    it('should successfully join a contest with sufficient balance', async () => {
      const emFindOne = jest
        .fn()
        .mockImplementation(async (entity: any, opts: any) => {
          if (entity === Contest) {
            return { ...mockContest, filledSlots: 5 };
          }
          if (entity === User) {
            return { ...mockUser, walletBalanceInr: 500 };
          }
          return null;
        });
      const emSave = jest
        .fn()
        .mockImplementation((e: any) => Promise.resolve(e));
      const emCreate = jest
        .fn()
        .mockImplementation((cls: any, obj: any) => (obj ? obj : cls || {}));

      mockDataSource.transaction.mockImplementation(async (cb: Function) => {
        const mockEm = {
          findOne: emFindOne,
          save: emSave,
          create: emCreate,
          find: jest.fn().mockResolvedValue([]),
        };
        return cb(mockEm);
      });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/contests/${CONTEST_ID}/join`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(HttpStatus.OK);

      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('contest');
      expect(res.body).toHaveProperty('member');
    });

    it('should reject joining without auth', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/contests/${CONTEST_ID}/join`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should reject joining a non-existent contest', async () => {
      mockContestRepo.findOne.mockResolvedValueOnce(null);

      await request(app.getHttpServer())
        .post('/api/v1/contests/00000000-0000-0000-0000-000000009999/join')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('Contest capacity constraints', () => {
    it('should reject joining a full contest', async () => {
      mockContestRepo.findOne.mockResolvedValueOnce({
        ...mockContest,
        filledSlots: 10,
        maxSlots: 10,
      });

      mockDataSource.transaction.mockImplementation(async (cb: Function) => {
        const emFindOne = jest.fn().mockImplementation(async (entity: any) => {
          if (entity === Contest) {
            return { ...mockContest, filledSlots: 10, maxSlots: 10 };
          }
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
        .post(`/api/v1/contests/${CONTEST_ID}/join`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject joining with insufficient wallet balance', async () => {
      mockContestRepo.findOne.mockResolvedValueOnce({
        ...mockContest,
        entryFeeInr: 1000,
        filledSlots: 3,
      });

      mockDataSource.transaction.mockImplementation(async (cb: Function) => {
        const emFindOne = jest.fn().mockImplementation(async (entity: any) => {
          if (entity === Contest) {
            return { ...mockContest, entryFeeInr: 1000, filledSlots: 3 };
          }
          if (entity === User) {
            return { ...mockUser, walletBalanceInr: 10 };
          }
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
        .post(`/api/v1/contests/${CONTEST_ID}/join`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject joining an already-joined contest', async () => {
      mockContestRepo.findOne.mockResolvedValueOnce({
        ...mockContest,
        filledSlots: 3,
      });

      mockDataSource.transaction.mockImplementation(async (cb: Function) => {
        const emFindOne = jest
          .fn()
          .mockImplementation(async (entity: any, opts?: any) => {
            if (entity === Contest) {
              return { ...mockContest, filledSlots: 3 };
            }
            if (entity === User) {
              return { ...mockUser, walletBalanceInr: 500 };
            }
            if (entity === ContestMember) {
              return {
                id: 'existing-member',
                contestId: CONTEST_ID,
                userId: USER_ID,
              };
            }
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
        .post(`/api/v1/contests/${CONTEST_ID}/join`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('Contest join failure rollback', () => {
    it('should release slot on failed transaction', async () => {
      mockDataSource.transaction.mockImplementation(async (cb: Function) => {
        const emFindOne = jest.fn().mockImplementation(async (entity: any) => {
          if (entity === Contest) {
            return { ...mockContest, filledSlots: 5 };
          }
          if (entity === User) {
            return { ...mockUser, walletBalanceInr: 500 };
          }
          return null;
        });
        const emSave = jest.fn().mockRejectedValue(new Error('DB error'));
        return cb({
          findOne: emFindOne,
          save: emSave,
          create: jest.fn(),
          find: jest.fn().mockResolvedValue([]),
        });
      });

      await request(app.getHttpServer())
        .post(`/api/v1/contests/${CONTEST_ID}/join`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect((r) => {
          expect([
            HttpStatus.INTERNAL_SERVER_ERROR,
            HttpStatus.BAD_REQUEST,
          ]).toContain(r.status);
        });
    });
  });
});
