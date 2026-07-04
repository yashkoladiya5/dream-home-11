import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { REDIS_CLIENT } from '../../src/redis/redis.constants';
import { User, UserRole, UserLevel } from '../../src/users/entities/user.entity';
import { Kyc } from '../../src/kyc/entities/kyc.entity';
import { Contest } from '../../src/contests/entities/contest.entity';
import { ContestMember } from '../../src/contests/entities/contest-member.entity';
import { Referral } from '../../src/referral/entities/referral.entity';
import { SupportTicket } from '../../src/support/entities/support-ticket.entity';
import { SystemConfig } from '../../src/config/entities/system-config.entity';
import { JwtService } from '@nestjs/jwt';

const USER_ID = '00000000-0000-0000-0000-000000000001';
const USER_PHONE = '+911234567890';
const ADMIN_ID = '00000000-0000-0000-0000-000000000009';

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

describe('Extra Features (Referrals, Spin, Support, Config, Leaderboard) Flow E2E', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let jwtService: JwtService;
  
  let userToken: string;
  let adminToken: string;

  let mockUserRepo: ReturnType<typeof createMockRepo>;
  let mockReferralRepo: ReturnType<typeof createMockRepo>;
  let mockSupportTicketRepo: ReturnType<typeof createMockRepo>;
  let mockSystemConfigRepo: ReturnType<typeof createMockRepo>;
  let mockRedisClient: any;

  const mockUser = {
    id: USER_ID,
    phoneNumber: USER_PHONE,
    role: UserRole.USER,
    isActive: true,
    walletBalanceInr: 500,
    pointsBalance: 300,
    lifetimePoints: 1200,
    currentTier: UserLevel.SILVER,
    deviceId: 'device-user',
  };

  const mockAdminUser = {
    id: ADMIN_ID,
    phoneNumber: '+919999999999',
    role: UserRole.ADMIN,
    isActive: true,
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
          create: jest.fn().mockImplementation((cls: any, obj: any) => obj ? obj : (cls || {})),
          increment: jest.fn().mockResolvedValue(undefined),
        };
        return cb(mockEntityManager);
      }),
      createQueryRunner: jest.fn().mockReturnValue({
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          createQueryBuilder: jest.fn().mockReturnValue({
            setLock: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockImplementation(async () => {
              return { id: 'referrer-101', pointsBalance: 100, lifetimePoints: 100, currentTier: UserLevel.SILVER };
            }),
          }),
          save: jest.fn().mockImplementation((e: any) => Promise.resolve(e)),
          create: jest.fn().mockImplementation((cls: any, obj: any) => obj ? obj : (cls || {})),
        },
      }),
    };

    mockRedisClient = {
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
      zrevrank: jest.fn().mockResolvedValue(0),
      zscore: jest.fn().mockResolvedValue(500),
      zcard: jest.fn().mockResolvedValue(10),
      zrevrangebyscore: jest.fn().mockResolvedValue([]),
      zrevrange: jest.fn().mockResolvedValue([]),
      hget: jest.fn().mockResolvedValue(null),
      hset: jest.fn().mockResolvedValue(1),
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
    const ALL_ENTITIES = [User, Kyc, Contest, ContestMember, Referral, SupportTicket, SystemConfig];
    
    let builder = Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DataSource)
      .useValue(mockDataSource as any)
      .overrideProvider(REDIS_CLIENT)
      .useValue(mockRedisClient as any);

    for (const entity of ALL_ENTITIES) {
      const mock = createMockRepo();
      repoMocks[(entity as any).name || String(entity)] = mock;
      builder = builder.overrideProvider(getRepositoryToken(entity)).useValue(mock);
    }

    mockUserRepo = repoMocks['User'];
    mockReferralRepo = repoMocks['Referral'];
    mockSupportTicketRepo = repoMocks['SupportTicket'];
    mockSystemConfigRepo = repoMocks['SystemConfig'];

    // Pre-populate the SystemConfig find result so onApplicationBootstrap caches the config correctly
    const configInstance = {
      id: 'config-123',
      appName: 'Dream Home 11',
      appVersion: '1.0.0',
      apiVersion: 'v1',
      environment: 'test',
      maintenanceMode: false,
      dailySpinEnabled: true,
      pollsEnabled: true,
      feedEnabled: true,
      chatEnabled: true,
      referralEnabled: true,
      rootCheckEnabled: true,
      vpnBlockEnabled: false,
    };
    mockSystemConfigRepo.find.mockResolvedValue([configInstance]);
    mockSystemConfigRepo.findOne.mockResolvedValue(configInstance);

    moduleFixture = await builder.compile();
    app = moduleFixture.createNestApplication();
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    userToken = jwtService.sign({ sub: USER_ID, phoneNumber: USER_PHONE });
    adminToken = jwtService.sign({ sub: ADMIN_ID, phoneNumber: '+919999999999' });
  });

  afterAll(async () => {
    await app.close();
  });

  let activeUser: any;
  let activeAdminUser: any;

  beforeEach(() => {
    jest.clearAllMocks();
    activeUser = { ...mockUser };
    activeAdminUser = { ...mockAdminUser };

    mockUserRepo.findOne.mockImplementation(async (opts: any) => {
      const id = opts?.where?.id;
      if (id === USER_ID) return activeUser;
      if (id === ADMIN_ID) return activeAdminUser;
      return null;
    });
    mockUserRepo.save.mockImplementation(async (u: any) => {
      if (u.id === USER_ID) Object.assign(activeUser, u);
      return u;
    });

    mockReferralRepo.findOne.mockResolvedValue(null);
    mockReferralRepo.save.mockImplementation(async (r: any) => Promise.resolve(r));

    mockSupportTicketRepo.save.mockImplementation(async (t: any) => Promise.resolve({ id: 'ticket-123', status: 'OPEN', ...t }));
    mockSupportTicketRepo.findAndCount.mockResolvedValue([[
      { id: 'ticket-123', subject: 'Need Help', message: 'Problem', status: 'OPEN', userId: USER_ID }
    ], 1]);

    const configInstance = {
      id: 'config-123',
      appName: 'Dream Home 11',
      appVersion: '1.0.0',
      apiVersion: 'v1',
      environment: 'test',
      maintenanceMode: false,
      dailySpinEnabled: true,
      pollsEnabled: true,
      feedEnabled: true,
      chatEnabled: true,
      referralEnabled: true,
      rootCheckEnabled: true,
      vpnBlockEnabled: false,
    };
    mockSystemConfigRepo.find.mockResolvedValue([configInstance]);
    mockSystemConfigRepo.findOne.mockResolvedValue(configInstance);
    mockSystemConfigRepo.update.mockImplementation(async (id: any, updates: any) => {
      Object.assign(configInstance, updates);
      return { affected: 1 };
    });
  });

  describe('Referral System (Sprint 7)', () => {
    it('should successfully apply referral code', async () => {
      const referrerUser = { id: 'referrer-101', phoneNumber: '+911111111111', referralCode: 'REF101', pointsBalance: 100, deviceId: 'device-referrer' };
      
      // Override findOne to resolve referrer by referralCode
      mockUserRepo.findOne.mockImplementation(async (opts: any) => {
        const referralCode = opts?.where?.referralCode;
        if (referralCode === 'REF101') return referrerUser;
        const id = opts?.where?.id;
        if (id === USER_ID) return activeUser;
        return null;
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/referral/apply')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ code: 'REF101' })
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('applied');
    });

    it('should retrieve referral stats', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/referral/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(res.body).toHaveProperty('totalReferred');
    });
  });

  describe('Gamification / Spin Wheel (Sprint 7)', () => {
    it('should deduct points and award random prize on spin', async () => {
      // Stub Redis to mock spin cooldown check
      mockRedisClient.get.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .post('/api/v1/gamification/spin')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.CREATED);

      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('prizePoints');
      expect(res.body).toHaveProperty('message');
    });

    it('should retrieve spin wheel cooldown status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/gamification/spin/status')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(res.body).toHaveProperty('canSpin');
    });
  });

  describe('Support tickets module (Sprint 7)', () => {
    it('should successfully submit support ticket', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/support/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ subject: 'Payment Issue', message: 'Failed to add cash' })
        .expect(HttpStatus.CREATED);

      expect(res.body.id).toBe('ticket-123');
      expect(res.body.status).toBe('OPEN');
    });

    it('should fetch user support ticket history', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/support/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(res.body.tickets).toBeInstanceOf(Array);
      expect(res.body.tickets[0].subject).toBe('Need Help');
    });
  });

  describe('System Config Toggles (Sprint 7)', () => {
    it('should fetch general system config parameters', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/config')
        .expect(HttpStatus.OK);

      expect(res.body).toHaveProperty('rootCheckEnabled');
    });

    it('should update config settings as admin', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ maintenanceMode: true })
        .expect(HttpStatus.OK);

      expect(res.body).toHaveProperty('maintenanceMode');
    });
  });

  describe('Real-time Leaderboards (Sprint 8)', () => {
    it('should retrieve global leaderboard from Redis cache', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/leaderboard?cycle=weekly')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(res.body).toHaveProperty('entries');
      expect(res.body).toHaveProperty('userRank');
    });

    it('should fetch user specific ranking status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/leaderboard/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(res.body.userId).toBe(USER_ID);
      expect(res.body).toHaveProperty('rank');
    });
  });
});
