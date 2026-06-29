/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-assignment */
jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn(),
  cert: jest.fn(),
}));
jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(),
}));
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { User, UserLevel } from '../users/entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockUser: User = {
    id: 'user-uuid-12345',
    phoneNumber: '+919999999999',
    email: null,
    fullName: null,
    avatarUrl: null,
    createdAt: new Date(),
    currentTier: UserLevel.BRONZE,
    lifetimePoints: 0,
    weeklyPoints: 0,
    monthlyPoints: 0,
    walletBalanceInr: 0,
    pointsBalance: 0,
    isActive: true,
    deviceId: 'device-id-12345',
    referralCode: null,
    referredBy: null,
    currentStreak: 0,
    longestStreak: 0,
    lastStreakDate: null,
    state: null,
    bankAccountNumber: null,
    bankIfsc: null,
    bankName: null,
    upiId: null,
    kyc: null as any,
  };

  const mockAuthService = {
    requestOtp: jest.fn().mockReturnValue({
      success: true,
      message: 'OTP requested successfully',
    }),
    verifyOtp: jest.fn().mockImplementation((idToken: string, _deviceId?: string, _otpCode?: string, _referralCode?: string) => {
      if (idToken.startsWith('mock-token-')) {
        return Promise.resolve({
          token: 'mock-jwt-token-xyz',
          user: mockUser,
        });
      }
      return Promise.reject(new Error('Firebase token verification failed'));
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('requestOtp', () => {
    it('should request OTP and return success response', () => {
      const dto: RequestOtpDto = {
        phoneNumber: '+919999999999',
      };

      const result = controller.requestOtp(dto);

      expect(result).toEqual({
        success: true,
        message: 'OTP requested successfully',
      });
      expect(authService.requestOtp).toHaveBeenCalledWith(dto.phoneNumber);
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP and return a JWT and user object', async () => {
      const dto: VerifyOtpDto = {
        idToken: 'mock-token-+919999999999',
        deviceId: 'device-id-12345',
        otpCode: '123456',
      };

      const result = await controller.verifyOtp(dto);

      expect(result).toBeDefined();
      expect(result.token).toBe('mock-jwt-token-xyz');
      expect(result.user).toEqual(mockUser);
      expect(authService.verifyOtp).toHaveBeenCalledWith(
        dto.idToken,
        dto.deviceId,
        dto.otpCode,
        undefined,
      );
    });
  });
});
