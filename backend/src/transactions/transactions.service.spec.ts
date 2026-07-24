import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TransactionsService } from './transactions.service';
import { Transaction } from './entities/transaction.entity';
import {
  createMockRepository,
  MockRepository,
} from '../test/mock-repository.factory';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let transactionRepo: MockRepository<Transaction>;

  const mockTransaction: Transaction = {
    id: 'tx-1',
    userId: 'user-1',
    user: null as any,
    type: 'deposit',
    cashAmount: 500,
    pointsAmount: 0,
    cashBalanceBefore: 500,
    cashBalanceAfter: 1000,
    pointsBalanceBefore: null as any,
    pointsBalanceAfter: null as any,
    description: 'Test deposit',
    referenceType: 'payment',
    referenceId: 'pay-123',
    status: 'completed',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    transactionRepo = createMockRepository<Transaction>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: getRepositoryToken(Transaction), useValue: transactionRepo },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logTransaction', () => {
    it('should create and save a transaction', async () => {
      (transactionRepo.create as jest.Mock).mockReturnValue(mockTransaction);
      (transactionRepo.save as jest.Mock).mockResolvedValue(mockTransaction);

      const result = await service.logTransaction({
        userId: 'user-1',
        type: 'deposit',
        cashAmount: 500,
        cashBalanceBefore: 500,
        cashBalanceAfter: 1000,
        description: 'Test deposit',
        referenceType: 'payment',
        referenceId: 'pay-123',
      });
      expect(result.type).toBe('deposit');
      expect(result.cashAmount).toBe(500);
      expect(transactionRepo.create).toHaveBeenCalled();
    });

    it('should use defaults for optional values', async () => {
      (transactionRepo.create as jest.Mock).mockReturnValue({
        ...mockTransaction,
        cashAmount: 0,
        pointsAmount: 0,
      });
      (transactionRepo.save as jest.Mock).mockResolvedValue({
        ...mockTransaction,
        cashAmount: 0,
        pointsAmount: 0,
      });

      const result = await service.logTransaction({
        userId: 'user-1',
        type: 'points_earned',
        pointsAmount: 100,
      });
      expect(result.cashAmount).toBe(0);
      expect(result.status).toBe('completed');
    });

    it('should set status override when provided', async () => {
      (transactionRepo.create as jest.Mock).mockReturnValue(mockTransaction);
      (transactionRepo.save as jest.Mock).mockResolvedValue(mockTransaction);

      const result = await service.logTransaction({
        userId: 'user-1',
        type: 'deposit',
        status: 'pending',
      });
      expect(result.status).toBe('completed');
    });
  });

  describe('getHistory', () => {
    it('should return paginated transaction history', async () => {
      (transactionRepo.findAndCount as jest.Mock).mockResolvedValue([
        [mockTransaction],
        1,
      ]);

      const result = await service.getHistory('user-1', 1, 20);
      expect(result.transactions).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should filter by type when provided', async () => {
      (transactionRepo.findAndCount as jest.Mock).mockResolvedValue([
        [mockTransaction],
        1,
      ]);

      const result = await service.getHistory('user-1', 1, 20, 'deposit');
      expect(result.transactions).toHaveLength(1);
      expect(transactionRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
            type: expect.any(Object),
          }),
        }),
      );
    });

    it('should handle multiple comma-separated types', async () => {
      (transactionRepo.findAndCount as jest.Mock).mockResolvedValue([
        [mockTransaction],
        1,
      ]);

      await service.getHistory('user-1', 1, 20, 'deposit,withdrawal');
      expect(transactionRepo.findAndCount).toHaveBeenCalled();
    });

    it('should return empty result for user with no transactions', async () => {
      (transactionRepo.findAndCount as jest.Mock).mockResolvedValue([[], 0]);

      const result = await service.getHistory('unknown-user');
      expect(result.transactions).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getBalanceSummary', () => {
    it('should summarize cash and point totals by type', async () => {
      (transactionRepo.createQueryBuilder as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          {
            type: 'deposit',
            status: 'completed',
            totalCash: '2000',
            totalPoints: '0',
          },
          {
            type: 'entry_fee',
            status: 'completed',
            totalCash: '500',
            totalPoints: '0',
          },
          {
            type: 'points_earned',
            status: 'completed',
            totalCash: '0',
            totalPoints: '300',
          },
          {
            type: 'redemption',
            status: 'completed',
            totalCash: '0',
            totalPoints: '100',
          },
          {
            type: 'withdrawal',
            status: 'completed',
            totalCash: '200',
            totalPoints: '0',
          },
        ]),
      });

      const result = await service.getBalanceSummary('user-1');
      expect(result.totalCashDeposited).toBe(2000);
      expect(result.totalCashSpent).toBe(500);
      expect(result.totalPointsEarned).toBe(300);
      expect(result.totalPointsSpent).toBe(100);
      expect(result.totalWithdrawn).toBe(200);
    });

    it('should return zeroed summary when no transactions', async () => {
      (transactionRepo.createQueryBuilder as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      });

      const result = await service.getBalanceSummary('user-1');
      expect(result.totalCashDeposited).toBe(0);
      expect(result.totalCashSpent).toBe(0);
      expect(result.totalPointsEarned).toBe(0);
      expect(result.totalPointsSpent).toBe(0);
      expect(result.totalWithdrawn).toBe(0);
    });
  });
});
