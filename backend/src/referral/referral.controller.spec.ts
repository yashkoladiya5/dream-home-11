import { Test, TestingModule } from '@nestjs/testing';
import { ReferralController } from './referral.controller';
import { ReferralService } from './referral.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';

describe('ReferralController', () => {
  let controller: ReferralController;
  let referralService: ReferralService;

  const mockReferralService = {
    applyReferral: jest.fn(),
    getReferralStats: jest.fn(),
    getReferralHistory: jest.fn(),
  };

  const mockJwtAuthGuard = { canActivate: jest.fn(() => true) };

  const mockUser = { id: 'user-uuid-12345' } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReferralController],
      providers: [
        {
          provide: ReferralService,
          useValue: mockReferralService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<ReferralController>(ReferralController);
    referralService = module.get<ReferralService>(ReferralService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have JwtAuthGuard applied at controller level', () => {
    const guards = Reflect.getMetadata('__guards__', ReferralController);
    expect(guards).toBeDefined();
    expect(guards).toHaveLength(1);
    expect(guards[0]).toBe(JwtAuthGuard);
  });

  describe('POST /api/v1/referral/apply', () => {
    it('should call referralService.applyReferral with user and dto.code', async () => {
      const dto = { code: 'ABC12345' };
      const expectedResult = {
        success: true,
        message: 'Referral applied successfully',
        pointsAwarded: 30,
      };

      mockReferralService.applyReferral.mockResolvedValue(expectedResult);

      const result = await controller.applyReferral(mockUser, dto);

      expect(result).toEqual(expectedResult);
      expect(referralService.applyReferral).toHaveBeenCalledWith(
        mockUser,
        'ABC12345',
      );
    });
  });

  describe('GET /api/v1/referral/stats', () => {
    it('should call referralService.getReferralStats with user.id', async () => {
      const expectedStats = {
        referralCode: 'CODE1234',
        totalReferred: 5,
        totalRewardsEarned: 200,
        totalKycCompleted: 2,
      };

      mockReferralService.getReferralStats.mockResolvedValue(expectedStats);

      const result = await controller.getReferralStats(mockUser);

      expect(result).toEqual(expectedStats);
      expect(referralService.getReferralStats).toHaveBeenCalledWith(
        'user-uuid-12345',
      );
    });
  });

  describe('GET /api/v1/referral/history', () => {
    it('should call referralService.getReferralHistory with user.id', async () => {
      const expectedHistory = [
        {
          refereeName: 'John Doe',
          refereeAvatarUrl: null,
          status: 'settled',
          signupReward: 30,
          kycReward: 50,
          createdAt: new Date(),
          settledAt: new Date(),
        },
      ];

      mockReferralService.getReferralHistory.mockResolvedValue(expectedHistory);

      const result = await controller.getReferralHistory(mockUser);

      expect(result).toEqual(expectedHistory);
      expect(referralService.getReferralHistory).toHaveBeenCalledWith(
        'user-uuid-12345',
      );
    });
  });
});
