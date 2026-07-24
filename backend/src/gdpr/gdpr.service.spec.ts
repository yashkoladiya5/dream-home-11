import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { GdprService } from './gdpr.service';
import { User } from '../users/entities/user.entity';
import { Kyc } from '../kyc/entities/kyc.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { ContestMember } from '../contests/entities/contest-member.entity';
import { PointLog } from '../points/entities/point-log.entity';
import { Withdrawal } from '../withdrawals/entities/withdrawal.entity';
import { Referral } from '../referral/entities/referral.entity';
import { CompensationLog } from '../compensation/entities/compensation.entity';
import {
  createMockRepository,
  MockRepository,
} from '../test/mock-repository.factory';
import { createMockDataSource } from '../test/mock-services.factory';

describe('GdprService', () => {
  let service: GdprService;
  let userRepo: MockRepository<User>;
  let kycRepo: MockRepository<Kyc>;
  let walletRepo: MockRepository<Wallet>;
  let transactionRepo: MockRepository<Transaction>;
  let contestMemberRepo: MockRepository<ContestMember>;
  let pointLogRepo: MockRepository<PointLog>;
  let withdrawalRepo: MockRepository<Withdrawal>;
  let referralRepo: MockRepository<Referral>;
  let compensationLogRepo: MockRepository<CompensationLog>;
  let mockDataSource: ReturnType<typeof createMockDataSource>;

  const mockUser: User = {
    id: 'user-1',
    phoneNumber: '+911234567890',
    email: 'test@example.com',
    fullName: 'Test User',
    avatarUrl: 'https://example.com/avatar.jpg',
    createdAt: new Date(),
    currentTier: 'bronze' as any,
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
    bankAccountNumber: 'encrypted-data',
    bankIfsc: 'BANK001',
    bankName: 'Test Bank',
    upiId: 'encrypted-upi',
    role: 'user' as any,
    kyc: null,
    wallet: null,
  };

  beforeEach(async () => {
    userRepo = createMockRepository<User>();
    kycRepo = createMockRepository<Kyc>();
    walletRepo = createMockRepository<Wallet>();
    transactionRepo = createMockRepository<Transaction>();
    contestMemberRepo = createMockRepository<ContestMember>();
    pointLogRepo = createMockRepository<PointLog>();
    withdrawalRepo = createMockRepository<Withdrawal>();
    referralRepo = createMockRepository<Referral>();
    compensationLogRepo = createMockRepository<CompensationLog>();
    mockDataSource = createMockDataSource();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GdprService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Kyc), useValue: kycRepo },
        { provide: getRepositoryToken(Wallet), useValue: walletRepo },
        { provide: getRepositoryToken(Transaction), useValue: transactionRepo },
        {
          provide: getRepositoryToken(ContestMember),
          useValue: contestMemberRepo,
        },
        { provide: getRepositoryToken(PointLog), useValue: pointLogRepo },
        { provide: getRepositoryToken(Withdrawal), useValue: withdrawalRepo },
        { provide: getRepositoryToken(Referral), useValue: referralRepo },
        {
          provide: getRepositoryToken(CompensationLog),
          useValue: compensationLogRepo,
        },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<GdprService>(GdprService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('exportUserData', () => {
    it('should export all user data', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
      (kycRepo.findOne as jest.Mock).mockResolvedValue({
        id: 'kyc-1',
        userId: 'user-1',
      });
      (walletRepo.findOne as jest.Mock).mockResolvedValue({
        id: 'wallet-1',
        userId: 'user-1',
      });
      (transactionRepo.find as jest.Mock).mockResolvedValue([
        { id: 'tx-1', userId: 'user-1' },
      ]);
      (contestMemberRepo.find as jest.Mock).mockResolvedValue([
        { id: 'cm-1', userId: 'user-1' },
      ]);
      (pointLogRepo.find as jest.Mock).mockResolvedValue([
        { id: 'pl-1', userId: 'user-1' },
      ]);
      (withdrawalRepo.find as jest.Mock).mockResolvedValue([
        { id: 'wd-1', userId: 'user-1' },
      ]);
      (referralRepo.find as jest.Mock).mockResolvedValue([]);
      (compensationLogRepo.find as jest.Mock).mockResolvedValue([]);

      const result = await service.exportUserData('user-1');
      expect(result.user).toEqual(mockUser);
      expect(result.kyc).toBeDefined();
      expect(result.wallet).toBeDefined();
      expect(result.transactions).toHaveLength(1);
      expect(result.contestMemberships).toHaveLength(1);
      expect(result.pointLogs).toHaveLength(1);
      expect(result.withdrawals).toHaveLength(1);
      expect(result.exportedAt).toBeDefined();
    });

    it('should handle empty data gracefully', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(null);
      (kycRepo.findOne as jest.Mock).mockResolvedValue(null);
      (walletRepo.findOne as jest.Mock).mockResolvedValue(null);
      (transactionRepo.find as jest.Mock).mockResolvedValue([]);
      (contestMemberRepo.find as jest.Mock).mockResolvedValue([]);
      (pointLogRepo.find as jest.Mock).mockResolvedValue([]);
      (withdrawalRepo.find as jest.Mock).mockResolvedValue([]);
      (referralRepo.find as jest.Mock).mockResolvedValue([]);
      (compensationLogRepo.find as jest.Mock).mockResolvedValue([]);

      const result = await service.exportUserData('user-1');
      expect(result.user).toBeNull();
      expect(result.transactions).toEqual([]);
    });
  });

  describe('requestAccountDeletion', () => {
    it('should soft-delete user account', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
      (userRepo.save as jest.Mock).mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await service.requestAccountDeletion('user-1');
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: false,
          fullName: '[deleted]',
          phoneNumber: expect.stringContaining('deleted_'),
        }),
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(
        service.requestAccountDeletion('invalid-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('permanentDeleteAccount', () => {
    it('should permanently delete all user data in transaction', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
      const manager = {
        delete: jest.fn().mockResolvedValue({}),
      };
      mockDataSource.transaction.mockImplementation(async (cb: any) =>
        cb(manager),
      );

      await service.permanentDeleteAccount('user-1');
      expect(manager.delete).toHaveBeenCalledTimes(10);
      expect(manager.delete).toHaveBeenCalledWith(
        expect.any(Function),
        'user-1',
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(
        service.permanentDeleteAccount('invalid-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
