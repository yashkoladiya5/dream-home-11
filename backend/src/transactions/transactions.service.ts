import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, In } from 'typeorm';
import { Transaction } from './entities/transaction.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
  ) {}

  async logTransaction(params: {
    userId: string;
    type: string;
    cashAmount?: number;
    pointsAmount?: number;
    cashBalanceBefore?: number;
    cashBalanceAfter?: number;
    pointsBalanceBefore?: number;
    pointsBalanceAfter?: number;
    description?: string;
    referenceType?: string;
    referenceId?: string;
    status?: string;
  }): Promise<Transaction> {
    const tx = this.transactionRepo.create({
      userId: params.userId,
      type: params.type,
      cashAmount: params.cashAmount ?? 0,
      pointsAmount: params.pointsAmount ?? 0,
      cashBalanceBefore: params.cashBalanceBefore,
      cashBalanceAfter: params.cashBalanceAfter,
      pointsBalanceBefore: params.pointsBalanceBefore,
      pointsBalanceAfter: params.pointsBalanceAfter,
      description: params.description,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      status: params.status ?? 'completed',
    });
    return this.transactionRepo.save(tx);
  }

  async getHistory(
    userId: string,
    page = 1,
    limit = 20,
    type?: string,
  ): Promise<{
    transactions: Transaction[];
    total: number;
    page: number;
    limit: number;
  }> {
    const where: any = { userId };
    if (type) {
      const types = type.split(',').map((t) => t.trim());
      where.type = In(types);
    }
    const [transactions, total] = await this.transactionRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { transactions, total, page, limit };
  }

  async getBalanceSummary(userId: string): Promise<{
    totalCashDeposited: number;
    totalCashSpent: number;
    totalPointsEarned: number;
    totalPointsSpent: number;
    totalWithdrawn: number;
  }> {
    const result = await this.transactionRepo
      .createQueryBuilder('t')
      .select('t.type', 'type')
      .addSelect('t.status', 'status')
      .addSelect('SUM(t.cashAmount)', 'totalCash')
      .addSelect('SUM(t.pointsAmount)', 'totalPoints')
      .where('t.userId = :userId', { userId })
      .groupBy('t.type')
      .addGroupBy('t.status')
      .getRawMany();

    let totalCashDeposited = 0;
    let totalCashSpent = 0;
    let totalPointsEarned = 0;
    let totalPointsSpent = 0;
    let totalWithdrawn = 0;

    for (const row of result) {
      const type = row.type;
      const status = row.status;
      const cash = Number(row.totalCash || 0);
      const points = Number(row.totalPoints || 0);

      if (type === 'deposit') {
        totalCashDeposited += cash;
      } else if (type === 'entry_fee') {
        totalCashSpent += cash;
      } else if (type === 'points_earned') {
        totalPointsEarned += points;
      } else if (type === 'redemption') {
        totalPointsSpent += points;
      } else if (type === 'withdrawal' && status === 'completed') {
        totalWithdrawn += cash;
      }
    }

    return {
      totalCashDeposited,
      totalCashSpent,
      totalPointsEarned,
      totalPointsSpent,
      totalWithdrawn,
    };
  }
}
