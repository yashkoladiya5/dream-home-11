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

  describe('verifyOtp', () => {
    it('should verify token, upsert user, and sign a JWT', async () => {
      const idToken = 'mock-token-+919999999999';
      const deviceId = 'device-id-12345';

      const result = await service.verifyOtp(idToken, deviceId);

      expect(result).toBeDefined();
      expect(result.token).toBe('mock-jwt-token-xyz');
      expect(result.user).toEqual(mockUser);

      expect(firebaseService.verifyIdToken).toHaveBeenCalledWith(idToken);
      expect(usersService.upsertUser).toHaveBeenCalledWith(
        '+919999999999',
        deviceId,
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        phoneNumber: mockUser.phoneNumber,
      });
    });
  });
});
