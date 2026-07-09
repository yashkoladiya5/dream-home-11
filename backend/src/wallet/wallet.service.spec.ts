import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { WalletService } from './wallet.service';
import { Wallet } from './entities/wallet.entity';
import { createMockRepository, MockRepository } from '../test/mock-repository.factory';
import { createMockDataSource } from '../test/mock-services.factory';

describe('WalletService', () => {
  let service: WalletService;
  let walletRepo: MockRepository<Wallet>;
  let mockDataSource: ReturnType<typeof createMockDataSource>;

  const mockWallet: Wallet = {
    id: 'wallet-1',
    userId: 'user-1',
    user: null as any,
    balanceInr: 1000,
    lockedBalanceInr: 200,
    pointsBalance: 500,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  function makeManager(overrides: Record<string, any> = {}) {
    return {
      findOne: jest.fn().mockImplementation(() => Promise.resolve({ ...mockWallet })),
      save: jest.fn().mockImplementation((w) => Promise.resolve(w)),
      create: jest.fn((_e: any, data: any) => data),
      ...overrides,
    };
  }

  beforeEach(async () => {
    walletRepo = createMockRepository<Wallet>();
    mockDataSource = createMockDataSource();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: getRepositoryToken(Wallet), useValue: walletRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getWallet', () => {
    it('should return wallet for existing user', async () => {
      (walletRepo.findOne as jest.Mock).mockResolvedValue(mockWallet);
      const result = await service.getWallet('user-1');
      expect(result.id).toBe('wallet-1');
      expect(result.balanceInr).toBe(1000);
    });

    it('should throw NotFoundException for missing wallet', async () => {
      (walletRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.getWallet('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('initializeWallet', () => {
    it('should create and save a new wallet', async () => {
      (walletRepo.create as jest.Mock).mockReturnValue({ userId: 'new-user' });
      (walletRepo.save as jest.Mock).mockResolvedValue({ id: 'new-wallet', userId: 'new-user' });

      const result = await service.initializeWallet('new-user');
      expect(result.userId).toBe('new-user');
      expect(walletRepo.create).toHaveBeenCalledWith({ userId: 'new-user' });
    });
  });

  describe('creditBalance', () => {
    it('should credit balance and create transaction', async () => {
      const manager = makeManager();
      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(manager));

      const result = await service.creditBalance('user-1', 500, { type: 'deposit', id: 'ref-1', description: 'Test deposit' });
      expect(result.wallet.balanceInr).toBe(1500);
      expect(manager.save).toHaveBeenCalledTimes(2);
    });

    it('should throw BadRequestException for non-positive amount', async () => {
      await expect(service.creditBalance('user-1', 0, { type: 'deposit', id: 'ref-1', description: '' })).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when wallet not found', async () => {
      const manager = makeManager({ findOne: jest.fn().mockResolvedValue(null) });
      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(manager));
      await expect(service.creditBalance('user-1', 500, { type: 'deposit', id: 'ref-1', description: '' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('debitBalance', () => {
    it('should debit balance and create transaction', async () => {
      const manager = makeManager();
      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(manager));

      const result = await service.debitBalance('user-1', 300, { type: 'entry_fee', id: 'ref-1', description: 'Contest entry' });
      expect(result.wallet.balanceInr).toBe(700);
    });

    it('should throw BadRequestException for insufficient balance', async () => {
      const manager = makeManager();
      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(manager));
      await expect(service.debitBalance('user-1', 5000, { type: 'entry_fee', id: 'ref-1', description: '' })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for non-positive amount', async () => {
      await expect(service.debitBalance('user-1', -100, { type: 'entry_fee', id: 'ref-1', description: '' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('lockBalance', () => {
    it('should lock part of the balance', async () => {
      const manager = makeManager();
      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(manager));

      const result = await service.lockBalance('user-1', 300);
      expect(result.balanceInr).toBe(700);
      expect(result.lockedBalanceInr).toBe(500);
    });

    it('should throw BadRequestException when locking more than available', async () => {
      const manager = makeManager();
      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(manager));
      await expect(service.lockBalance('user-1', 5000)).rejects.toThrow(BadRequestException);
    });
  });

  describe('unlockBalance', () => {
    it('should unlock previously locked balance', async () => {
      const manager = makeManager();
      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(manager));

      const result = await service.unlockBalance('user-1', 100);
      expect(result.balanceInr).toBe(1100);
      expect(result.lockedBalanceInr).toBe(100);
    });

    it('should throw BadRequestException when unlocking more than locked', async () => {
      const manager = makeManager();
      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(manager));
      await expect(service.unlockBalance('user-1', 5000)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getBalance', () => {
    it('should return balance summary', async () => {
      (walletRepo.findOne as jest.Mock).mockResolvedValue(mockWallet);
      const result = await service.getBalance('user-1');
      expect(result.balanceInr).toBe(1000);
      expect(result.lockedBalanceInr).toBe(200);
      expect(result.availableBalance).toBe(800);
      expect(result.pointsBalance).toBe(500);
    });
  });

  describe('creditPoints', () => {
    it('should credit points to wallet', async () => {
      const manager = makeManager();
      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(manager));

      const result = await service.creditPoints('user-1', 100);
      expect(result.pointsBalance).toBe(600);
    });

    it('should throw BadRequestException for non-positive points', async () => {
      await expect(service.creditPoints('user-1', 0)).rejects.toThrow(BadRequestException);
    });
  });

  describe('debitPoints', () => {
    it('should debit points from wallet', async () => {
      const manager = makeManager();
      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(manager));

      const result = await service.debitPoints('user-1', 200);
      expect(result.pointsBalance).toBe(300);
    });

    it('should throw BadRequestException for insufficient points', async () => {
      const manager = makeManager();
      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(manager));
      await expect(service.debitPoints('user-1', 5000)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for non-positive points', async () => {
      await expect(service.debitPoints('user-1', -10)).rejects.toThrow(BadRequestException);
    });
  });
});
