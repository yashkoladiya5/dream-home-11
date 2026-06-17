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
import { User, UserLevel } from '../users/entities/user.entity';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let firebaseService: FirebaseService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUser: User = {
    id: 'user-uuid-12345',
    phoneNumber: '+919999999999',
    email: null,
    fullName: null,
    avatarUrl: null,
    createdAt: new Date(),
    currentTier: UserLevel.BRONZE,
    lifetimePoints: 0,
    walletBalanceInr: 0,
    pointsBalance: 0,
    isActive: true,
    deviceId: 'device-id-12345',
    kyc: null as any,
  };

  const mockFirebaseService = {
    verifyIdToken: jest.fn().mockResolvedValue({
      phoneNumber: '+919999999999',
      uid: 'firebase-uid-12345',
    }),
  };

  const mockUsersService = {
    upsertUser: jest.fn().mockResolvedValue(mockUser),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token-xyz'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: FirebaseService, useValue: mockFirebaseService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
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
      expect(result.token).toBe('mock-jwt-token-xyz');
      expect(result.user).toEqual(mockUser);

      expect(firebaseService.verifyIdToken).toHaveBeenCalledWith(idToken);
      expect(usersService.upsertUser).toHaveBeenCalledWith(
        phoneNumber,
        deviceId,
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        phoneNumber: mockUser.phoneNumber,
      });

      // Verification code should be cleared
      expect(service['otpStore'].get(phoneNumber)).toBeUndefined();
    });

    it('should throw UnauthorizedException if OTP code is incorrect', async () => {
      const idToken = 'mock-token-+919999999999';
      const deviceId = 'device-id-12345';
      const phoneNumber = '+919999999999';

      service.requestOtp(phoneNumber);

      await expect(
        service.verifyOtp(idToken, deviceId, '000000'),
      ).rejects.toThrow(UnauthorizedException);
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
