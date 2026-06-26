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

  async getHistory(userId: string, page = 1, limit = 20, type?: string): Promise<{ transactions: Transaction[]; total: number; page: number; limit: number }> {
    const where: any = { userId };
    if (type) {
      const types = type.split(',').map(t => t.trim());
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
    const deposits = await this.transactionRepo.find({
      where: { userId, type: 'deposit' },
    });
    const entries = await this.transactionRepo.find({
      where: { userId, type: 'entry_fee' },
    });
    const pointsEarned = await this.transactionRepo.find({
      where: { userId, type: 'points_earned' },
    });
    const redemptions = await this.transactionRepo.find({
      where: { userId, type: 'redemption' },
    });
    const withdrawals = await this.transactionRepo.find({
      where: { userId, type: 'withdrawal', status: 'completed' },
    });

    const totalCashDeposited = deposits.reduce((s, t) => s + Number(t.cashAmount), 0);
    const totalCashSpent = entries.reduce((s, t) => s + Number(t.cashAmount), 0);
    const totalPointsEarned = pointsEarned.reduce((s, t) => s + t.pointsAmount, 0);
    const totalPointsSpent = redemptions.reduce((s, t) => s + t.pointsAmount, 0);
    const totalWithdrawn = withdrawals.reduce((s, t) => s + Number(t.cashAmount), 0);

    return { totalCashDeposited, totalCashSpent, totalPointsEarned, totalPointsSpent, totalWithdrawn };
  }
}
