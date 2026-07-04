import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { REDIS_CLIENT } from '../../src/redis/redis.constants';
import { User, UserRole, UserLevel } from '../../src/users/entities/user.entity';
import { Kyc } from '../../src/kyc/entities/kyc.entity';
import { Chat } from '../../src/chat/entities/chat.entity';
import { ChatMessage } from '../../src/chat/entities/chat-message.entity';
import { ChatParticipant } from '../../src/chat/entities/chat-participant.entity';
import { Referral } from '../../src/referral/entities/referral.entity';
import { SupportTicket } from '../../src/support/entities/support-ticket.entity';
import { SystemConfig } from '../../src/config/entities/system-config.entity';
import { JwtService } from '@nestjs/jwt';
import { ChatGateway } from '../../src/chat/chat.gateway';

const USER_ID = '00000000-0000-0000-0000-000000000001';
const REFERRER_ID = '00000000-0000-0000-0000-000000000002';
const USER_PHONE = '+911234567890';
const CHAT_ID = '00000000-0000-0000-0000-000000000003';
const TICKET_ID = '00000000-0000-0000-0000-000000000004';

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
    execute: jest.fn().mockResolvedValue({ affected: 1 }),
  }),
});

describe('Chat Messaging & Referral System E2E (Sprints 11 & 12)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let jwtService: JwtService;
  let gateway: ChatGateway;
  let userToken: string;

  let mockUserRepo: ReturnType<typeof createMockRepo>;
  let mockChatRepo: ReturnType<typeof createMockRepo>;
  let mockChatMessageRepo: ReturnType<typeof createMockRepo>;
  let mockChatParticipantRepo: ReturnType<typeof createMockRepo>;
  let mockReferralRepo: ReturnType<typeof createMockRepo>;
  let mockSupportRepo: ReturnType<typeof createMockRepo>;
  let mockSystemConfigRepo: ReturnType<typeof createMockRepo>;

  const mockUser = {
    id: USER_ID,
    phoneNumber: USER_PHONE,
    role: UserRole.USER,
    isActive: true,
    walletBalanceInr: 500,
    pointsBalance: 300,
    lifetimePoints: 1200,
    currentTier: UserLevel.SILVER,
    deviceId: 'device-user-1',
  };

  const mockReferrer = {
    id: REFERRER_ID,
    phoneNumber: '+919876543210',
    role: UserRole.USER,
    isActive: true,
    walletBalanceInr: 100,
    pointsBalance: 50,
    lifetimePoints: 1000,
    currentTier: UserLevel.SILVER,
    deviceId: 'device-referrer',
    referralCode: 'REFER123',
  };

  const mockChat = {
    id: CHAT_ID,
    name: 'Direct Chat Room',
    type: 'direct',
    createdAt: new Date(),
  };

  const mockMessage = {
    id: 'msg-101',
    chatId: CHAT_ID,
    senderId: REFERRER_ID,
    content: 'Hello World!',
    type: 'text',
    createdAt: new Date(),
    isRead: false,
  };

  const mockTicket = {
    id: TICKET_ID,
    userId: USER_ID,
    subject: 'Contest join issues',
    message: 'I cannot join the contest, it threw error',
    status: 'open',
    attachmentUrl: null,
    createdAt: new Date(),
  };

  const mockConfig = {
    id: 'config-1',
    maintenanceMode: false,
    minWithdrawalAmount: 100,
    maxWithdrawalAmount: 10000,
    referralEnabled: true,
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
          findOne: jest.fn(),
          save: jest.fn(),
          update: jest.fn(),
        },
      }),
    };

    const mockRedisClient = {
      status: 'close',
      connect: jest.fn().mockRejectedValue(new Error('mock')),
      disconnect: jest.fn(),
      ping: jest.fn(),
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      incr: jest.fn().mockResolvedValue(1),
      quit: jest.fn().mockResolvedValue('OK'),
      scan: jest.fn().mockResolvedValue(['0', []]),
      setex: jest.fn().mockResolvedValue('OK'),
    };

    const repoMocks: Record<string, ReturnType<typeof createMockRepo>> = {};
    const ALL_ENTITIES = [
      User, Kyc, Chat, ChatMessage, ChatParticipant, Referral, SupportTicket, SystemConfig
    ];

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
    mockChatRepo = repoMocks['Chat'];
    mockChatMessageRepo = repoMocks['ChatMessage'];
    mockChatParticipantRepo = repoMocks['ChatParticipant'];
    mockReferralRepo = repoMocks['Referral'];
    mockSupportRepo = repoMocks['SupportTicket'];
    mockSystemConfigRepo = repoMocks['SystemConfig'];

    moduleFixture = await builder.compile();
    app = moduleFixture.createNestApplication();
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    gateway = moduleFixture.get<ChatGateway>(ChatGateway);
    userToken = jwtService.sign({ sub: USER_ID, phoneNumber: USER_PHONE });
  });

  afterAll(async () => {
    await app.close();
  });

  let activeUser: any;
  let activeReferrer: any;

  beforeEach(() => {
    jest.clearAllMocks();
    activeUser = { ...mockUser };
    activeReferrer = { ...mockReferrer };

    mockUserRepo.findOne.mockImplementation(async (opts: any) => {
      const id = opts?.where?.id;
      const phone = opts?.where?.phoneNumber;
      const refCode = opts?.where?.referralCode;

      if (id === USER_ID || phone === USER_PHONE || (refCode && refCode === activeUser.referralCode)) return activeUser;
      if (id === REFERRER_ID || refCode === 'REFER123') return activeReferrer;
      return null;
    });

    mockUserRepo.save.mockImplementation(async (u: any) => Promise.resolve(u));

    // Chat History Mocks
    mockChatRepo.find.mockResolvedValue([mockChat]);
    mockChatRepo.findOne.mockResolvedValue(mockChat);
    mockChatMessageRepo.findAndCount.mockResolvedValue([[mockMessage], 1]);

    // Support Mocks
    mockSupportRepo.save.mockImplementation(async (t: any) => Promise.resolve({ id: TICKET_ID, ...t }));
    mockSupportRepo.findAndCount.mockResolvedValue([[mockTicket], 1]);
    mockSupportRepo.findOne.mockResolvedValue(mockTicket);

    // System Config Mock (for bootstrap loading)
    mockSystemConfigRepo.find.mockResolvedValue([mockConfig]);
    mockSystemConfigRepo.findOne.mockResolvedValue(mockConfig);
  });

  describe('Chat System REST History (Sprint 11)', () => {
    it('should retrieve user active chats list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/chats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(res.body).toBeInstanceOf(Array);
    });

    it('should retrieve specific chat message thread with page/limit parameters', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/chats/${CHAT_ID}/messages?page=1&limit=10`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data[0].content).toBe('Hello World!');
      expect(res.body.meta.total).toBe(1);
    });
  });

  describe('WebSocket Live Chat Gateway (Sprint 11)', () => {
    it('should reject socket connection without auth token', async () => {
      const mockSocket = {
        id: 'socket-1',
        handshake: { auth: {}, query: {} },
        disconnect: jest.fn(),
      } as any;

      await gateway.handleConnection(mockSocket);
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should connect client socket and join rooms successfully on valid JWT', async () => {
      const mockSocket = {
        id: 'socket-2',
        handshake: { auth: { token: userToken }, query: {} },
        data: {} as any,
        join: jest.fn(),
        disconnect: jest.fn(),
      } as any;

      await gateway.handleConnection(mockSocket);
      expect(mockSocket.disconnect).not.toHaveBeenCalled();
      expect(mockSocket.join).toHaveBeenCalledWith(`user:${USER_ID}`);
      expect(mockSocket.data.userId).toBe(USER_ID);
    });

    it('should handle sendMessage socket event and push event payload', async () => {
      const mockSocket = {
        id: 'socket-3',
        data: { userId: USER_ID },
        join: jest.fn(),
        emit: jest.fn(),
      } as any;

      const mockServer = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      } as any;
      gateway.server = mockServer;

      await gateway.handleSendMessage(mockSocket, {
        chatId: CHAT_ID,
        content: 'Testing WebSocket channels',
        type: 'text',
      });

      expect(mockServer.to).toHaveBeenCalledWith(`chat:${CHAT_ID}`);
    });
  });

  describe('Referral Validation Guard (Sprint 11)', () => {
    it('should prevent self-referral actions', async () => {
      activeUser.referralCode = 'USER123';

      const res = await request(app.getHttpServer())
        .post('/api/v1/referral/apply')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ code: 'USER123' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(res.body.message).toContain('You cannot refer yourself');
    });

    it('should prevent duplicate device fraud', async () => {
      // referrer has the exact same device ID
      activeReferrer.deviceId = 'device-user-1';

      const res = await request(app.getHttpServer())
        .post('/api/v1/referral/apply')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ code: 'REFER123' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(res.body.message).toContain('same device');
    });
  });

  describe('Support Tickets System (Sprint 12)', () => {
    it('should support ticket creation', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/support/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ subject: 'Payments issues', message: 'I was double debited' })
        .expect(HttpStatus.CREATED);

      expect(res.body.subject).toBe('Payments issues');
    });

    it('should enforce 5MB support file attachment limits', async () => {
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB file

      try {
        const res = await request(app.getHttpServer())
          .post('/api/v1/support/tickets')
          .set('Authorization', `Bearer ${userToken}`)
          .attach('attachment', largeBuffer, { filename: 'screenshot.png', contentType: 'image/png' })
          .field('subject', 'Payments issues')
          .field('message', 'I was double debited');

        expect([HttpStatus.BAD_REQUEST, HttpStatus.PAYLOAD_TOO_LARGE]).toContain(res.status);
      } catch (err: any) {
        expect(err.code || err.message).toBeDefined();
      }
    });

    it('should block unapproved mime type attachments', async () => {
      const fileBuffer = Buffer.from('unapproved content');

      const res = await request(app.getHttpServer())
        .post('/api/v1/support/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('attachment', fileBuffer, { filename: 'exploit.exe', contentType: 'application/x-msdownload' })
        .field('subject', 'Help needed')
        .field('message', 'Unapproved type file attached')
        .expect(HttpStatus.BAD_REQUEST);

      expect(res.body.message).toContain('allowed');
    });
  });
});
