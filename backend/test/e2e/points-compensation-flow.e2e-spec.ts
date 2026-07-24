import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { REDIS_CLIENT } from '../../src/redis/redis.constants';
import { User, UserLevel } from '../../src/users/entities/user.entity';
import { Kyc } from '../../src/kyc/entities/kyc.entity';
import {
  Contest,
  ContestStatus,
  CompensationStatus as ContestCompensationStatus,
} from '../../src/contests/entities/contest.entity';
import { ContestMember } from '../../src/contests/entities/contest-member.entity';
import { PointLog } from '../../src/points/entities/point-log.entity';
import { CompensationLog } from '../../src/compensation/entities/compensation.entity';
import { JwtService } from '@nestjs/jwt';
import { StreakService } from '../../src/points/streak.service';
import { CompensationService } from '../../src/compensation/compensation.service';

const USER_ID = '00000000-0000-0000-0000-000000000001';
const USER_PHONE = '+911234567890';
const CONTEST_ID = '00000000-0000-0000-0000-000000000010';

const createMockRepo = () => ({
  findOne: jest.fn().mockResolvedValue(null),
  findOneBy: jest.fn().mockResolvedValue(null),
  find: jest.fn().mockResolvedValue([]),
  findAndCount: jest.fn().mockResolvedValue([[], 0]),
  save: jest.fn().mockImplementation((e: any) => Promise.resolve(e)),
  create: jest.fn().mockImplementation((e: any) => e || {}),
  count: jest.fn().mockResolvedValue(0),
  update: jest.fn().mockResolvedValue({}),
  delete: jest.fn().mockResolvedValue({}),
  createQueryBuilder: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ affected: 1 }),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  }),
});

describe('Points & Compensation Flow E2E', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let jwtService: JwtService;
  let userToken: string;
  let streakService: StreakService;
  let compensationService: CompensationService;

  let mockUserRepo: ReturnType<typeof createMockRepo>;
  let mockContestRepo: ReturnType<typeof createMockRepo>;
  let mockContestMemberRepo: ReturnType<typeof createMockRepo>;
  let mockPointLogRepo: ReturnType<typeof createMockRepo>;
  let mockCompensationLogRepo: ReturnType<typeof createMockRepo>;
  let mockDataSource: any;

  const mockUser = {
    id: USER_ID,
    phoneNumber: USER_PHONE,
    role: 'user',
    isActive: true,
    walletBalanceInr: 1000,
    pointsBalance: 500,
    lifetimePoints: 1200,
    currentTier: UserLevel.SILVER,
    currentStreak: 5,
    longestStreak: 5,
    lastStreakDate: new Date(),
    referralCode: 'TEST123',
    state: 'Maharashtra',
  };

  const mockContest = {
    id: CONTEST_ID,
    title: 'Test Contest',
    entryFeeInr: 99,
    pointsToJoin: 10,
    maxSlots: 10,
    filledSlots: 2,
    status: ContestStatus.RUNNING,
    compensationStatus: ContestCompensationStatus.NONE,
    endTime: new Date(Date.now() - 10000),
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
          findOne: jest
            .fn()
            .mockImplementation(async (entity: any, opts?: any) => {
              if (entity === User) return mockUserRepo.findOne(opts);
              if (entity === Contest) return mockContestRepo.findOne(opts);
              return null;
            }),
          find: jest.fn().mockResolvedValue([]),
          save: jest
            .fn()
            .mockImplementation((arg1: any, arg2?: any) =>
              Promise.resolve(arg2 ? arg2 : arg1),
            ),
          create: jest
            .fn()
            .mockImplementation((cls: any, obj: any) =>
              obj ? obj : cls || {},
            ),
          increment: jest.fn().mockResolvedValue(undefined),
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

    const repoMocks: Record<string, ReturnType<typeof createMockRepo>> = {};
    const ALL_ENTITIES = [
      User,
      Kyc,
      Contest,
      ContestMember,
      PointLog,
      CompensationLog,
    ];

    let builder = Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DataSource)
      .useValue(mockDataSource)
      .overrideProvider(REDIS_CLIENT)
      .useValue(mockRedisClient as any);

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
    mockPointLogRepo = repoMocks['PointLog'];
    mockCompensationLogRepo = repoMocks['CompensationLog'];

    moduleFixture = await builder.compile();
    app = moduleFixture.createNestApplication();
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    streakService = moduleFixture.get<StreakService>(StreakService);
    compensationService =
      moduleFixture.get<CompensationService>(CompensationService);
    userToken = jwtService.sign({ sub: USER_ID, phoneNumber: USER_PHONE });
  });

  afterAll(async () => {
    await app.close();
  });

  let activeUser: any;

  beforeEach(() => {
    jest.clearAllMocks();
    activeUser = { ...mockUser };

    mockUserRepo.findOne.mockImplementation(async (opts: any) => {
      const id = opts?.where?.id;
      if (id === USER_ID) return activeUser;
      return null;
    });
    mockUserRepo.save.mockImplementation(async (u: any) => {
      Object.assign(activeUser, u);
      return activeUser;
    });

    mockUserRepo.manager = {
      transaction: jest.fn().mockImplementation(async (cb: Function) => {
        const mockEntityManager = {
          findOne: jest
            .fn()
            .mockImplementation(async (entity: any, opts?: any) => {
              if (entity === User) return mockUserRepo.findOne(opts);
              if (entity === Contest) return mockContestRepo.findOne(opts);
              return null;
            }),
          find: jest.fn().mockResolvedValue([]),
          save: jest.fn().mockImplementation((arg1: any, arg2?: any) => {
            const saved = arg2 ? arg2 : arg1;
            if (arg1 === User || arg2?.constructor?.name === 'User') {
              Object.assign(activeUser, saved);
              return Promise.resolve(activeUser);
            }
            return Promise.resolve(saved);
          }),
          create: jest
            .fn()
            .mockImplementation((cls: any, obj: any) =>
              obj ? obj : cls || {},
            ),
          increment: jest
            .fn()
            .mockImplementation(
              async (
                entityCls: any,
                criteria: any,
                propertyName: string,
                value: number,
              ) => {
                if (entityCls === User && criteria.id === USER_ID) {
                  activeUser[propertyName] =
                    Number(activeUser[propertyName] || 0) + value;
                }
              },
            ),
        };
        return cb(mockEntityManager);
      }),
    } as any;

    mockDataSource.transaction.mockImplementation(async (cb: Function) => {
      return mockUserRepo.manager.transaction(cb);
    });

    mockContestRepo.findOne.mockImplementation(async (opts: any) => {
      const id = opts?.where?.id;
      if (id === CONTEST_ID) return { ...mockContest };
      return null;
    });
    mockContestRepo.save.mockImplementation(async (c: any) =>
      Promise.resolve(c),
    );
    mockContestRepo.find.mockResolvedValue([]);
  });

  describe('Points Engine Actions & Daily Caps (Sprint 5)', () => {
    it('should successfully perform a daily point action', async () => {
      mockPointLogRepo.count.mockResolvedValue(0);

      const res = await request(app.getHttpServer())
        .post('/api/v1/points/action')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ action: 'app_open' })
        .expect(HttpStatus.CREATED);

      expect(res.body.success).toBe(true);
      expect(res.body.action).toBe('app_open');
      expect(res.body.finalPoints).toBe(11);
    });

    it('should reject daily point action once cap is reached', async () => {
      mockPointLogRepo.count.mockResolvedValue(1);

      const res = await request(app.getHttpServer())
        .post('/api/v1/points/action')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ action: 'app_open' })
        .expect(HttpStatus.CREATED);

      expect(res.body.success).toBe(false);
      expect(res.body.reason).toContain('Daily cap reached');
    });

    it('should return list of daily actions with status', async () => {
      mockPointLogRepo.count.mockResolvedValue(0);
      mockPointLogRepo.find.mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .get('/api/v1/points/actions/today')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(res.body.actions).toBeInstanceOf(Array);
      expect(res.body.todayPoints).toBe(0);
    });
  });

  describe('Streak Service & Missed Day Penalties (Sprint 5)', () => {
    it('should increment streak and award bonus on 7-day milestone', async () => {
      activeUser.currentStreak = 6;
      activeUser.lastStreakDate = new Date(Date.now() - 86400000);

      const res = await request(app.getHttpServer())
        .post('/api/v1/points/action')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ action: 'daily_login' })
        .expect(HttpStatus.CREATED);

      expect(res.body.success).toBe(true);
      expect(res.body.streak).toBe(7);
      expect(res.body.streakBonusAwarded).toBe(true);
      expect(res.body.streakBonusPoints).toBe(100);
    });

    it('should reset streak to 1 if user missed a day', async () => {
      activeUser.currentStreak = 5;
      activeUser.lastStreakDate = new Date(Date.now() - 86400000 * 3);

      const res = await request(app.getHttpServer())
        .post('/api/v1/points/action')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ action: 'daily_login' })
        .expect(HttpStatus.CREATED);

      expect(res.body.success).toBe(true);
      expect(res.body.streak).toBe(1);
    });

    it('should apply missed day penalties to inactive streak users', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 3);
      const userToPenalize = {
        ...mockUser,
        lastStreakDate: oldDate,
        pointsBalance: 500,
      };

      mockUserRepo.find.mockResolvedValueOnce([userToPenalize]);

      const penalitiesCount = await streakService.applyMissedDayPenalties();
      expect(penalitiesCount).toBe(1);
      expect(userToPenalize.pointsBalance).toBe(300);
      expect(userToPenalize.currentStreak).toBe(0);
    });
  });

  describe('Point Compensation Engine (Sprint 6)', () => {
    it('should auto-close expired running contests as CANCELLED if not full', async () => {
      const expiredContest = {
        ...mockContest,
        status: ContestStatus.RUNNING,
        filledSlots: 2,
        maxSlots: 10,
        endTime: new Date(Date.now() - 10000),
      };
      mockContestRepo.find.mockResolvedValueOnce([expiredContest]);

      const closeResult = await compensationService.autoCloseExpiredContests();
      expect(closeResult.cancelled).toBe(1);
      expect(closeResult.completed).toBe(0);
      expect(expiredContest.status).toBe(ContestStatus.CANCELLED);
    });

    it('should process points compensation for cancelled contest members', async () => {
      const cancelledContest = {
        ...mockContest,
        status: ContestStatus.CANCELLED,
        entryFeeInr: 99,
        members: [
          {
            id: 'm-1',
            userId: USER_ID,
            user: activeUser,
          },
        ],
      } as any;

      mockContestRepo.findOne.mockResolvedValueOnce(cancelledContest);

      const compResult =
        await compensationService.processCompensation(cancelledContest);
      expect(compResult.processed).toBe(1);
      expect(compResult.totalPoints).toBe(275);
    });
  });
});
