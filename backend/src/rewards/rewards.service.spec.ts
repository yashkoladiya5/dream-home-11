import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RewardsService } from './rewards.service';
import { Reward } from './entities/reward.entity';
import { RewardRedemption } from './entities/reward-redemption.entity';
import { User } from '../users/entities/user.entity';
import { PointsEngineService } from '../points/points-engine.service';
import {
  createMockRepository,
  MockRepository,
} from '../test/mock-repository.factory';
import { createMockPointsEngineService } from '../test/mock-services.factory';

describe('RewardsService', () => {
  let service: RewardsService;
  let rewardRepo: MockRepository<Reward>;
  let redemptionRepo: MockRepository<RewardRedemption>;
  let userRepo: MockRepository<User>;
  let mockPointsEngineService: ReturnType<typeof createMockPointsEngineService>;

  const mockReward: Reward = {
    id: 'reward-1',
    title: 'Amazon Gift Card',
    description: '₹100 Amazon voucher',
    imageUrl: null,
    pointsRequired: 500,
    stock: 10,
    category: 'gift_card',
    isActive: true,
    sortOrder: 1,
    createdAt: new Date(),
  };

  const mockRedemption: RewardRedemption = {
    id: 'redemption-1',
    userId: 'user-1',
    rewardId: 'reward-1',
    pointsSpent: 500,
    status: 'pending',
    redeemedAt: new Date(),
    fulfilledAt: null,
    notes: null,
    user: null as any,
    reward: mockReward,
  };

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
    pointsBalance: 1000,
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
    rewardRepo = createMockRepository<Reward>();
    redemptionRepo = createMockRepository<RewardRedemption>();
    userRepo = createMockRepository<User>();
    mockPointsEngineService = createMockPointsEngineService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardsService,
        { provide: getRepositoryToken(Reward), useValue: rewardRepo },
        {
          provide: getRepositoryToken(RewardRedemption),
          useValue: redemptionRepo,
        },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: PointsEngineService, useValue: mockPointsEngineService },
      ],
    }).compile();

    service = module.get<RewardsService>(RewardsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCatalog', () => {
    it('should return only active rewards sorted by sortOrder', async () => {
      (rewardRepo.find as jest.Mock).mockResolvedValue([mockReward]);
      const result = await service.getCatalog();
      expect(result).toHaveLength(1);
      expect(rewardRepo.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { sortOrder: 'ASC', createdAt: 'DESC' },
      });
    });

    it('should return empty array when no active rewards', async () => {
      (rewardRepo.find as jest.Mock).mockResolvedValue([]);
      const result = await service.getCatalog();
      expect(result).toEqual([]);
    });
  });

  describe('getRewardById', () => {
    it('should return reward when found', async () => {
      (rewardRepo.findOne as jest.Mock).mockResolvedValue(mockReward);
      const result = await service.getRewardById('reward-1');
      expect(result.id).toBe('reward-1');
    });

    it('should throw NotFoundException when reward not found', async () => {
      (rewardRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.getRewardById('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('redeemReward', () => {
    it('should redeem reward successfully', async () => {
      (rewardRepo.findOne as jest.Mock).mockResolvedValueOnce(mockReward);
      (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
      (userRepo.save as jest.Mock).mockResolvedValue({
        ...mockUser,
        pointsBalance: 500,
      });
      (rewardRepo.save as jest.Mock).mockResolvedValue({
        ...mockReward,
        stock: 9,
      });
      (redemptionRepo.create as jest.Mock).mockReturnValue(mockRedemption);
      (redemptionRepo.save as jest.Mock).mockResolvedValue(mockRedemption);
      (redemptionRepo.findOne as jest.Mock).mockResolvedValue(mockRedemption);

      const result = await service.redeemReward('user-1', 'reward-1');
      expect(result.pointsSpent).toBe(500);
      expect(mockPointsEngineService.logPointAction).toHaveBeenCalledWith(
        'user-1',
        'reward_redeem',
        500,
        1.0,
        -500,
      );
    });

    it('should throw NotFoundException when reward not found', async () => {
      (rewardRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(
        service.redeemReward('user-1', 'invalid-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when reward is inactive', async () => {
      (rewardRepo.findOne as jest.Mock).mockResolvedValue({
        ...mockReward,
        isActive: false,
      });
      await expect(service.redeemReward('user-1', 'reward-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when reward is out of stock', async () => {
      (rewardRepo.findOne as jest.Mock).mockResolvedValue({
        ...mockReward,
        stock: 0,
      });
      await expect(service.redeemReward('user-1', 'reward-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when user has insufficient points', async () => {
      const poorUser = { ...mockUser, pointsBalance: 100 };
      (rewardRepo.findOne as jest.Mock).mockResolvedValue(mockReward);
      (userRepo.findOne as jest.Mock).mockResolvedValue(poorUser);
      await expect(service.redeemReward('user-1', 'reward-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      (rewardRepo.findOne as jest.Mock).mockResolvedValue(mockReward);
      (userRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.redeemReward('user-1', 'reward-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should not decrement stock for unlimited rewards', async () => {
      const unlimitedReward = { ...mockReward, stock: null };
      (rewardRepo.findOne as jest.Mock).mockResolvedValueOnce(unlimitedReward);
      (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
      (userRepo.save as jest.Mock).mockResolvedValue(mockUser);
      (redemptionRepo.create as jest.Mock).mockReturnValue(mockRedemption);
      (redemptionRepo.save as jest.Mock).mockResolvedValue(mockRedemption);
      (redemptionRepo.findOne as jest.Mock).mockResolvedValue(mockRedemption);

      await service.redeemReward('user-1', 'reward-1');
      expect(rewardRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('getRedemptionHistory', () => {
    it('should return redemption history for user', async () => {
      (redemptionRepo.find as jest.Mock).mockResolvedValue([mockRedemption]);
      const result = await service.getRedemptionHistory('user-1');
      expect(result).toHaveLength(1);
      expect(redemptionRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        relations: { reward: true },
        order: { redeemedAt: 'DESC' },
      });
    });

    it('should return empty array for user with no redemptions', async () => {
      (redemptionRepo.find as jest.Mock).mockResolvedValue([]);
      const result = await service.getRedemptionHistory('new-user');
      expect(result).toEqual([]);
    });
  });

  describe('getRedemptionById', () => {
    it('should return redemption when found', async () => {
      (redemptionRepo.findOne as jest.Mock).mockResolvedValue(mockRedemption);
      const result = await service.getRedemptionById('redemption-1');
      expect(result.id).toBe('redemption-1');
    });

    it('should throw NotFoundException when redemption not found', async () => {
      (redemptionRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.getRedemptionById('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
