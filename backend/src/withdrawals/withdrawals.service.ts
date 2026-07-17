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
import { EncryptionService } from '../common/encryption/encryption.service';
import { ConfigService } from '../config/config.service';

import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class WithdrawalsService {
  constructor(
    @InjectRepository(Withdrawal)
    private readonly withdrawalRepo: Repository<Withdrawal>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly walletService: WalletService,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
    private readonly encryptionService: EncryptionService,
    private readonly configService: ConfigService,
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

    const config = await this.configService.getConfig();
    const minWithdrawal = Number(config.minWithdrawalAmount);
    if (amount < minWithdrawal) {
      throw new BadRequestException(
        `Minimum withdrawal amount is ₹${minWithdrawal}`,
      );
    }

    const restrictedStates = config.restrictedStates || [];

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

      if (user.state && restrictedStates.includes(user.state)) {
        throw new ForbiddenException(
          `Withdrawals are not allowed from ${user.state}`,
        );
      }

      const rawBankAccount = bankDetails.bankAccountNumber || user.bankAccountNumber || null;
      const encryptedBankAccount = rawBankAccount
        ? this.encryptionService.encrypt(rawBankAccount)
        : null;

      const savedWithdrawal = await entityManager.save(Withdrawal, {
        userId,
        amount,
        status: WithdrawalStatus.PENDING,
        bankAccountNumber: encryptedBankAccount,
        bankIfsc: bankDetails.bankIfsc || user.bankIfsc || null,
        bankName: bankDetails.bankName || user.bankName || null,
        upiId: bankDetails.upiId || user.upiId || null,
      } as any);

      await this.walletService.debitBalance(
        userId,
        amount,
        {
          type: 'withdrawal',
          id: savedWithdrawal.id,
          description: `Withdrawal request of ₹${amount}`,
        },
        entityManager,
      );

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
      relations: { user: true },
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
    const stats = await this.withdrawalRepo
      .createQueryBuilder('w')
      .select('COUNT(*)', 'totalCount')
      .addSelect('COALESCE(SUM(CASE WHEN w.status = :approved THEN w.amount ELSE 0 END), 0)', 'totalWithdrawn')
      .addSelect('COALESCE(SUM(CASE WHEN w.status = :pending THEN 1 ELSE 0 END), 0)', 'pendingCount')
      .addSelect('COALESCE(SUM(CASE WHEN w.status = :approved THEN 1 ELSE 0 END), 0)', 'approvedCount')
      .addSelect('COALESCE(SUM(CASE WHEN w.status = :rejected THEN 1 ELSE 0 END), 0)', 'rejectedCount')
      .where('w.userId = :userId', { userId })
      .setParameters({
        approved: WithdrawalStatus.APPROVED,
        pending: WithdrawalStatus.PENDING,
        rejected: WithdrawalStatus.REJECTED,
      })
      .getRawOne();

    return {
      totalWithdrawn: stats ? Math.round(Number(stats.totalWithdrawn) * 100) / 100 : 0,
      pendingCount: stats ? Number(stats.pendingCount) : 0,
      approvedCount: stats ? Number(stats.approvedCount) : 0,
      rejectedCount: stats ? Number(stats.rejectedCount) : 0,
      totalCount: stats ? Number(stats.totalCount) : 0,
    };
  }

  async getWithdrawalById(id: string, userId: string): Promise<Withdrawal> {
    const withdrawal = await this.withdrawalRepo.findOne({
      where: { id, userId },
      relations: { user: true },
    });
    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }
    return withdrawal;
  }
}
