import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { REDIS_CLIENT } from '../../src/redis/redis.constants';
import {
  User,
  UserRole,
  UserLevel,
} from '../../src/users/entities/user.entity';
import { Kyc } from '../../src/kyc/entities/kyc.entity';
import { Contest } from '../../src/contests/entities/contest.entity';
import { ContestMember } from '../../src/contests/entities/contest-member.entity';
import { Post as FeedPost } from '../../src/feed/entities/post.entity';
import { Like as FeedLike } from '../../src/feed/entities/like.entity';
import { Comment as FeedComment } from '../../src/feed/entities/comment.entity';
import { Achievement } from '../../src/achievements/entities/achievement.entity';
import { UserAchievement } from '../../src/achievements/entities/user-achievement.entity';
import { Chat } from '../../src/chat/entities/chat.entity';
import { ChatMessage } from '../../src/chat/entities/chat-message.entity';
import { Share } from '../../src/share-tracker/entities/share.entity';
import { RewardRedemption } from '../../src/rewards/entities/reward-redemption.entity';
import { JwtService } from '@nestjs/jwt';

const USER_ID = '00000000-0000-0000-0000-000000000001';
const USER_PHONE = '+911234567890';
const POST_ID = '00000000-0000-0000-0000-000000000002';
const CHAT_ID = '00000000-0000-0000-0000-000000000003';

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

describe('Social & Gamification (Feed, Chat, Achievements, Share Tracker) Flow E2E', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let jwtService: JwtService;
  let userToken: string;

  let mockUserRepo: ReturnType<typeof createMockRepo>;
  let mockPostRepo: ReturnType<typeof createMockRepo>;
  let mockLikeRepo: ReturnType<typeof createMockRepo>;
  let mockCommentRepo: ReturnType<typeof createMockRepo>;
  let mockAchievementRepo: ReturnType<typeof createMockRepo>;
  let mockUserAchievementRepo: ReturnType<typeof createMockRepo>;
  let mockChatRepo: ReturnType<typeof createMockRepo>;
  let mockChatMessageRepo: ReturnType<typeof createMockRepo>;
  let mockShareRepo: ReturnType<typeof createMockRepo>;
  let mockRedemptionRepo: ReturnType<typeof createMockRepo>;
  let mockContestMemberRepo: ReturnType<typeof createMockRepo>;

  const mockUser = {
    id: USER_ID,
    phoneNumber: USER_PHONE,
    role: UserRole.USER,
    isActive: true,
    walletBalanceInr: 500,
    pointsBalance: 300,
    lifetimePoints: 1200,
    currentTier: UserLevel.SILVER,
    currentStreak: 5,
  };

  const mockPost = {
    id: POST_ID,
    userId: USER_ID,
    content: 'Check out my new team!',
    imageUrl: null,
    createdAt: new Date(),
    likesCount: 0,
    commentsCount: 0,
    user: mockUser,
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
      incr: jest.fn().mockResolvedValue(1),
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
      FeedPost,
      FeedLike,
      FeedComment,
      Achievement,
      UserAchievement,
      Chat,
      ChatMessage,
      Share,
      RewardRedemption,
    ];

    let builder = Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DataSource)
      .useValue(mockDataSource as any)
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
    mockPostRepo = repoMocks['Post'];
    mockLikeRepo = repoMocks['Like'];
    mockCommentRepo = repoMocks['Comment'];
    mockAchievementRepo = repoMocks['Achievement'];
    mockUserAchievementRepo = repoMocks['UserAchievement'];
    mockChatRepo = repoMocks['Chat'];
    mockChatMessageRepo = repoMocks['ChatMessage'];
    mockShareRepo = repoMocks['Share'];
    mockRedemptionRepo = repoMocks['RewardRedemption'];
    mockContestMemberRepo = repoMocks['ContestMember'];

    moduleFixture = await builder.compile();
    app = moduleFixture.createNestApplication();
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
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

    mockPostRepo.find.mockResolvedValue([mockPost]);
    mockPostRepo.findAndCount.mockResolvedValue([[mockPost], 1]);
    mockPostRepo.findOne.mockImplementation(async (opts: any) => {
      const id = opts?.where?.id;
      if (id === POST_ID) return { ...mockPost };
      return null;
    });
    mockPostRepo.save.mockImplementation(async (p: any) =>
      Promise.resolve({ id: POST_ID, ...p }),
    );

    mockLikeRepo.findOne.mockResolvedValue(null);
    mockLikeRepo.save.mockImplementation(async (l: any) => Promise.resolve(l));

    mockCommentRepo.save.mockImplementation(async (c: any) =>
      Promise.resolve({ id: 'comment-1', ...c }),
    );
    mockCommentRepo.find.mockResolvedValue([
      {
        id: 'comment-1',
        postId: POST_ID,
        userId: USER_ID,
        content: 'Nice!',
        user: mockUser,
      },
    ]);

    mockAchievementRepo.find.mockResolvedValue([
      {
        id: 'ach-1',
        key: 'first_contest',
        title: 'First Contest',
        description: 'Join one contest',
        bonusPoints: 50,
        sortOrder: 1,
      },
    ]);
    mockAchievementRepo.findOne.mockImplementation(async (opts: any) => {
      const key = opts?.where?.key || 'first_contest';
      return { id: 'ach-1', key, title: 'Achievement', bonusPoints: 50 };
    });

    const activeUserAchievements: any[] = [];
    mockUserAchievementRepo.find.mockImplementation(async (opts: any) => {
      return activeUserAchievements;
    });
    mockUserAchievementRepo.save.mockImplementation(async (ua: any) => {
      const saved = { id: 'ua-1', earnedAt: new Date(), ...ua };
      activeUserAchievements.push(saved);
      return saved;
    });

    mockChatRepo.find.mockResolvedValue([]);
    mockChatMessageRepo.find.mockResolvedValue([]);

    mockShareRepo.save.mockImplementation(async (s: any) =>
      Promise.resolve({ id: 'share-1', ...s }),
    );
    mockShareRepo.count.mockResolvedValue(2);
  });

  describe('Social Feed (Sprint 9)', () => {
    it('should retrieve post feed lists', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/feed')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(res.body.posts).toBeInstanceOf(Array);
      expect(res.body.posts[0].content).toBe('Check out my new team!');
    });

    it('should successfully post feed update', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/feed')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'Look at my mega entry!' })
        .expect(HttpStatus.CREATED);

      expect(res.body.message).toContain('created');
      expect(res.body.post.content).toBe('Look at my mega entry!');
    });

    it('should successfully toggle feed post like', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/feed/${POST_ID}/like`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(res.body.liked).toBe(true);
    });

    it('should successfully add comment to post', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/feed/${POST_ID}/comment`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'Amazing!' })
        .expect(HttpStatus.CREATED);

      expect(res.body.comment.content).toBe('Amazing!');
    });
  });

  describe('WebSocket Chat History (Sprint 9)', () => {
    it('should fetch user rooms list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/chats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(res.body).toBeInstanceOf(Array);
    });
  });

  describe('Share Tracker (Sprint 9)', () => {
    it('should track shared events and save channel source', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/shares')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ contestId: 'c-101', shareChannel: 'whatsapp' })
        .expect(HttpStatus.CREATED);

      expect(res.body.success).toBe(true);
      expect(res.body.share.shareChannel).toBe('whatsapp');
    });

    it('should fetch user share stats', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/shares/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(res.body).toHaveProperty('totalShares');
    });
  });

  describe('Achievements Tracking & Badges (Sprint 10)', () => {
    it('should fetch achievements details with user progress status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/achievements')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(res.body).toBeInstanceOf(Array);
      expect(res.body[0].key).toBe('first_contest');
      expect(res.body[0].earned).toBe(false);
    });

    it('should check and award achievements if requirements are satisfied', async () => {
      mockContestMemberRepo.count.mockResolvedValue(1); // satisfies 'first_contest'

      const res = await request(app.getHttpServer())
        .post('/api/v1/achievements/check')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.CREATED);

      expect(res.body).toBeInstanceOf(Array);
      // 'first_contest' key is mapped to index 0, should become earned: true
      expect(res.body[0].earned).toBe(true);
    });
  });
});
