import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserLevel } from '../users/entities/user.entity';
import { LeaderboardArchive } from './entities/leaderboard-archive.entity';
import { LeaderboardRedisService } from './leaderboard-redis.service';
import { LeaderboardResetService } from './leaderboard-reset.service';

describe('LeaderboardResetService', () => {
  let service: LeaderboardResetService;
  let userRepo: jest.Mocked<Partial<Repository<User>>>;
  let archiveRepo: jest.Mocked<Partial<Repository<LeaderboardArchive>>>;
  let redisService: jest.Mocked<Partial<LeaderboardRedisService>>;

  const mockUsers: User[] = [
    {
      id: 'user-1', fullName: 'Alice', lifetimePoints: 5000, weeklyPoints: 200, monthlyPoints: 800,
      currentTier: UserLevel.GOLD, isActive: true, phoneNumber: '+911111111111', deviceId: 'd1',
      pointsBalance: 0, walletBalanceInr: 0,
    } as User,
    {
      id: 'user-2', fullName: 'Bob', lifetimePoints: 3000, weeklyPoints: 150, monthlyPoints: 600,
      currentTier: UserLevel.SILVER, isActive: true, phoneNumber: '+912222222222', deviceId: 'd2',
      pointsBalance: 0, walletBalanceInr: 0,
    } as User,
    {
      id: 'user-3', fullName: 'Charlie', lifetimePoints: 1000, weeklyPoints: 50, monthlyPoints: 300,
      currentTier: UserLevel.BRONZE, isActive: true, phoneNumber: '+913333333333', deviceId: 'd3',
      pointsBalance: 0, walletBalanceInr: 0,
    } as User,
  ];

  beforeEach(async () => {
    userRepo = {
      find: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 3 } as any),
    };

    archiveRepo = {
      save: jest.fn().mockResolvedValue([]),
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
    };

    redisService = {
      removeLeaderboard: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaderboardResetService,
        { provide: getRepositoryToken(LeaderboardArchive), useValue: archiveRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: LeaderboardRedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get<LeaderboardResetService>(LeaderboardResetService);
  });

  describe('freezeAndReset', () => {
    it('should archive monthly rankings and reset monthlyPoints to 0', async () => {
      (userRepo.find as jest.Mock).mockResolvedValue(mockUsers);

      const result = await service.freezeAndReset('monthly');

      expect(userRepo.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { monthlyPoints: 'DESC' },
      });

      expect(archiveRepo.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ cycle: 'monthly', userId: 'user-1', points: 800, rank: 1 }),
          expect.objectContaining({ cycle: 'monthly', userId: 'user-2', points: 600, rank: 2 }),
          expect.objectContaining({ cycle: 'monthly', userId: 'user-3', points: 300, rank: 3 }),
        ]),
      );

      expect(userRepo.update).toHaveBeenCalledWith({}, { monthlyPoints: 0 });
      expect(redisService.removeLeaderboard).toHaveBeenCalledWith('leaderboard:global:monthly');
      expect(result).toEqual({ archived: 3, reset: 3 });
    });

    it('should archive weekly rankings and reset weeklyPoints to 0', async () => {
      (userRepo.find as jest.Mock).mockResolvedValue(mockUsers);

      const result = await service.freezeAndReset('weekly');

      expect(archiveRepo.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ cycle: 'weekly', userId: 'user-1', points: 200, rank: 1 }),
          expect.objectContaining({ cycle: 'weekly', userId: 'user-2', points: 150, rank: 2 }),
          expect.objectContaining({ cycle: 'weekly', userId: 'user-3', points: 50, rank: 3 }),
        ]),
      );

      expect(userRepo.update).toHaveBeenCalledWith({}, { weeklyPoints: 0 });
      expect(redisService.removeLeaderboard).toHaveBeenCalledWith('leaderboard:global:weekly');
      expect(result).toEqual({ archived: 3, reset: 3 });
    });

    it('should skip users with zero points in the archive', async () => {
      const zeroPointUsers = [
        { ...mockUsers[0], weeklyPoints: 0, monthlyPoints: 0 },
        { ...mockUsers[1], weeklyPoints: 0, monthlyPoints: 0 },
      ];
      (userRepo.find as jest.Mock).mockResolvedValue(zeroPointUsers);

      const result = await service.freezeAndReset('weekly');

      expect(archiveRepo.save).not.toHaveBeenCalled();
      expect(result).toEqual({ archived: 0, reset: 2 });
    });

    it('should handle no active users gracefully', async () => {
      (userRepo.find as jest.Mock).mockResolvedValue([]);

      const result = await service.freezeAndReset('monthly');

      expect(archiveRepo.save).not.toHaveBeenCalled();
      expect(userRepo.update).not.toHaveBeenCalled();
      expect(redisService.removeLeaderboard).not.toHaveBeenCalled();
      expect(result).toEqual({ archived: 0, reset: 0 });
    });

    it('should capture previous tier in archive', async () => {
      (userRepo.find as jest.Mock).mockResolvedValue([mockUsers[0]]);

      await service.freezeAndReset('monthly');

      expect(archiveRepo.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ previousTier: UserLevel.GOLD }),
        ]),
      );
    });
  });

  describe('getArchives', () => {
    it('should return paginated archives for a cycle', async () => {
      const mockArchives = [
        { id: 'a1', cycle: 'monthly', userId: 'user-1', points: 800, rank: 1, snapshotDate: new Date(), createdAt: new Date() } as LeaderboardArchive,
      ];
      (archiveRepo.findAndCount as jest.Mock).mockResolvedValue([mockArchives, 1]);

      const result = await service.getArchives('monthly', 1, 20);

      expect(archiveRepo.findAndCount).toHaveBeenCalledWith({
        where: { cycle: 'monthly' },
        order: { snapshotDate: 'DESC', rank: 'ASC' },
        skip: 0,
        take: 20,
      });
      expect(result).toEqual({ archives: mockArchives, total: 1 });
    });

    it('should filter by snapshotDate when provided', async () => {
      (archiveRepo.findAndCount as jest.Mock).mockResolvedValue([[], 0]);

      await service.getArchives('weekly', 1, 20, '2026-06-27');

      expect(archiveRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            cycle: 'weekly',
            snapshotDate: expect.any(Object),
          }),
        }),
      );
    });
  });
});
