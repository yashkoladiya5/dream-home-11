import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { WithdrawalsService } from './withdrawals.service';
import { Withdrawal } from './entities/withdrawal.entity';
import { User } from '../users/entities/user.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { EncryptionService } from '../common/encryption/encryption.service';
import { ConfigService } from '../config/config.service';
import { WalletService } from '../wallet/wallet.service';

describe('WithdrawalsService', () => {
  let service: WithdrawalsService;
  let mockEntityManager: Partial<Record<keyof EntityManager, jest.Mock>>;
  let dataSource: Partial<Record<keyof DataSource, jest.Mock>>;

  const mockUser = {
    id: 'user-1',
    walletBalanceInr: 5000,
    pointsBalance: 1000,
    isActive: true,
    state: 'Maharashtra',
    bankAccountNumber: 'XXXXXXXXXX1234',
    bankIfsc: 'SBIN0001234',
    bankName: 'State Bank of India',
    kyc: { status: 'approved' },
  };

  const mockWithdrawalRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockUserRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockTransactionRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  const mockEncryptionService = {
    encrypt: jest.fn().mockImplementation((v) => v),
    decrypt: jest.fn().mockImplementation((v) => v),
  };

  const mockConfigService = {
    getConfig: jest.fn().mockResolvedValue({
      minWithdrawalAmount: 100,
      restrictedStates: ['Assam', 'Odisha', 'Telangana'],
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockEntityManager = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    dataSource = {
      transaction: jest
        .fn()
        .mockImplementation((cb: (em: EntityManager) => Promise<any>) =>
          cb(mockEntityManager as unknown as EntityManager),
        ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WithdrawalsService,
        {
          provide: getRepositoryToken(Withdrawal),
          useValue: mockWithdrawalRepo,
        },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionRepo,
        },
        { provide: DataSource, useValue: dataSource },
        { provide: AuditService, useValue: mockAuditService },
        { provide: EncryptionService, useValue: mockEncryptionService },
        { provide: ConfigService, useValue: mockConfigService },
        {
          provide: WalletService,
          useValue: { debitBalance: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<WithdrawalsService>(WithdrawalsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('requestWithdrawal', () => {
    it('should reject zero amount', async () => {
      await expect(service.requestWithdrawal('user-1', 0, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject negative amount', async () => {
      await expect(
        service.requestWithdrawal('user-1', -100, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject amount below minimum', async () => {
      await expect(service.requestWithdrawal('user-1', 50, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject insufficient balance', async () => {
      (mockEntityManager.findOne as jest.Mock)
        .mockResolvedValueOnce({ ...mockUser, walletBalanceInr: 50 })
        .mockResolvedValueOnce({ status: 'approved' });

      await expect(
        service.requestWithdrawal('user-1', 200, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject unverified KYC', async () => {
      (mockEntityManager.findOne as jest.Mock)
        .mockResolvedValueOnce({ ...mockUser })
        .mockResolvedValueOnce({ status: 'pending' });

      await expect(
        service.requestWithdrawal('user-1', 200, {}),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject inactive account', async () => {
      (mockEntityManager.findOne as jest.Mock)
        .mockResolvedValueOnce({ ...mockUser, isActive: false })
        .mockResolvedValueOnce({ status: 'approved' });

      await expect(
        service.requestWithdrawal('user-1', 200, {}),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject restricted states', async () => {
      for (const state of ['Assam', 'Odisha', 'Telangana']) {
        (mockEntityManager.findOne as jest.Mock)
          .mockResolvedValueOnce({ ...mockUser, state })
          .mockResolvedValueOnce({ status: 'approved' });

        await expect(
          service.requestWithdrawal('user-1', 200, {}),
        ).rejects.toThrow(ForbiddenException);
      }
    });

    it('should process valid withdrawal', async () => {
      const savedWithdrawal = {
        id: 'withdraw-1',
        userId: 'user-1',
        amount: 1000,
        status: 'pending',
        bankAccountNumber: mockUser.bankAccountNumber,
        bankIfsc: mockUser.bankIfsc,
        bankName: mockUser.bankName,
        createdAt: new Date(),
      };

      (mockEntityManager.findOne as jest.Mock)
        .mockResolvedValueOnce({ ...mockUser })
        .mockResolvedValueOnce({ status: 'approved' });
      (mockEntityManager.save as jest.Mock).mockImplementation(
        (...args: any[]) => {
          if (args.length === 2) {
            return savedWithdrawal;
          }
          return { ...mockUser, walletBalanceInr: 4000 };
        },
      );
      (mockEntityManager.create as jest.Mock).mockReturnValue({});

      const result = await service.requestWithdrawal('user-1', 1000, {});

      expect(result).toBeDefined();
      expect(result.amount).toBe(1000);
      expect(result.status).toBe('pending');
    });

    it('should update bank details on withdrawal', async () => {
      const savedWithdrawal = {
        id: 'withdraw-2',
        userId: 'user-1',
        amount: 500,
        status: 'pending',
        bankAccountNumber: 'NEW1234567890',
        bankIfsc: 'HDFC0004321',
        bankName: 'HDFC Bank',
        createdAt: new Date(),
      };

      (mockEntityManager.findOne as jest.Mock)
        .mockResolvedValueOnce({ ...mockUser })
        .mockResolvedValueOnce({ status: 'approved' });
      (mockEntityManager.save as jest.Mock).mockImplementation(
        (...args: any[]) => {
          if (args.length === 2) {
            return savedWithdrawal;
          }
          return args[0];
        },
      );
      (mockEntityManager.create as jest.Mock).mockReturnValue({});

      const result = await service.requestWithdrawal('user-1', 500, {
        bankAccountNumber: 'NEW1234567890',
        bankIfsc: 'HDFC0004321',
        bankName: 'HDFC Bank',
      });

      expect(result.bankAccountNumber).toBe('NEW1234567890');
      expect(result.bankName).toBe('HDFC Bank');
    });

    it('should deduct balance correctly', async () => {
      let savedUser: any = null;

      (mockEntityManager.findOne as jest.Mock)
        .mockResolvedValueOnce({ ...mockUser })
        .mockResolvedValueOnce({ status: 'approved' });
      (mockEntityManager.save as jest.Mock).mockImplementation(
        (...args: any[]) => {
          if (args.length === 1) {
            const entity = args[0];
            if (entity.walletBalanceInr !== undefined) {
              savedUser = entity;
            }
            return entity;
          }
          return {};
        },
      );
      (mockEntityManager.create as jest.Mock).mockReturnValue({});

      await service.requestWithdrawal('user-1', 2000, {});

      expect(savedUser).not.toBeNull();
      expect(Number(savedUser.walletBalanceInr)).toBe(3000);
    });
  });

  describe('getWithdrawalHistory', () => {
    it('should return paginated history', async () => {
      const mockWithdrawals = [
        { id: 'w1', amount: 1000, status: 'pending', userId: 'user-1' },
        { id: 'w2', amount: 500, status: 'approved', userId: 'user-1' },
      ];

      mockWithdrawalRepo.findAndCount.mockResolvedValue([mockWithdrawals, 2]);
      mockWithdrawalRepo.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ totalWithdrawn: '500' }),
      });

      const result = await service.getWithdrawalHistory('user-1', 1, 10);

      expect(result.withdrawals).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.totalWithdrawn).toBe(500);
    });

    it('should return empty history for new user', async () => {
      mockWithdrawalRepo.findAndCount.mockResolvedValue([[], 0]);
      mockWithdrawalRepo.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ totalWithdrawn: '0' }),
      });

      const result = await service.getWithdrawalHistory('new-user', 1, 20);

      expect(result.withdrawals).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});
