import { Test, TestingModule } from '@nestjs/testing';
import { GamificationController } from './gamification.controller';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('GamificationController', () => {
  let controller: GamificationController;
  let gamificationService: GamificationService;

  const mockGamificationService = {
    spin: jest.fn(),
    getSpinStatus: jest.fn(),
  };

  const mockSpinResult = {
    success: true,
    segmentIndex: 3,
    prizePoints: 25,
    tier: 'silver',
    message: 'Congratulations! You won 25 points!',
    canSpinAgain: false,
    nextAvailableSpin: '2026-06-28T00:00:00.000Z',
  };

  const mockSpinStatusResult = {
    canSpin: true,
    nextAvailableSpin: null,
  };

  const mockRequest = {
    user: { id: 'user-uuid-12345' },
  };

  const mockJwtAuthGuard = { canActivate: jest.fn(() => true) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GamificationController],
      providers: [
        {
          provide: GamificationService,
          useValue: mockGamificationService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<GamificationController>(GamificationController);
    gamificationService = module.get<GamificationService>(GamificationService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have JwtAuthGuard applied at controller level', () => {
    const guards = Reflect.getMetadata('__guards__', GamificationController);
    expect(guards).toBeDefined();
    expect(guards).toHaveLength(1);
    expect(guards[0]).toBe(JwtAuthGuard);
  });

  describe('POST /api/v1/gamification/spin', () => {
    it('should call gamificationService.spin with req.user.id', async () => {
      mockGamificationService.spin.mockResolvedValue(mockSpinResult);

      await controller.spin(mockRequest);

      expect(gamificationService.spin).toHaveBeenCalledTimes(1);
      expect(gamificationService.spin).toHaveBeenCalledWith('user-uuid-12345');
    });

    it('should return the full SpinResult response structure', async () => {
      mockGamificationService.spin.mockResolvedValue(mockSpinResult);

      const result = await controller.spin(mockRequest);

      expect(result).toEqual({
        success: expect.any(Boolean),
        segmentIndex: expect.any(Number),
        prizePoints: expect.any(Number),
        tier: expect.any(String),
        message: expect.any(String),
        canSpinAgain: expect.any(Boolean),
        nextAvailableSpin: expect.any(String),
      });

      expect(result.success).toBe(true);
      expect(result.segmentIndex).toBe(3);
      expect(result.prizePoints).toBe(25);
      expect(result.tier).toBe('silver');
      expect(result.message).toBe('Congratulations! You won 25 points!');
      expect(result.canSpinAgain).toBe(false);
      expect(result.nextAvailableSpin).toBe('2026-06-28T00:00:00.000Z');
    });
  });

  describe('GET /api/v1/gamification/spin/status', () => {
    it('should call gamificationService.getSpinStatus with req.user.id', async () => {
      mockGamificationService.getSpinStatus.mockResolvedValue(
        mockSpinStatusResult,
      );

      await controller.spinStatus(mockRequest);

      expect(gamificationService.getSpinStatus).toHaveBeenCalledTimes(1);
      expect(gamificationService.getSpinStatus).toHaveBeenCalledWith(
        'user-uuid-12345',
      );
    });

    it('should return the spin status response', async () => {
      mockGamificationService.getSpinStatus.mockResolvedValue(
        mockSpinStatusResult,
      );

      const result = await controller.spinStatus(mockRequest);

      expect(result).toEqual({
        canSpin: true,
        nextAvailableSpin: null,
      });
    });
  });
});
