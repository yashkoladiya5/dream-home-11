import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AchievementsService } from './achievements.service';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';
import { ContestMember } from '../contests/entities/contest-member.entity';
import { Share } from '../share-tracker/entities/share.entity';
import { RewardRedemption } from '../rewards/entities/reward-redemption.entity';
import { User } from '../users/entities/user.entity';
import { PointsEngineService } from '../points/points-engine.service';
import { createMockRepository, MockRepository } from '../test/mock-repository.factory';
import { createMockPointsEngineService } from '../test/mock-services.factory';

describe('AchievementsService', () => {
  let service: AchievementsService;
  let achievementRepo: MockRepository<Achievement>;
  let userAchievementRepo: MockRepository<UserAchievement>;
  let userRepo: MockRepository<User>;
  let contestMemberRepo: MockRepository<ContestMember>;
  let shareRepo: MockRepository<Share>;
  let redemptionRepo: MockRepository<RewardRedemption>;
  let mockPointsEngineService: ReturnType<typeof createMockPointsEngineService>;

  const mockAchievements: Achievement[] = [
    { id: 'ach-1', key: 'first_contest', title: 'First Contest', description: 'Join your first contest', icon: 'trophy', bonusPoints: 50, sortOrder: 1, createdAt: new Date() },
    { id: 'ach-2', key: 'ten_contests', title: '10 Contests', description: 'Join 10 contests', icon: 'star', bonusPoints: 100, sortOrder: 2, createdAt: new Date() },
    { id: 'ach-3', key: 'points_5000', title: '5K Points', description: 'Earn 5000 lifetime points', icon: 'fire', bonusPoints: 200, sortOrder: 3, createdAt: new Date() },
  ];

  const mockUser: User = {
    id: 'user-1',
    phoneNumber: '+911234567890',
    email: null,
    fullName: 'Test User',
    avatarUrl: null,
    createdAt: new Date(),
    currentTier: 'bronze' as any,
    lifetimePoints: 5000,
    weeklyPoints: 0,
    monthlyPoints: 0,
    walletBalanceInr: 1000,
    pointsBalance: 500,
    isActive: true,
    deviceId: 'device-1',
    referralCode: 'REF123',
    referredBy: null,
    currentStreak: 0,
    longestStreak: 0,
    lastStreakDate: null,
    state: null,
    bankAccountNumber: null,
    bankIfsc: null,
    bankName: null,
    upiId: null,
    role: 'user' as any,
    kyc: null,
    wallet: null,
  };

  beforeEach(async () => {
    achievementRepo = createMockRepository<Achievement>();
    userAchievementRepo = createMockRepository<UserAchievement>();
    userRepo = createMockRepository<User>();
    contestMemberRepo = createMockRepository<ContestMember>();
    shareRepo = createMockRepository<Share>();
    redemptionRepo = createMockRepository<RewardRedemption>();
    mockPointsEngineService = createMockPointsEngineService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AchievementsService,
        { provide: getRepositoryToken(Achievement), useValue: achievementRepo },
        { provide: getRepositoryToken(UserAchievement), useValue: userAchievementRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(ContestMember), useValue: contestMemberRepo },
        { provide: getRepositoryToken(Share), useValue: shareRepo },
        { provide: getRepositoryToken(RewardRedemption), useValue: redemptionRepo },
        { provide: PointsEngineService, useValue: mockPointsEngineService },
      ],
    }).compile();

    service = module.get<AchievementsService>(AchievementsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAchievementsWithProgress', () => {
    it('should return all achievements with earned status', async () => {
      (achievementRepo.find as jest.Mock).mockResolvedValue(mockAchievements);
      (userAchievementRepo.find as jest.Mock).mockResolvedValue([
        { id: 'ua-1', userId: 'user-1', achievementId: 'ach-1', earnedAt: new Date(), achievement: mockAchievements[0] },
      ]);

      const result = await service.getAchievementsWithProgress('user-1');
      expect(result).toHaveLength(3);
      expect(result[0].earned).toBe(true);
      expect(result[1].earned).toBe(false);
      expect(result[2].earned).toBe(false);
    });

    it('should return all as not earned when none earned', async () => {
      (achievementRepo.find as jest.Mock).mockResolvedValue(mockAchievements);
      (userAchievementRepo.find as jest.Mock).mockResolvedValue([]);

      const result = await service.getAchievementsWithProgress('user-1');
      expect(result.every((a) => !a.earned)).toBe(true);
    });
  });

  describe('checkAndAwardAchievements', () => {
    it('should award first_contest achievement when user has 1 contest', async () => {
      (achievementRepo.find as jest.Mock).mockResolvedValue(mockAchievements);
      (userAchievementRepo.find as jest.Mock).mockResolvedValue([]);
      (contestMemberRepo.count as jest.Mock).mockResolvedValue(1);
      (shareRepo.count as jest.Mock).mockResolvedValue(0);
      (redemptionRepo.count as jest.Mock).mockResolvedValue(0);
      (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
      (achievementRepo.findOne as jest.Mock).mockResolvedValue(mockAchievements[0]);
      (userAchievementRepo.create as jest.Mock).mockReturnValue({});
      (userAchievementRepo.save as jest.Mock).mockResolvedValue({});
      (userRepo.save as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.checkAndAwardAchievements('user-1');
      expect(userAchievementRepo.create).toHaveBeenCalledWith({ userId: 'user-1', achievementId: 'ach-1' });
    });

    it('should award points_5000 achievement and give bonus points', async () => {
      const pointsAchievement = mockAchievements[2];
      (achievementRepo.find as jest.Mock).mockResolvedValue([pointsAchievement]);
      (userAchievementRepo.find as jest.Mock).mockResolvedValue([]);
      (contestMemberRepo.count as jest.Mock).mockResolvedValue(0);
      (shareRepo.count as jest.Mock).mockResolvedValue(0);
      (redemptionRepo.count as jest.Mock).mockResolvedValue(0);
      (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
      (achievementRepo.findOne as jest.Mock).mockResolvedValue(pointsAchievement);
      (userAchievementRepo.create as jest.Mock).mockReturnValue({});
      (userAchievementRepo.save as jest.Mock).mockResolvedValue({});
      (userRepo.save as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.checkAndAwardAchievements('user-1');
      expect(mockPointsEngineService.logPointAction).toHaveBeenCalledWith('user-1', 'achievement_bonus', 200, 1.0, 200);
    });

    it('should skip already earned achievements', async () => {
      (achievementRepo.find as jest.Mock).mockResolvedValue(mockAchievements);
      (userAchievementRepo.find as jest.Mock).mockResolvedValue([
        { id: 'ua-1', userId: 'user-1', achievementId: 'ach-1', earnedAt: new Date(), achievement: mockAchievements[0] },
      ]);

      const result = await service.checkAndAwardAchievements('user-1');
      expect(userAchievementRepo.save).not.toHaveBeenCalled();
    });

    it('should return all achievements when user not found', async () => {
      (achievementRepo.find as jest.Mock).mockResolvedValue(mockAchievements);
      (userAchievementRepo.find as jest.Mock).mockResolvedValue([]);
      (contestMemberRepo.count as jest.Mock).mockResolvedValue(0);
      (shareRepo.count as jest.Mock).mockResolvedValue(0);
      (redemptionRepo.count as jest.Mock).mockResolvedValue(0);
      (userRepo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.checkAndAwardAchievements('user-1');
      expect(result).toHaveLength(3);
    });

    it('should upgrade tier when bonus points push over threshold', async () => {
      const nearGoldUser = { ...mockUser, lifetimePoints: 5000, pointsBalance: 400, currentTier: 'silver' as any };
      (achievementRepo.find as jest.Mock).mockResolvedValue([mockAchievements[2]]);
      (userAchievementRepo.find as jest.Mock).mockResolvedValue([]);
      (contestMemberRepo.count as jest.Mock).mockResolvedValue(0);
      (shareRepo.count as jest.Mock).mockResolvedValue(0);
      (redemptionRepo.count as jest.Mock).mockResolvedValue(0);
      (userRepo.findOne as jest.Mock).mockResolvedValue(nearGoldUser);
      (achievementRepo.findOne as jest.Mock).mockResolvedValue(mockAchievements[2]);
      (userAchievementRepo.create as jest.Mock).mockReturnValue({});
      (userAchievementRepo.save as jest.Mock).mockResolvedValue({});
      (userRepo.save as jest.Mock).mockResolvedValue({ ...nearGoldUser, lifetimePoints: 5200, pointsBalance: 600, currentTier: 'gold' });

      const result = await service.checkAndAwardAchievements('user-1');
      expect(userRepo.save).toHaveBeenCalled();
    });
  });
});
