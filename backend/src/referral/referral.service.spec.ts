import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReferralService } from './referral.service';
import { Referral, ReferralStatus } from './entities/referral.entity';
import { User, UserLevel } from '../users/entities/user.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { DataSource } from 'typeorm';

describe('ReferralService', () => {
  let service: ReferralService;

  const mockReferralRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockUserRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockQueryBuilder = {
    setLock: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      createQueryBuilder: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => mockQueryRunner),
  };

  const now = new Date('2026-06-28T12:00:00Z');

  const mockUser: User = {
    id: 'user-1',
    phoneNumber: '+1234567890',
    deviceId: 'device-1',
    referralCode: 'CODE1234',
    referredBy: null,
    pointsBalance: 100,
    lifetimePoints: 500,
    currentTier: UserLevel.BRONZE,
    walletBalanceInr: 0,
    isActive: true,
    createdAt: now,
  } as unknown as User;

  const mockReferrerUser: User = {
    id: 'referrer-1',
    phoneNumber: '+9876543210',
    deviceId: 'device-2',
    referralCode: 'REFCODE1',
    referredBy: null,
    pointsBalance: 500,
    lifetimePoints: 1000,
    currentTier: UserLevel.SILVER,
    walletBalanceInr: 0,
    isActive: true,
    createdAt: now,
  } as unknown as User;

  function resetMocks(): void {
    mockReferralRepo.findOne.mockReset();
    mockReferralRepo.find.mockReset();
    mockReferralRepo.create.mockReset();
    mockReferralRepo.save.mockReset();
    mockUserRepo.findOne.mockReset();
    mockUserRepo.save.mockReset();
    mockQueryBuilder.setLock.mockClear();
    mockQueryBuilder.where.mockClear();
    mockQueryBuilder.getOne.mockReset();
    mockQueryRunner.connect.mockClear();
    mockQueryRunner.startTransaction.mockClear();
    mockQueryRunner.commitTransaction.mockClear();
    mockQueryRunner.rollbackTransaction.mockClear();
    mockQueryRunner.release.mockClear();
    mockQueryRunner.manager.createQueryBuilder.mockReset();
    mockQueryRunner.manager.save.mockReset();
    mockQueryRunner.manager.create.mockReset();
    mockDataSource.createQueryRunner.mockClear();
  }

  function setupTransactionMocks(): void {
    mockQueryRunner.manager.createQueryBuilder.mockReturnValue(
      mockQueryBuilder,
    );
  }

  beforeEach(async () => {
    resetMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralService,
        { provide: getRepositoryToken(Referral), useValue: mockReferralRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<ReferralService>(ReferralService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateReferralCode', () => {
    it('should return an 8-character uppercase hex string', () => {
      const code = service.generateReferralCode();
      expect(code).toMatch(/^[0-9A-F]{8}$/);
    });
  });

  describe('ensureReferralCode', () => {
    it('should return existing code if user has one', async () => {
      const user = { ...mockUser, referralCode: 'EXISTING' };

      const result = await service.ensureReferralCode(user);

      expect(result).toBe('EXISTING');
      expect(mockUserRepo.findOne).not.toHaveBeenCalled();
      expect(mockUserRepo.save).not.toHaveBeenCalled();
    });

    it('should generate and save a new code if user does not have one', async () => {
      const user = { ...mockUser, referralCode: null as any };
      mockUserRepo.findOne.mockResolvedValue(null);
      mockUserRepo.save.mockResolvedValue(user);

      const result = await service.ensureReferralCode(user);

      expect(result).toMatch(/^[0-9A-F]{8}$/);
      expect(user.referralCode).toBe(result);
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { referralCode: result },
      });
      expect(mockUserRepo.save).toHaveBeenCalledWith(user);
    });
  });

  describe('applyReferral', () => {
    it('should throw NotFoundException for invalid referral code', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.applyReferral(mockUser, 'INVALID')).rejects.toThrow(
        NotFoundException,
      );

      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { referralCode: 'INVALID' },
      });
      expect(mockDataSource.createQueryRunner).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for self-referral', async () => {
      const selfUser = { ...mockUser, referralCode: 'SELFCODE' };
      mockUserRepo.findOne.mockResolvedValue(selfUser);

      await expect(service.applyReferral(selfUser, 'SELFCODE')).rejects.toThrow(
        BadRequestException,
      );

      expect(mockDataSource.createQueryRunner).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if referee already used a referral code', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockReferrerUser);
      mockReferralRepo.findOne.mockResolvedValue({ id: 'existing-ref' });

      await expect(service.applyReferral(mockUser, 'REFCODE1')).rejects.toThrow(
        BadRequestException,
      );

      expect(mockReferralRepo.findOne).toHaveBeenCalledWith({
        where: { refereeId: mockUser.id },
      });
      expect(mockDataSource.createQueryRunner).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if same referral pair already exists', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockReferrerUser);
      mockReferralRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'existing-pair' });

      await expect(service.applyReferral(mockUser, 'REFCODE1')).rejects.toThrow(
        BadRequestException,
      );

      expect(mockReferralRepo.findOne).toHaveBeenNthCalledWith(2, {
        where: {
          referrerId: mockReferrerUser.id,
          refereeId: mockUser.id,
        },
      });
      expect(mockDataSource.createQueryRunner).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for same device referral', async () => {
      const sameDeviceReferrer = {
        ...mockReferrerUser,
        deviceId: 'device-1',
      };
      mockUserRepo.findOne.mockResolvedValue(sameDeviceReferrer);
      mockReferralRepo.findOne.mockResolvedValue(null);

      await expect(service.applyReferral(mockUser, 'REFCODE1')).rejects.toThrow(
        BadRequestException,
      );

      expect(mockDataSource.createQueryRunner).not.toHaveBeenCalled();
    });

    it('should award +30 points and create referral record on success', async () => {
      const currentUser = { ...mockUser };
      const referrerLock = {
        ...mockReferrerUser,
        pointsBalance: 500,
        lifetimePoints: 1000,
        currentTier: UserLevel.SILVER,
      };
      const createdReferral = {
        referrerId: 'referrer-1',
        refereeId: 'user-1',
        signupReward: 30,
        status: ReferralStatus.PENDING,
      };
      const createdTransaction = { id: 'txn-1' };

      mockUserRepo.findOne.mockResolvedValue(mockReferrerUser);
      mockReferralRepo.findOne.mockResolvedValue(null);
      setupTransactionMocks();
      mockQueryBuilder.getOne
        .mockResolvedValueOnce(referrerLock)
        .mockResolvedValueOnce(currentUser);
      mockQueryRunner.manager.create.mockReturnValue(createdTransaction);
      mockQueryRunner.manager.save.mockResolvedValue({});

      const result = await service.applyReferral(currentUser, 'REFCODE1');

      expect(result).toEqual({
        success: true,
        message: 'Referral applied successfully',
        pointsAwarded: 30,
      });

      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { referralCode: 'REFCODE1' },
      });
      expect(mockReferralRepo.findOne).toHaveBeenNthCalledWith(1, {
        where: { refereeId: currentUser.id },
      });
      expect(mockReferralRepo.findOne).toHaveBeenNthCalledWith(2, {
        where: {
          referrerId: mockReferrerUser.id,
          refereeId: currentUser.id,
        },
      });

      expect(mockDataSource.createQueryRunner).toHaveBeenCalled();
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.manager.createQueryBuilder).toHaveBeenCalledWith(
        User,
        'u',
      );
      expect(mockQueryBuilder.setLock).toHaveBeenCalledWith(
        'pessimistic_write',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('u.id = :id', {
        id: mockReferrerUser.id,
      });
      expect(mockQueryBuilder.getOne).toHaveBeenCalledTimes(2);

      expect(referrerLock.pointsBalance).toBe(530);
      expect(referrerLock.lifetimePoints).toBe(1030);

      expect(mockQueryRunner.manager.create).toHaveBeenCalledWith(Referral, {
        referrerId: mockReferrerUser.id,
        refereeId: currentUser.id,
        signupReward: 30,
        status: ReferralStatus.PENDING,
      });

      expect(mockQueryRunner.manager.create).toHaveBeenCalledWith(
        Transaction,
        expect.objectContaining({
          userId: mockReferrerUser.id,
          type: 'referral',
          cashAmount: 0,
          pointsAmount: 30,
          pointsBalanceBefore: 500,
          pointsBalanceAfter: 530,
          description: 'Referral reward for inviting a friend',
          referenceType: 'referral',
          status: 'completed',
        }),
      );

      expect(mockQueryRunner.manager.save).toHaveBeenCalledTimes(4);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should upgrade tier from BRONZE to SILVER when lifetimePoints cross 1000', async () => {
      const currentUser = { ...mockUser };
      const bronzeReferrer = {
        ...mockReferrerUser,
        pointsBalance: 50,
        lifetimePoints: 999,
        currentTier: UserLevel.BRONZE,
      };
      const referrerLock = { ...bronzeReferrer };
      const createdReferral = {
        referrerId: 'referrer-1',
        refereeId: 'user-1',
        signupReward: 30,
        status: ReferralStatus.PENDING,
      };
      const createdTransaction = { id: 'txn-2' };

      mockUserRepo.findOne.mockResolvedValue(bronzeReferrer);
      mockReferralRepo.findOne.mockResolvedValue(null);
      mockReferralRepo.create.mockReturnValue(createdReferral);
      setupTransactionMocks();
      mockQueryBuilder.getOne.mockResolvedValue(referrerLock);
      mockQueryRunner.manager.create.mockReturnValue(createdTransaction);
      mockQueryRunner.manager.save.mockResolvedValue({});

      await service.applyReferral(currentUser, 'REFCODE1');

      expect(referrerLock.pointsBalance).toBe(80);
      expect(referrerLock.lifetimePoints).toBe(1029);
      expect(referrerLock.currentTier).toBe(UserLevel.SILVER);
    });

    it('should rollback transaction on error and rethrow', async () => {
      const currentUser = { ...mockUser };

      mockUserRepo.findOne.mockResolvedValue(mockReferrerUser);
      mockReferralRepo.findOne.mockResolvedValue(null);
      setupTransactionMocks();
      mockQueryBuilder.getOne.mockResolvedValue(mockReferrerUser);
      mockQueryRunner.manager.save.mockRejectedValue(new Error('DB error'));
      mockQueryRunner.manager.create.mockReturnValue({});

      await expect(
        service.applyReferral(currentUser, 'REFCODE1'),
      ).rejects.toThrow('DB error');

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('getReferralStats', () => {
    it('should return stats for a user with no referrals', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockReferralRepo.find.mockResolvedValue([]);

      const stats = await service.getReferralStats('user-1');

      expect(stats).toEqual({
        referralCode: 'CODE1234',
        totalReferred: 0,
        totalRewardsEarned: 0,
        totalKycCompleted: 0,
      });

      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(mockReferralRepo.find).toHaveBeenCalledWith({
        where: { referrerId: 'user-1' },
      });
    });

    it('should return correct stats with referrals data', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockReferralRepo.find.mockResolvedValue([
        {
          signupReward: 30,
          kycReward: 50,
          status: ReferralStatus.SETTLED,
        },
        {
          signupReward: 30,
          kycReward: 0,
          status: ReferralStatus.PENDING,
        },
      ]);

      const stats = await service.getReferralStats('user-1');

      expect(stats.totalReferred).toBe(2);
      expect(stats.totalRewardsEarned).toBe(110);
      expect(stats.totalKycCompleted).toBe(1);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.getReferralStats('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getReferralHistory', () => {
    it('should return empty array for user with no referrals', async () => {
      mockReferralRepo.find.mockResolvedValue([]);

      const history = await service.getReferralHistory('user-1');

      expect(history).toEqual([]);
      expect(mockReferralRepo.find).toHaveBeenCalledWith({
        where: { referrerId: 'user-1' },
        relations: { referee: true },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return enriched history with referee names', async () => {
      const mockReferrals = [
        {
          referee: {
            fullName: 'John Doe',
            avatarUrl: 'https://example.com/john.jpg',
          },
          status: ReferralStatus.PENDING,
          signupReward: 30,
          kycReward: 0,
          createdAt: now,
          settledAt: null,
        },
        {
          referee: {
            fullName: 'Jane Smith',
            avatarUrl: null,
          },
          status: ReferralStatus.SETTLED,
          signupReward: 30,
          kycReward: 50,
          createdAt: now,
          settledAt: now,
        },
        {
          referee: null,
          status: ReferralStatus.PENDING,
          signupReward: 30,
          kycReward: 0,
          createdAt: now,
          settledAt: null,
        },
      ];

      mockReferralRepo.find.mockResolvedValue(mockReferrals as any);

      const history = await service.getReferralHistory('user-1');

      expect(history).toHaveLength(3);
      expect(history[0]).toEqual({
        refereeName: 'John Doe',
        refereeAvatarUrl: 'https://example.com/john.jpg',
        status: ReferralStatus.PENDING,
        signupReward: 30,
        kycReward: 0,
        createdAt: now,
        settledAt: null,
      });

      expect(history[1].refereeName).toBe('Jane Smith');
      expect(history[1].refereeAvatarUrl).toBeNull();
      expect(history[1].kycReward).toBe(50);
      expect(history[1].status).toBe(ReferralStatus.SETTLED);

      expect(history[2].refereeName).toBeNull();
      expect(history[2].refereeAvatarUrl).toBeNull();
    });
  });

  describe('processKycReferral', () => {
    it('should do nothing if no pending referral exists', async () => {
      mockReferralRepo.findOne.mockResolvedValue(null);

      await service.processKycReferral('user-1');

      expect(mockReferralRepo.findOne).toHaveBeenCalledWith({
        where: { refereeId: 'user-1', status: ReferralStatus.PENDING },
        relations: { referrer: true },
      });
      expect(mockDataSource.createQueryRunner).not.toHaveBeenCalled();
    });

    it('should award +50 points and mark referral as settled', async () => {
      const referral = {
        id: 'referral-1',
        referrerId: 'referrer-1',
        refereeId: 'user-1',
        status: ReferralStatus.PENDING,
        signupReward: 30,
        kycReward: 0,
        settledAt: null,
        referrer: { ...mockReferrerUser },
      };

      const referrerLock = {
        ...mockReferrerUser,
        pointsBalance: 500,
        lifetimePoints: 1000,
        currentTier: UserLevel.SILVER,
      };

      const createdTransaction = { id: 'txn-kyc-1' };

      mockReferralRepo.findOne.mockResolvedValue(referral);
      setupTransactionMocks();
      mockQueryBuilder.getOne.mockResolvedValue(referrerLock);
      mockQueryRunner.manager.create.mockReturnValue(createdTransaction);
      mockQueryRunner.manager.save.mockResolvedValue({});

      await service.processKycReferral('user-1');

      expect(mockDataSource.createQueryRunner).toHaveBeenCalled();
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.manager.createQueryBuilder).toHaveBeenCalledWith(
        User,
        'u',
      );
      expect(mockQueryBuilder.setLock).toHaveBeenCalledWith(
        'pessimistic_write',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('u.id = :id', {
        id: 'referrer-1',
      });
      expect(mockQueryBuilder.getOne).toHaveBeenCalled();

      expect(referrerLock.pointsBalance).toBe(550);
      expect(referrerLock.lifetimePoints).toBe(1050);

      expect(referral.kycReward).toBe(50);
      expect(referral.status).toBe(ReferralStatus.SETTLED);
      expect(referral.settledAt).toBeInstanceOf(Date);

      expect(mockQueryRunner.manager.create).toHaveBeenCalledWith(
        Transaction,
        expect.objectContaining({
          userId: 'referrer-1',
          type: 'referral',
          cashAmount: 0,
          pointsAmount: 50,
          pointsBalanceBefore: 500,
          pointsBalanceAfter: 550,
          description: 'KYC bonus from referred friend',
          referenceType: 'referral',
          status: 'completed',
        }),
      );

      expect(mockQueryRunner.manager.save).toHaveBeenCalledTimes(3);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should rollback and return if referrer not found during lock', async () => {
      const referral = {
        id: 'referral-1',
        referrerId: 'referrer-1',
        refereeId: 'user-1',
        status: ReferralStatus.PENDING,
        signupReward: 30,
        kycReward: 0,
        settledAt: null,
        referrer: { ...mockReferrerUser },
      };

      mockReferralRepo.findOne.mockResolvedValue(referral);
      setupTransactionMocks();
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await service.processKycReferral('user-1');

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
    });
  });
});
