import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { ContestsService } from './contests.service';
import { Contest, ContestStatus, ContestType } from './entities/contest.entity';
import { ContestMember } from './entities/contest-member.entity';
import { User, UserLevel } from '../users/entities/user.entity';
import { PointsEngineService } from '../points/points-engine.service';

describe('ContestsService', () => {
  let service: ContestsService;
  let contestRepo: Partial<Record<keyof Repository<Contest>, jest.Mock>>;
  let contestMemberRepo: Partial<Record<keyof Repository<ContestMember>, jest.Mock>>;
  let dataSource: Partial<Record<keyof DataSource, jest.Mock>>;
  let mockEntityManager: Partial<Record<keyof EntityManager, jest.Mock>>;

  const mockUser: User = {
    id: 'user-1',
    phoneNumber: '+919999999999',
    email: null,
    fullName: 'Test User',
    avatarUrl: null,
    createdAt: new Date(),
    currentTier: UserLevel.BRONZE,
    lifetimePoints: 0,
    walletBalanceInr: 1000,
    pointsBalance: 0,
    isActive: true,
    deviceId: 'device-1',
    kyc: null,
  };

  const mockContest: Contest = {
    id: 'contest-1',
    title: 'Test Contest',
    type: ContestType.NORMAL,
    entryFeeInr: 100,
    pointsToJoin: 50,
    maxSlots: 100,
    filledSlots: 50,
    prize: 'Test Prize',
    badgeText: 'TEST',
    badgeColor: '#D22C2C',
    startTime: new Date(Date.now() - 86400000),
    endTime: new Date(Date.now() + 86400000 * 30),
    status: ContestStatus.RUNNING,
    createdAt: new Date(),
    members: [],
  };

  beforeEach(async () => {
    mockEntityManager = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    dataSource = {
      transaction: jest.fn().mockImplementation(async (cb: (em: EntityManager) => Promise<any>) => {
        return cb(mockEntityManager as unknown as EntityManager);
      }),
    };

    contestRepo = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
    };

    contestMemberRepo = {};

    const mockPointsEngineService = {
      getMultiplier: jest.fn().mockReturnValue(1.0),
      calculatePoints: jest.fn().mockImplementation((basePoints: number) => basePoints),
      logPointAction: jest.fn().mockResolvedValue({}),
      logPointActionWithEntityManager: jest.fn().mockResolvedValue({}),
      getTierInfo: jest.fn(),
      getNextTierInfo: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContestsService,
        { provide: getRepositoryToken(Contest), useValue: contestRepo },
        { provide: getRepositoryToken(ContestMember), useValue: contestMemberRepo },
        { provide: DataSource, useValue: dataSource },
        { provide: PointsEngineService, useValue: mockPointsEngineService },
      ],
    }).compile();

    service = module.get<ContestsService>(ContestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('joinContest', () => {
    it('should join contest successfully', async () => {
      const contest = { ...mockContest };
      const user = { ...mockUser };

      (mockEntityManager.findOne as jest.Mock)
        .mockResolvedValueOnce(contest)
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(null);

      (mockEntityManager.create as jest.Mock).mockReturnValue({ contestId: 'contest-1', userId: 'user-1' });
      (mockEntityManager.save as jest.Mock).mockResolvedValue({});

      const result = await service.joinContest('user-1', 'contest-1');

      expect(result).toBeDefined();
      expect(result.user.pointsBalance).toBe(50);
      expect(result.user.lifetimePoints).toBe(50);
      expect(result.user.walletBalanceInr).toBe(900);
      expect(result.contest.filledSlots).toBe(51);
    });

    it('should throw NotFoundException when contest does not exist', async () => {
      (mockEntityManager.findOne as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.joinContest('user-1', 'contest-1'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when contest is not running', async () => {
      const contest = { ...mockContest, status: ContestStatus.UPCOMING };
      (mockEntityManager.findOne as jest.Mock).mockResolvedValueOnce(contest);

      await expect(service.joinContest('user-1', 'contest-1'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when contest is full', async () => {
      const contest = { ...mockContest, filledSlots: 100, maxSlots: 100 };
      (mockEntityManager.findOne as jest.Mock).mockResolvedValueOnce(contest);

      await expect(service.joinContest('user-1', 'contest-1'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      (mockEntityManager.findOne as jest.Mock)
        .mockResolvedValueOnce(mockContest)
        .mockResolvedValueOnce(null);

      await expect(service.joinContest('user-1', 'contest-1'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when user account is suspended', async () => {
      const user = { ...mockUser, isActive: false };
      (mockEntityManager.findOne as jest.Mock)
        .mockResolvedValueOnce(mockContest)
        .mockResolvedValueOnce(user);

      await expect(service.joinContest('user-1', 'contest-1'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when user has insufficient balance', async () => {
      const user = { ...mockUser, walletBalanceInr: 50 };
      (mockEntityManager.findOne as jest.Mock)
        .mockResolvedValueOnce(mockContest)
        .mockResolvedValueOnce(user);

      await expect(service.joinContest('user-1', 'contest-1'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when user already joined', async () => {
      (mockEntityManager.findOne as jest.Mock)
        .mockResolvedValueOnce(mockContest)
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ id: 'member-1' });

      await expect(service.joinContest('user-1', 'contest-1'))
        .rejects.toThrow(BadRequestException);
    });

    it('should upgrade tier to SILVER at 1000 lifetime points', async () => {
      const user = { ...mockUser, lifetimePoints: 950, pointsBalance: 950 };
      const contest = { ...mockContest, pointsToJoin: 100 };

      (mockEntityManager.findOne as jest.Mock)
        .mockResolvedValueOnce(contest)
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(null);

      (mockEntityManager.create as jest.Mock).mockReturnValue({});
      (mockEntityManager.save as jest.Mock).mockResolvedValue({});

      const result = await service.joinContest('user-1', 'contest-1');
      expect(result.user.currentTier).toBe(UserLevel.SILVER);
    });

    it('should upgrade tier to GOLD at 2000 lifetime points', async () => {
      const user = { ...mockUser, lifetimePoints: 1900, pointsBalance: 1900 };
      const contest = { ...mockContest, pointsToJoin: 200 };

      (mockEntityManager.findOne as jest.Mock)
        .mockResolvedValueOnce(contest)
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(null);

      (mockEntityManager.create as jest.Mock).mockReturnValue({});
      (mockEntityManager.save as jest.Mock).mockResolvedValue({});

      const result = await service.joinContest('user-1', 'contest-1');
      expect(result.user.currentTier).toBe(UserLevel.GOLD);
    });

    it('should upgrade tier to PLATINUM at 5000 lifetime points', async () => {
      const user = { ...mockUser, lifetimePoints: 4800, pointsBalance: 4800 };
      const contest = { ...mockContest, pointsToJoin: 500 };

      (mockEntityManager.findOne as jest.Mock)
        .mockResolvedValueOnce(contest)
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(null);

      (mockEntityManager.create as jest.Mock).mockReturnValue({});
      (mockEntityManager.save as jest.Mock).mockResolvedValue({});

      const result = await service.joinContest('user-1', 'contest-1');
      expect(result.user.currentTier).toBe(UserLevel.PLATINUM);
    });

    it('should remain BRONZE when lifetime points stay below 1000', async () => {
      const user = { ...mockUser, lifetimePoints: 100, pointsBalance: 100 };
      const contest = { ...mockContest, pointsToJoin: 50 };

      (mockEntityManager.findOne as jest.Mock)
        .mockResolvedValueOnce(contest)
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(null);

      (mockEntityManager.create as jest.Mock).mockReturnValue({});
      (mockEntityManager.save as jest.Mock).mockResolvedValue({});

      const result = await service.joinContest('user-1', 'contest-1');
      expect(result.user.currentTier).toBe(UserLevel.BRONZE);
    });
  });
});
