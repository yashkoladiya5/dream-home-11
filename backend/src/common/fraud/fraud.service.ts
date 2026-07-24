import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Withdrawal } from '../../withdrawals/entities/withdrawal.entity';
import { User } from '../../users/entities/user.entity';
import {
  FraudAlert,
  FraudSeverity,
  FraudStatus,
} from '../../admin/entities/fraud-alert.entity';

export interface FraudCheckResult {
  isSuspicious: boolean;
  score: number;
  flags: string[];
  severity: FraudSeverity | null;
  alertId?: string;
}

@Injectable()
export class FraudService {
  constructor(
    @InjectRepository(Withdrawal)
    private readonly withdrawalRepo: Repository<Withdrawal>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(FraudAlert)
    private readonly fraudAlertRepo: Repository<FraudAlert>,
  ) {}

  async checkWithdrawalFraud(
    userId: string,
    amount: number,
    ipAddress?: string,
  ): Promise<FraudCheckResult> {
    const flags: string[] = [];
    let score = 0;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const hourWithdrawals = await this.withdrawalRepo
      .createQueryBuilder('w')
      .where('w.user_id = :userId', { userId })
      .andWhere('w.created_at >= :oneHourAgo', { oneHourAgo })
      .getCount();

    if (hourWithdrawals >= 3) {
      flags.push('HIGH_WITHDRAWAL_VELOCITY');
      score += 30;
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (user && user.bankAccountNumber) {
      const sameBankWithdrawals = await this.withdrawalRepo.count({
        where: { userId },
      });
      if (sameBankWithdrawals > 5) {
        flags.push('SAME_BANK_FREQUENT');
        score += 15;
      }
    }

    const totalPending = await this.withdrawalRepo.count({
      where: { userId, status: 'pending' as any },
    });

    if (totalPending >= 5) {
      flags.push('MULTIPLE_PENDING_WITHDRAWALS');
      score += 20;
    }

    const severity = this.determineSeverity(score);
    const isSuspicious = score >= 20;

    let alertId: string | undefined;
    if (isSuspicious) {
      const alert = await this.fraudAlertRepo.save({
        userId,
        rule: 'withdrawal_fraud_check',
        severity,
        description: `Suspicious withdrawal detected: ${flags.join(', ')}`,
        evidence: JSON.stringify({ amount, score, flags }),
        status: FraudStatus.OPEN,
        fraudScore: score,
        ipAddress: ipAddress || null,
        flaggedField: 'withdrawal',
      } as any);
      alertId = alert.id;
    }

    return { isSuspicious, score, flags, severity, alertId };
  }

  async checkLoginFraud(
    phoneNumber: string,
    ipAddress?: string,
  ): Promise<FraudCheckResult> {
    const flags: string[] = [];
    let score = 0;

    const usersWithPhone = await this.userRepo.count({
      where: { phoneNumber },
    });

    if (usersWithPhone > 3) {
      flags.push('TOO_MANY_ACCOUNTS_SAME_PHONE');
      score += 40;
    }

    const severity = this.determineSeverity(score);
    const isSuspicious = score >= 30;

    let alertId: string | undefined;
    if (isSuspicious) {
      const user = await this.userRepo.findOne({ where: { phoneNumber } });
      if (user) {
        const alert = await this.fraudAlertRepo.save({
          userId: user.id,
          rule: 'login_fraud_check',
          severity,
          description: `Suspicious login detected: ${flags.join(', ')}`,
          evidence: JSON.stringify({ phoneNumber, score, flags }),
          status: FraudStatus.OPEN,
          fraudScore: score,
          ipAddress: ipAddress || null,
          flaggedField: 'login',
        } as any);
        alertId = alert.id;
      }
    }

    return { isSuspicious, score, flags, severity, alertId };
  }

  async checkContestFraud(
    userId: string,
    contestId: string,
  ): Promise<FraudCheckResult> {
    const flags: string[] = [];
    let score = 0;

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (user && user.deviceId) {
      const sameDeviceUsers = await this.userRepo.count({
        where: { deviceId: user.deviceId },
      });

      if (sameDeviceUsers > 2) {
        flags.push('MULTIPLE_ACCOUNTS_SAME_DEVICE');
        score += 35;
      }
    }

    const severity = this.determineSeverity(score);
    const isSuspicious = score >= 25;

    let alertId: string | undefined;
    if (isSuspicious) {
      const alert = await this.fraudAlertRepo.save({
        userId,
        rule: 'contest_fraud_check',
        severity,
        description: `Suspicious contest activity detected: ${flags.join(', ')}`,
        evidence: JSON.stringify({ contestId, score, flags }),
        status: FraudStatus.OPEN,
        fraudScore: score,
        flaggedField: 'contest',
      } as any);
      alertId = alert.id;
    }

    return { isSuspicious, score, flags, severity, alertId };
  }

  private determineSeverity(score: number): FraudSeverity {
    if (score >= 50) return FraudSeverity.CRITICAL;
    if (score >= 30) return FraudSeverity.HIGH;
    if (score >= 15) return FraudSeverity.MEDIUM;
    return FraudSeverity.LOW;
  }
}
