import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Kyc } from '../kyc/entities/kyc.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { ContestMember } from '../contests/entities/contest-member.entity';
import { PointLog } from '../points/entities/point-log.entity';
import { Withdrawal } from '../withdrawals/entities/withdrawal.entity';
import { Referral } from '../referral/entities/referral.entity';
import { CompensationLog } from '../compensation/entities/compensation.entity';

export interface UserDataExport {
  user: Partial<User> | null;
  kyc: Partial<Kyc> | null;
  wallet: Partial<Wallet> | null;
  transactions: Transaction[];
  contestMemberships: ContestMember[];
  pointLogs: PointLog[];
  withdrawals: Withdrawal[];
  referrals: Referral[];
  compensations: CompensationLog[];
  exportedAt: string;
}

@Injectable()
export class GdprService {
  private readonly logger = new Logger(GdprService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Kyc)
    private readonly kycRepo: Repository<Kyc>,
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(ContestMember)
    private readonly contestMemberRepo: Repository<ContestMember>,
    @InjectRepository(PointLog)
    private readonly pointLogRepo: Repository<PointLog>,
    @InjectRepository(Withdrawal)
    private readonly withdrawalRepo: Repository<Withdrawal>,
    @InjectRepository(Referral)
    private readonly referralRepo: Repository<Referral>,
    @InjectRepository(CompensationLog)
    private readonly compensationLogRepo: Repository<CompensationLog>,
    private readonly dataSource: DataSource,
  ) {}

  async exportUserData(userId: string): Promise<UserDataExport> {
    const [
      user,
      kyc,
      wallet,
      transactions,
      contestMemberships,
      pointLogs,
      withdrawals,
      referralsAsReferrer,
      referralsAsReferee,
      compensations,
    ] = await Promise.all([
      this.userRepo.findOne({ where: { id: userId } }),
      this.kycRepo.findOne({ where: { userId } }),
      this.walletRepo.findOne({ where: { userId } }),
      this.transactionRepo.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      }),
      this.contestMemberRepo.find({
        where: { userId },
        order: { joinedAt: 'DESC' },
      }),
      this.pointLogRepo.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      }),
      this.withdrawalRepo.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      }),
      this.referralRepo.find({
        where: { referrerId: userId },
        order: { createdAt: 'DESC' },
      }),
      this.referralRepo.find({
        where: { refereeId: userId },
        order: { createdAt: 'DESC' },
      }),
      this.compensationLogRepo.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      }),
    ]);

    return {
      user,
      kyc,
      wallet,
      transactions,
      contestMemberships,
      pointLogs,
      withdrawals,
      referrals: [...referralsAsReferrer, ...referralsAsReferee],
      compensations,
      exportedAt: new Date().toISOString(),
    };
  }

  async requestAccountDeletion(userId: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    user.isActive = false;
    user.fullName = '[deleted]';
    (user.email as string | null) = null;
    user.phoneNumber = `deleted_${userId.slice(0, 8)}`;
    (user.avatarUrl as string | null) = null;
    (user.bankAccountNumber as string | null) = null;
    (user.bankIfsc as string | null) = null;
    (user.bankName as string | null) = null;
    (user.upiId as string | null) = null;
    user.deviceId = `deleted_${userId.slice(0, 8)}`;

    await this.userRepo.save(user);

    this.logger.log(`Account soft-deleted for user ${userId}`);
  }

  async permanentDeleteAccount(userId: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.dataSource.transaction(async (entityManager) => {
      await entityManager.delete(PointLog, { userId });
      await entityManager.delete(Transaction, { userId });
      await entityManager.delete(ContestMember, { userId });
      await entityManager.delete(Withdrawal, { userId });
      await entityManager.delete(Referral, { referrerId: userId });
      await entityManager.delete(Referral, { refereeId: userId });
      await entityManager.delete(CompensationLog, { userId });
      await entityManager.delete(Kyc, { userId });
      await entityManager.delete(Wallet, { userId });
      await entityManager.delete(User, userId);
    });

    this.logger.log(`Account permanently deleted for user ${userId}`);
  }
}
