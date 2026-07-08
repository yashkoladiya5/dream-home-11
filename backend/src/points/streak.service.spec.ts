import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StreakService } from './streak.service';
import { User, UserLevel, UserRole } from '../users/entities/user.entity';

describe('StreakService', () => {
  let service: StreakService;
  let userRepo: Partial<Record<keyof Repository<User>, jest.Mock>>;

  const mockUser: User = {
    id: 'user-1',
    phoneNumber: '+919999999999',
    email: null as any,
    fullName: 'Test User',
    avatarUrl: null as any,
    createdAt: new Date(),
    currentTier: UserLevel.BRONZE,
    lifetimePoints: 500,
    walletBalanceInr: 1000,
    pointsBalance: 500,
    isActive: true,
    deviceId: 'device-1',
    currentStreak: 0,
    longestStreak: 0,
    lastStreakDate: null,
    weeklyPoints: 0,
    monthlyPoints: 0,
    referralCode: null as any,
    referredBy: null as any,
    state: null as any,
    bankAccountNumber: null as any,
    bankIfsc: null as any,
    bankName: null as any,
    upiId: null as any,
    role: UserRole.USER,
    kyc: null as any,
    wallet: null as any,
  };

  beforeEach(async () => {
    userRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StreakService,
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    service = module.get<StreakService>(StreakService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateStreak', () => {
    it('should start streak at 1 for new users', async () => {
      const user = { ...mockUser, currentStreak: 0, lastStreakDate: null };
      (userRepo.findOne as jest.Mock).mockResolvedValue(user);
      (userRepo.save as jest.Mock).mockImplementation((u) =>
        Promise.resolve(u),
      );

      const result = await service.updateStreak('user-1');
      expect(result.currentStreak).toBe(1);
      expect(result.bonusAwarded).toBe(false);
    });

    it('should increment streak for consecutive day', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const user = {
        ...mockUser,
        currentStreak: 3,
        longestStreak: 3,
        lastStreakDate: yesterday,
      };
      (userRepo.findOne as jest.Mock).mockResolvedValue(user);
      (userRepo.save as jest.Mock).mockImplementation((u) =>
        Promise.resolve(u),
      );

      const result = await service.updateStreak('user-1');
      expect(result.currentStreak).toBe(4);
      expect(result.bonusAwarded).toBe(false);
    });

    it('should reset streak to 1 if day was missed', async () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const user = {
        ...mockUser,
        currentStreak: 5,
        longestStreak: 5,
        lastStreakDate: threeDaysAgo,
      };
      (userRepo.findOne as jest.Mock).mockResolvedValue(user);
      (userRepo.save as jest.Mock).mockImplementation((u) =>
        Promise.resolve(u),
      );

      const result = await service.updateStreak('user-1');
      expect(result.currentStreak).toBe(1);
      expect(result.bonusAwarded).toBe(false);
    });

    it('should not increment if already logged in today', async () => {
      const today = new Date();
      const user = {
        ...mockUser,
        currentStreak: 5,
        longestStreak: 5,
        lastStreakDate: today,
      };
      (userRepo.findOne as jest.Mock).mockResolvedValue(user);
      (userRepo.save as jest.Mock).mockImplementation((u) =>
        Promise.resolve(u),
      );

      const result = await service.updateStreak('user-1');
      expect(result.currentStreak).toBe(5);
      expect(result.bonusAwarded).toBe(false);
    });

    it('should award 100 bonus at 7-day streak', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const user = {
        ...mockUser,
        currentStreak: 6,
        longestStreak: 6,
        lastStreakDate: yesterday,
        lifetimePoints: 500,
        pointsBalance: 500,
      };
      (userRepo.findOne as jest.Mock).mockResolvedValue(user);
      (userRepo.save as jest.Mock).mockImplementation((u) =>
        Promise.resolve(u),
      );

      const result = await service.updateStreak('user-1');
      expect(result.currentStreak).toBe(7);
      expect(result.bonusAwarded).toBe(true);
      expect(result.bonusPoints).toBe(100);
    });

    it('should award 600 bonus at 30-day streak', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const user = {
        ...mockUser,
        currentStreak: 29,
        longestStreak: 29,
        lastStreakDate: yesterday,
        lifetimePoints: 2000,
        pointsBalance: 2000,
      };
      (userRepo.findOne as jest.Mock).mockResolvedValue(user);
      (userRepo.save as jest.Mock).mockImplementation((u) =>
        Promise.resolve(u),
      );

      const result = await service.updateStreak('user-1');
      expect(result.currentStreak).toBe(30);
      expect(result.bonusAwarded).toBe(true);
      expect(result.bonusPoints).toBe(600);
    });
  });

  describe('getStreakInfo', () => {
    it('should return streak info with next milestone', async () => {
      const user = { ...mockUser, currentStreak: 3, longestStreak: 5 };
      (userRepo.findOne as jest.Mock).mockResolvedValue(user);

      const result = await service.getStreakInfo('user-1');
      expect(result.currentStreak).toBe(3);
      expect(result.longestStreak).toBe(5);
      expect(result.nextMilestone).toBe(7);
      expect(result.daysToNextMilestone).toBe(4);
      expect(result.nextMilestoneReward).toBe(100);
    });

    it('should return no next milestone if 30+ streak', async () => {
      const user = { ...mockUser, currentStreak: 30, longestStreak: 30 };
      (userRepo.findOne as jest.Mock).mockResolvedValue(user);

      const result = await service.getStreakInfo('user-1');
      expect(result.currentStreak).toBe(30);
      expect(result.nextMilestone).toBeNull();
    });
  });

  describe('applyMissedDayPenalties', () => {
    it('should apply -200 penalty to users who missed yesterday', async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const user = {
        ...mockUser,
        currentStreak: 5,
        lastStreakDate: twoDaysAgo,
        pointsBalance: 500,
      };
      (userRepo.find as jest.Mock).mockResolvedValue([user]);
      (userRepo.save as jest.Mock).mockImplementation((u) =>
        Promise.resolve(u),
      );

      const count = await service.applyMissedDayPenalties();
      expect(count).toBe(1);
      expect(user.pointsBalance).toBe(300);
      expect(user.currentStreak).toBe(0);
    });
  });
});
