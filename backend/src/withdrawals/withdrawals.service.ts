import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Withdrawal, WithdrawalStatus } from './entities/withdrawal.entity';
import { User } from '../users/entities/user.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Kyc } from '../kyc/entities/kyc.entity';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';

const RESTRICTED_STATES = ['Assam', 'Odisha', 'Telangana'];

@Injectable()
export class WithdrawalsService {
  constructor(
    @InjectRepository(Withdrawal)
    private readonly withdrawalRepo: Repository<Withdrawal>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  async requestWithdrawal(
    userId: string,
    amount: number,
    bankDetails: {
      bankAccountNumber?: string;
      bankIfsc?: string;
      bankName?: string;
      upiId?: string;
    },
  ): Promise<Withdrawal> {
    if (amount <= 0) {
      throw new BadRequestException(
        'Withdrawal amount must be greater than zero',
      );
    }

    const minWithdrawal = 100;
    if (amount < minWithdrawal) {
      throw new BadRequestException(
        `Minimum withdrawal amount is ₹${minWithdrawal}`,
      );
    }

    return this.dataSource.transaction(async (entityManager) => {
      const user = await entityManager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.isActive) {
        throw new ForbiddenException('Account is inactive');
      }

      const cashBalance = Number(user.walletBalanceInr);
      if (cashBalance < amount) {
        throw new BadRequestException('Insufficient balance');
      }

      const kyc = await entityManager.findOne(Kyc, { where: { userId } });
      if (!kyc || kyc.status !== 'approved') {
        throw new ForbiddenException(
          'KYC verification required for withdrawal',
        );
      }

      if (user.state && RESTRICTED_STATES.includes(user.state)) {
        throw new ForbiddenException(
          `Withdrawals are not allowed from ${user.state}`,
        );
      }

      const balanceBefore = Number(user.walletBalanceInr);
      user.walletBalanceInr = balanceBefore - amount;
      await entityManager.save(user);

      const savedWithdrawal = await entityManager.save(Withdrawal, {
        userId,
        amount,
        status: WithdrawalStatus.PENDING,
        bankAccountNumber:
          bankDetails.bankAccountNumber || user.bankAccountNumber || null,
        bankIfsc: bankDetails.bankIfsc || user.bankIfsc || null,
        bankName: bankDetails.bankName || user.bankName || null,
        upiId: bankDetails.upiId || user.upiId || null,
      } as any);

      const transaction = entityManager.create(Transaction, {
        userId,
        type: 'withdrawal',
        cashAmount: amount,
        cashBalanceBefore: balanceBefore,
        cashBalanceAfter: Number(user.walletBalanceInr),
        pointsAmount: 0,
        description: `Withdrawal request of ₹${amount}`,
        referenceType: 'withdrawal',
        referenceId: savedWithdrawal.id,
        status: 'completed',
      });
      await entityManager.save(transaction);

      return savedWithdrawal;
    });
  }

  async logWithdrawalRequest(
    userId: string,
    withdrawalId: string,
    amount: number,
  ): Promise<void> {
    try {
      await this.auditService.log({
        userId,
        action: AuditAction.WITHDRAWAL_REQUEST,
        targetId: withdrawalId,
        targetType: 'withdrawal',
        metadata: { amount },
      });
    } catch {}
  }

  async getWithdrawalHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    withdrawals: Withdrawal[];
    total: number;
    page: number;
    totalPages: number;
    totalWithdrawn: number;
  }> {
    const [withdrawals, total] = await this.withdrawalRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const result = await this.withdrawalRepo
      .createQueryBuilder('w')
      .select('SUM(w.amount)', 'totalWithdrawn')
      .where('w.userId = :userId', { userId })
      .andWhere('w.status = :status', { status: WithdrawalStatus.APPROVED })
      .getRawOne();

    return {
      withdrawals,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      totalWithdrawn: result?.totalWithdrawn
        ? Number(result.totalWithdrawn)
        : 0,
    };
  }

  async getWithdrawalStats(userId: string): Promise<{
    totalWithdrawn: number;
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    totalCount: number;
  }> {
    const withdrawals = await this.withdrawalRepo.find({ where: { userId } });
    let totalWithdrawn = 0;
    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;

    for (const w of withdrawals) {
      const amt = Number(w.amount);
      if (w.status === WithdrawalStatus.APPROVED) {
        totalWithdrawn += amt;
        approvedCount++;
      } else if (w.status === WithdrawalStatus.PENDING) {
        pendingCount++;
      } else if (w.status === WithdrawalStatus.REJECTED) {
        rejectedCount++;
      }
    }

    return {
      totalWithdrawn: Math.round(totalWithdrawn * 100) / 100,
      pendingCount,
      approvedCount,
      rejectedCount,
      totalCount: withdrawals.length,
    };
  }

  async getWithdrawalById(id: string, userId: string): Promise<Withdrawal> {
    const withdrawal = await this.withdrawalRepo.findOne({
      where: { id, userId },
    });
    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }
    return withdrawal;
  }
}
