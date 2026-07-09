import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UsersService } from './users.service';
import { User, UserLevel } from './entities/user.entity';
import { ContestMember } from '../contests/entities/contest-member.entity';
import { Contest } from '../contests/entities/contest.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { CompensationLog } from '../compensation/entities/compensation.entity';
import { createMockRepository, MockRepository } from '../test/mock-repository.factory';
import { createMockDataSource, createMockWalletService, createMockEncryptionService, createMockPointsEngineService } from '../test/mock-services.factory';
import { WalletService } from '../wallet/wallet.service';
import { PointsEngineService } from '../points/points-engine.service';
import { EncryptionService } from '../common/encryption/encryption.service';

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: MockRepository<User>;
  let contestMemberRepo: MockRepository<ContestMember>;
  let contestRepo: MockRepository<Contest>;
  let transactionRepo: MockRepository<Transaction>;
  let compensationLogRepo: MockRepository<CompensationLog>;
  let mockDataSource: ReturnType<typeof createMockDataSource>;
  let mockWalletService: ReturnType<typeof createMockWalletService>;
  let mockEncryptionService: ReturnType<typeof createMockEncryptionService>;
  let mockPointsEngineService: ReturnType<typeof createMockPointsEngineService>;

  const mockUser: User = {
    id: 'user-1',
    phoneNumber: '+911234567890',
    email: 'test@example.com',
    fullName: 'Test User',
    avatarUrl: null,
    createdAt: new Date(),
    currentTier: UserLevel.BRONZE,
    lifetimePoints: 500,
    weeklyPoints: 0,
    monthlyPoints: 0,
    walletBalanceInr: 1000,
    pointsBalance: 200,
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
    userRepo = createMockRepository<User>();
    contestMemberRepo = createMockRepository<ContestMember>();
    contestRepo = createMockRepository<Contest>();
    transactionRepo = createMockRepository<Transaction>();
    compensationLogRepo = createMockRepository<CompensationLog>();
    mockDataSource = createMockDataSource();
    mockWalletService = createMockWalletService();
    mockEncryptionService = createMockEncryptionService();
    mockPointsEngineService = createMockPointsEngineService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(ContestMember), useValue: contestMemberRepo },
        { provide: getRepositoryToken(Contest), useValue: contestRepo },
        { provide: getRepositoryToken(Transaction), useValue: transactionRepo },
        { provide: getRepositoryToken(CompensationLog), useValue: compensationLogRepo },
        { provide: DataSource, useValue: mockDataSource },
        { provide: PointsEngineService, useValue: mockPointsEngineService },
        { provide: EncryptionService, useValue: mockEncryptionService },
        { provide: WalletService, useValue: mockWalletService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByPhoneNumber', () => {
    it('should return user when phone number exists', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
      const result = await service.findByPhoneNumber('+911234567890');
      expect(result).toEqual(mockUser);
      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { phoneNumber: '+911234567890' },
        select: { id: true, phoneNumber: true, fullName: true, isActive: true, referralCode: true },
      });
    });

    it('should return null when phone number does not exist', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(null);
      const result = await service.findByPhoneNumber('+919999999999');
      expect(result).toBeNull();
    });
  });

  describe('upsertUser', () => {
    it('should update device ID for existing user', async () => {
      const existingUser = { ...mockUser, deviceId: 'old-device' };
      (userRepo.findOne as jest.Mock).mockResolvedValue(existingUser);
      (userRepo.save as jest.Mock).mockResolvedValue({ ...existingUser, deviceId: 'new-device' });

      const result = await service.upsertUser('+911234567890', 'new-device');
      expect(result.deviceId).toBe('new-device');
      expect(userRepo.save).toHaveBeenCalledWith(expect.objectContaining({ deviceId: 'new-device' }));
    });

    it('should create new user with referral code and initialize wallet', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValueOnce(null);
      (userRepo.findOne as jest.Mock).mockResolvedValueOnce(null);
      (userRepo.create as jest.Mock).mockReturnValue({ ...mockUser, id: 'new-user' });
      (userRepo.save as jest.Mock).mockResolvedValue({ ...mockUser, id: 'new-user' });

      const result = await service.upsertUser('+919999999999', 'device-2');
      expect(result).toBeDefined();
      expect(userRepo.create).toHaveBeenCalled();
      expect(mockWalletService.initializeWallet).toHaveBeenCalledWith('new-user');
    });

    it('should generate unique referral code for new user', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValueOnce(null);
      (userRepo.findOne as jest.Mock).mockResolvedValueOnce(mockUser);
      (userRepo.findOne as jest.Mock).mockResolvedValueOnce(null);
      (userRepo.create as jest.Mock).mockReturnValue({ ...mockUser, id: 'new-user' });
      (userRepo.save as jest.Mock).mockResolvedValue({ ...mockUser, id: 'new-user' });

      const result = await service.upsertUser('+919999999998', 'device-3');
      expect(result).toBeDefined();
      expect(userRepo.findOne).toHaveBeenCalledTimes(3);
    });
  });

  describe('addCash', () => {
    it('should add cash to user wallet and update balance', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
      (userRepo.save as jest.Mock).mockResolvedValue({ ...mockUser, walletBalanceInr: 1500 });
      mockWalletService.creditBalance.mockResolvedValue({ wallet: { balanceInr: 1500 }, transaction: {} });

      const result = await service.addCash('user-1', 500);
      expect(result.walletBalanceInr).toBe(1500);
      expect(mockWalletService.creditBalance).toHaveBeenCalledWith('user-1', 500, expect.any(Object));
    });

    it('should throw NotFoundException when user not found', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.addCash('invalid-id', 500)).rejects.toThrow(NotFoundException);
    });
  });

  describe('awardPoints', () => {
    it('should award points and update tier when thresholds met', async () => {
      const lowTierUser = { ...mockUser, lifetimePoints: 500, pointsBalance: 200 };
      (userRepo.findOne as jest.Mock).mockResolvedValue(lowTierUser);
      (userRepo.save as jest.Mock).mockResolvedValue({ ...lowTierUser, lifetimePoints: 1500, pointsBalance: 1200, currentTier: UserLevel.SILVER });

      const result = await service.awardPoints('user-1', 1000);
      expect(mockWalletService.creditPoints).toHaveBeenCalledWith('user-1', 1000);
      expect(result.currentTier).toBe(UserLevel.SILVER);
    });

    it('should promote to GOLD at 5000 lifetime points', async () => {
      const goldUser = { ...mockUser, lifetimePoints: 4500, pointsBalance: 200 };
      (userRepo.findOne as jest.Mock).mockResolvedValue(goldUser);
      (userRepo.save as jest.Mock).mockResolvedValue({ ...goldUser, lifetimePoints: 5000, pointsBalance: 700, currentTier: UserLevel.GOLD });

      const result = await service.awardPoints('user-1', 500);
      expect(result.currentTier).toBe(UserLevel.GOLD);
    });

    it('should promote to PLATINUM at 15000 lifetime points', async () => {
      const platUser = { ...mockUser, lifetimePoints: 14000, pointsBalance: 200 };
      (userRepo.findOne as jest.Mock).mockResolvedValue(platUser);
      (userRepo.save as jest.Mock).mockResolvedValue({ ...platUser, lifetimePoints: 15000, pointsBalance: 1200, currentTier: UserLevel.PLATINUM });

      const result = await service.awardPoints('user-1', 1000);
      expect(result.currentTier).toBe(UserLevel.PLATINUM);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.awardPoints('invalid-id', 100)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getProfile', () => {
    it('should return masked profile for user with bank details', async () => {
      const userWithBank = {
        ...mockUser,
        bankAccountNumber: 'encrypted:1234567890',
        bankIfsc: 'BANK001',
        bankName: 'Test Bank',
        upiId: 'encrypted:user@upi',
        kyc: { status: 'approved' },
      };
      (userRepo.findOne as jest.Mock).mockResolvedValue(userWithBank);

      const profile = await service.getProfile('user-1');
      expect(profile.id).toBe('user-1');
      expect(profile.bankAccountNumber).toBeDefined();
      expect(profile.bankIfsc).toBe('BANK001');
      expect(profile.kyc).toBeDefined();
      expect(mockEncryptionService.decrypt).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.getProfile('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('should handle decryption errors gracefully', async () => {
      const userWithBank = { ...mockUser, bankAccountNumber: 'invalid-encrypted', upiId: 'invalid-encrypted' };
      (userRepo.findOne as jest.Mock).mockResolvedValue(userWithBank);
      mockEncryptionService.decrypt.mockImplementation(() => { throw new Error('decrypt error'); });

      const profile = await service.getProfile('user-1');
      expect(profile.bankAccountNumber).toBeNull();
      expect(profile.upiId).toBeNull();
    });
  });
});
