import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GamificationService } from './gamification.service';
import { User, UserLevel } from '../users/entities/user.entity';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { UsersService } from '../users/users.service';
import { PointsEngineService } from '../points/points-engine.service';
import { TransactionsService } from '../transactions/transactions.service';

describe('GamificationService', () => {
  let service: GamificationService;

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn().mockResolvedValue('OK'),
  };

  const mockUserRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockUsersService = {
    findById: jest.fn(),
  };

  const mockPointsEngineService = {
    logPointAction: jest.fn(),
  };

  const mockTransactionsService = {
    logTransaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamificationService,
        { provide: REDIS_CLIENT, useValue: mockRedis },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: UsersService, useValue: mockUsersService },
        { provide: PointsEngineService, useValue: mockPointsEngineService },
        { provide: TransactionsService, useValue: mockTransactionsService },
      ],
    }).compile();

    service = module.get<GamificationService>(GamificationService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('spin', () => {
    it('should return successful spin result with valid segment index and prize points', async () => {
      const userId = 'user-1';
      const mockUser = {
        id: userId,
        lifetimePoints: 500,
        pointsBalance: 200,
        currentTier: UserLevel.BRONZE,
        isActive: true,
      };

      mockRedis.get.mockResolvedValue(null);
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockUserRepo.save.mockResolvedValue({ ...mockUser });

      const result = await service.spin(userId);

      expect(result.success).toBe(true);
      expect(result.segmentIndex).toBeGreaterThanOrEqual(0);
      expect(result.segmentIndex).toBeLessThanOrEqual(6);
      expect(result.prizePoints).toBeGreaterThanOrEqual(10);
      expect(result.prizePoints).toBeLessThanOrEqual(20);
      expect(result.tier).toBe('bronze');
      expect(result.canSpinAgain).toBe(false);
      expect(result.nextAvailableSpin).toBeTruthy();
      expect(result.message).toContain('Congratulations');
    });

    it('should save updated user points and call downstream services', async () => {
      const userId = 'user-1';
      const prevLifetime = 500;
      const prevPoints = 200;
      const mockUser = {
        id: userId,
        lifetimePoints: prevLifetime,
        pointsBalance: prevPoints,
        currentTier: UserLevel.BRONZE,
        isActive: true,
      };

      jest.spyOn(Math, 'random').mockReturnValue(0);

      mockRedis.get.mockResolvedValue(null);
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockUserRepo.save.mockResolvedValue({ ...mockUser });

      const result = await service.spin(userId);

      expect(result.segmentIndex).toBe(0);
      expect(result.prizePoints).toBe(10);

      expect(mockUserRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          lifetimePoints: 510,
          pointsBalance: 210,
        }),
      );

      expect(mockPointsEngineService.logPointAction).toHaveBeenCalledWith(
        userId,
        'spin_wheel',
        10,
        1.0,
        10,
      );

      expect(mockTransactionsService.logTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          type: 'points_earned',
          pointsAmount: 10,
          pointsBalanceBefore: 200,
          pointsBalanceAfter: 210,
          referenceType: 'spin_wheel',
        }),
      );
    });

    it('should set Redis key after successful spin', async () => {
      const userId = 'user-1';
      const mockUser = {
        id: userId,
        lifetimePoints: 500,
        pointsBalance: 200,
        currentTier: UserLevel.BRONZE,
        isActive: true,
      };

      mockRedis.get.mockResolvedValue(null);
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockUserRepo.save.mockResolvedValue({ ...mockUser });
      mockRedis.set.mockResolvedValue('OK');

      await service.spin(userId);

      expect(mockRedis.set).toHaveBeenCalledWith(
        `spin:daily:${userId}`,
        '1',
        'EX',
        expect.any(Number),
        'NX',
      );
    });

    it('should enforce daily spin limit and return failure', async () => {
      const userId = 'user-1';

      mockRedis.set.mockResolvedValue(null);

      const result = await service.spin(userId);

      expect(result.success).toBe(false);
      expect(result.segmentIndex).toBe(-1);
      expect(result.prizePoints).toBe(0);
      expect(result.tier).toBe('');
      expect(result.canSpinAgain).toBe(false);
      expect(result.message).toBe(
        'Daily spin limit reached. Come back tomorrow!',
      );
      expect(result.nextAvailableSpin).toBeTruthy();

      expect(mockUsersService.findById).not.toHaveBeenCalled();
      expect(mockUserRepo.save).not.toHaveBeenCalled();
      expect(mockPointsEngineService.logPointAction).not.toHaveBeenCalled();
      expect(mockTransactionsService.logTransaction).not.toHaveBeenCalled();
    });

    it('should gracefully degrade when Redis throws', async () => {
      const userId = 'user-1';
      const mockUser = {
        id: userId,
        lifetimePoints: 500,
        pointsBalance: 200,
        currentTier: UserLevel.BRONZE,
        isActive: true,
      };

      mockRedis.set.mockRejectedValue(new Error('Redis connection failed'));
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockUserRepo.save.mockResolvedValue({ ...mockUser });

      const result = await service.spin(userId);

      expect(result.success).toBe(true);
      expect(result.prizePoints).toBeGreaterThanOrEqual(10);
      expect(result.prizePoints).toBeLessThanOrEqual(20);

      expect(mockRedis.set).toHaveBeenCalled();
      expect(mockUserRepo.save).toHaveBeenCalled();
    });

    it('should award bronze-tier prize points for bronze user', async () => {
      const userId = 'user-1';
      const mockUser = {
        id: userId,
        lifetimePoints: 500,
        pointsBalance: 200,
        currentTier: UserLevel.BRONZE,
        isActive: true,
      };

      mockRedis.set.mockResolvedValue('OK');
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockUserRepo.save.mockResolvedValue({ ...mockUser });

      const result = await service.spin(userId);

      expect(result.tier).toBe('bronze');
      expect([10, 12, 14, 15, 16, 18, 20]).toContain(result.prizePoints);
    });

    it('should award platinum-tier prize points for platinum user', async () => {
      const userId = 'user-1';
      const mockUser = {
        id: userId,
        lifetimePoints: 5000,
        pointsBalance: 1000,
        currentTier: UserLevel.PLATINUM,
        isActive: true,
      };

      mockRedis.set.mockResolvedValue('OK');
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockUserRepo.save.mockResolvedValue({ ...mockUser });

      const result = await service.spin(userId);

      expect(result.tier).toBe('platinum');
      expect([30, 35, 38, 40, 42, 45, 50]).toContain(result.prizePoints);
    });
  });

  describe('getSpinStatus', () => {
    it('should return canSpin=true when no Redis key exists', async () => {
      const userId = 'user-1';

      mockRedis.get.mockResolvedValue(null);

      const result = await service.getSpinStatus(userId);

      expect(result.canSpin).toBe(true);
      expect(result.nextAvailableSpin).toBeNull();
    });

    it('should return canSpin=false when Redis key exists', async () => {
      const userId = 'user-1';

      mockRedis.get.mockResolvedValue('1');

      const result = await service.getSpinStatus(userId);

      expect(result.canSpin).toBe(false);
      expect(result.nextAvailableSpin).toBeTruthy();
    });
  });
});
