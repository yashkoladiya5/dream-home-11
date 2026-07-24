/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-assignment */
jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn(),
  cert: jest.fn(),
}));
jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(),
}));
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { FirebaseService } from './firebase.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User, UserLevel, UserRole } from '../users/entities/user.entity';
import { ReferralService } from '../referral/referral.service';
import { RedisOtpService } from './redis-otp.service';
import { RefreshTokenService } from './refresh-token.service';
import { QueueService } from '../queue/queue.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let firebaseService: FirebaseService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUser: User = {
    id: 'user-uuid-12345',
    phoneNumber: '+919999999999',
    email: null as any,
    fullName: null as any,
    avatarUrl: null as any,
    createdAt: new Date(),
    currentTier: UserLevel.BRONZE,
    lifetimePoints: 0,
    weeklyPoints: 0,
    monthlyPoints: 0,
    walletBalanceInr: 0,
    pointsBalance: 0,
    isActive: true,
    deviceId: 'device-id-12345',
    referralCode: 'TESTCODE',
    referredBy: null as any,
    currentStreak: 0,
    longestStreak: 0,
    lastStreakDate: null,
    state: null as any,
    bankAccountNumber: null as any,
    bankIfsc: null as any,
    bankName: null as any,
    upiId: null as any,
    role: UserRole.USER,
    kyc: null as any,
    wallet: null as any,
  };

  const mockFirebaseService = {
    verifyIdToken: jest.fn().mockResolvedValue({
      phoneNumber: '+919999999999',
      uid: 'firebase-uid-12345',
    }),
  };

  const mockUsersService = {
    upsertUser: jest.fn().mockResolvedValue(mockUser),
    findByPhoneNumber: jest.fn().mockResolvedValue(null),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token-xyz'),
  };

  const mockReferralService = {
    applyReferral: jest.fn().mockResolvedValue({
      success: true,
      message: 'Referral applied',
      pointsAwarded: 30,
    }),
    getReferralStats: jest.fn().mockResolvedValue({
      referralCode: 'TESTCODE',
      totalReferred: 0,
      totalRewardsEarned: 0,
      totalKycCompleted: 0,
    }),
    getReferralHistory: jest.fn().mockResolvedValue([]),
    processKycReferral: jest.fn().mockResolvedValue(undefined),
    ensureReferralCode: jest.fn().mockResolvedValue('TESTCODE'),
    generateReferralCode: jest.fn().mockReturnValue('TESTCODE'),
  };

  const otpStore = new Map<
    string,
    { code: string; expiresAt: Date; attempts: number }
  >();
  const mockRedisOtpService = {
    storeOtp: jest.fn().mockImplementation((phone: string, code: string) => {
      otpStore.set(phone, {
        code,
        expiresAt: new Date(Date.now() + 300000),
        attempts: 0,
      });
    }),
    verifyOtp: jest.fn().mockImplementation((phone: string, code: string) => {
      const entry = otpStore.get(phone);
      if (!entry) throw new UnauthorizedException('OTP not found or expired');
      if (entry.expiresAt < new Date()) {
        otpStore.delete(phone);
        throw new UnauthorizedException('OTP has expired');
      }
      if (entry.code !== code) {
        entry.attempts++;
        if (entry.attempts >= 3) {
          otpStore.delete(phone);
          throw new UnauthorizedException(
            'Too many failed attempts. Please request a new OTP.',
          );
        }
        throw new UnauthorizedException('Invalid OTP verification code');
      }
      otpStore.delete(phone);
      return Promise.resolve();
    }),
  };

  const mockRefreshTokenService = {
    generateTokens: jest.fn().mockResolvedValue({
      accessToken: 'mock-jwt-token-xyz',
      refreshToken: 'mock-refresh-token',
    }),
    refreshAccessToken: jest.fn(),
  };

  const mockQueueService = {
    add: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: FirebaseService, useValue: mockFirebaseService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ReferralService, useValue: mockReferralService },
        { provide: RedisOtpService, useValue: mockRedisOtpService },
        { provide: RefreshTokenService, useValue: mockRefreshTokenService },
        { provide: QueueService, useValue: mockQueueService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    (service as any).otpStore = otpStore;
    firebaseService = module.get<FirebaseService>(FirebaseService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('requestOtp', () => {
    it('should generate, cache, and log an OTP code', () => {
      const phoneNumber = '+919999999999';
      const result = service.requestOtp(phoneNumber);

      expect(result).toEqual({
        success: true,
        message: 'OTP requested successfully',
      });

      const cached = service['otpStore'].get(phoneNumber);
      expect(cached).toBeDefined();
      expect(cached?.code).toHaveLength(6);
      expect(Number(cached?.code)).toBeGreaterThanOrEqual(100000);
      expect(Number(cached?.code)).toBeLessThanOrEqual(999999);
      expect(cached?.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('verifyOtp', () => {
    it('should verify token, upsert user, and sign a JWT when correct OTP is provided', async () => {
      const idToken = 'mock-token-+919999999999';
      const deviceId = 'device-id-12345';
      const phoneNumber = '+919999999999';

      service.requestOtp(phoneNumber);
      const otpCode = service['otpStore'].get(phoneNumber)?.code;

      const result = await service.verifyOtp(idToken, deviceId, otpCode);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mock-jwt-token-xyz');
      expect(result.user).toEqual(mockUser);

      expect(firebaseService.verifyIdToken).toHaveBeenCalledWith(idToken);
      expect(usersService.upsertUser).toHaveBeenCalledWith(
        phoneNumber,
        deviceId,
      );

      // Verification code should be cleared
      expect(service['otpStore'].get(phoneNumber)).toBeUndefined();
    });

    it('should increment attempt counter on incorrect OTP code', async () => {
      const idToken = 'mock-token-+919999999999';
      const deviceId = 'device-id-12345';
      const phoneNumber = '+919999999999';

      service.requestOtp(phoneNumber);

      await expect(
        service.verifyOtp(idToken, deviceId, '000000'),
      ).rejects.toThrow(UnauthorizedException);

      const cached = service['otpStore'].get(phoneNumber);
      expect(cached).toBeDefined();
      expect(cached?.attempts).toBe(1);
    });

    it('should delete OTP and throw too many attempts error on the 3rd failed attempt', async () => {
      const idToken = 'mock-token-+919999999999';
      const deviceId = 'device-id-12345';
      const phoneNumber = '+919999999999';

      service.requestOtp(phoneNumber);

      // Attempt 1
      await expect(
        service.verifyOtp(idToken, deviceId, '000001'),
      ).rejects.toThrow(
        new UnauthorizedException('Invalid OTP verification code'),
      );

      // Attempt 2
      await expect(
        service.verifyOtp(idToken, deviceId, '000002'),
      ).rejects.toThrow(
        new UnauthorizedException('Invalid OTP verification code'),
      );

      // Attempt 3 - Should throw too many attempts exception and delete cache
      await expect(
        service.verifyOtp(idToken, deviceId, '000003'),
      ).rejects.toThrow(
        new UnauthorizedException(
          'Too many failed attempts. Please request a new OTP.',
        ),
      );

      expect(service['otpStore'].get(phoneNumber)).toBeUndefined();
    });

    it('should throw UnauthorizedException if OTP code is expired', async () => {
      const idToken = 'mock-token-+919999999999';
      const deviceId = 'device-id-12345';
      const phoneNumber = '+919999999999';

      service.requestOtp(phoneNumber);
      const cached = service['otpStore'].get(phoneNumber);
      if (cached) {
        cached.expiresAt = new Date(Date.now() - 1000); // Expired
      }

      await expect(
        service.verifyOtp(idToken, deviceId, cached?.code),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
