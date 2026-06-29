import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Referral, ReferralStatus } from './entities/referral.entity';
import { User, UserLevel } from '../users/entities/user.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { randomBytes } from 'crypto';

@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name);

  constructor(
    @InjectRepository(Referral)
    private readonly referralRepo: Repository<Referral>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  generateReferralCode(): string {
    return randomBytes(4).toString('hex').toUpperCase();
  }

  async ensureReferralCode(user: User): Promise<string> {
    if (user.referralCode) return user.referralCode;
    let code: string;
    let exists: User | null;
    do {
      code = this.generateReferralCode();
      exists = await this.userRepo.findOne({ where: { referralCode: code } });
    } while (exists);
    user.referralCode = code;
    await this.userRepo.save(user);
    return code;
  }

  async applyReferral(currentUser: User, code: string): Promise<{ success: boolean; message: string; pointsAwarded: number }> {
    const referrer = await this.userRepo.findOne({ where: { referralCode: code } });
    if (!referrer) {
      throw new NotFoundException('Invalid referral code');
    }

    if (referrer.id === currentUser.id) {
      throw new BadRequestException('You cannot refer yourself');
    }

    const existing = await this.referralRepo.findOne({ where: { refereeId: currentUser.id } });
    if (existing) {
      throw new BadRequestException('You have already used a referral code');
    }

    const alreadyReferred = await this.referralRepo.findOne({ where: { referrerId: referrer.id, refereeId: currentUser.id } });
    if (alreadyReferred) {
      throw new BadRequestException('This referral has already been processed');
    }

    if (referrer.deviceId === currentUser.deviceId) {
      throw new BadRequestException('Referral cannot be from the same device');
    }

    const pointsAwarded = 30;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const referrerLock = await queryRunner.manager
        .createQueryBuilder(User, 'u')
        .setLock('pessimistic_write')
        .where('u.id = :id', { id: referrer.id })
        .getOne();

      if (!referrerLock) {
        throw new NotFoundException('Referrer not found');
      }

      referrerLock.pointsBalance = Number(referrerLock.pointsBalance) + pointsAwarded;
      referrerLock.lifetimePoints = Number(referrerLock.lifetimePoints) + pointsAwarded;

      if (referrerLock.lifetimePoints >= 5000) {
        referrerLock.currentTier = UserLevel.PLATINUM;
      } else if (referrerLock.lifetimePoints >= 2000) {
        referrerLock.currentTier = UserLevel.GOLD;
      } else if (referrerLock.lifetimePoints >= 1000) {
        referrerLock.currentTier = UserLevel.SILVER;
      }

      await queryRunner.manager.save(referrerLock);

      const referral = queryRunner.manager.create(Referral, {
        referrerId: referrer.id,
        refereeId: currentUser.id,
        signupReward: pointsAwarded,
        status: ReferralStatus.PENDING,
      });
      await queryRunner.manager.save(referral);

      const refereeLock = await queryRunner.manager
        .createQueryBuilder(User, 'u')
        .setLock('pessimistic_write')
        .where('u.id = :id', { id: currentUser.id })
        .getOne();

      if (refereeLock) {
        refereeLock.referredBy = referrer.id;
        await queryRunner.manager.save(refereeLock);
      }

      await queryRunner.manager.save(
        queryRunner.manager.create(Transaction, {
          userId: referrer.id,
          type: 'referral',
          cashAmount: 0,
          pointsAmount: pointsAwarded,
          pointsBalanceBefore: Number(referrerLock.pointsBalance) - pointsAwarded,
          pointsBalanceAfter: Number(referrerLock.pointsBalance),
          description: `Referral reward for inviting a friend`,
          referenceType: 'referral',
          status: 'completed',
        }),
      );

      await queryRunner.commitTransaction();
      return { success: true, message: 'Referral applied successfully', pointsAwarded };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getReferralStats(userId: string): Promise<{
    referralCode: string;
    totalReferred: number;
    totalRewardsEarned: number;
    totalKycCompleted: number;
  }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const code = await this.ensureReferralCode(user);

    const referrals = await this.referralRepo.find({ where: { referrerId: userId } });
    const totalReferred = referrals.length;
    const totalRewardsEarned = referrals.reduce((sum, r) => sum + r.signupReward + r.kycReward, 0);
    const totalKycCompleted = referrals.filter(r => r.status === ReferralStatus.SETTLED).length;

    return { referralCode: code, totalReferred, totalRewardsEarned, totalKycCompleted };
  }

  async getReferralHistory(userId: string): Promise<{
    refereeName: string | null;
    refereeAvatarUrl: string | null;
    status: string;
    signupReward: number;
    kycReward: number;
    createdAt: Date;
    settledAt: Date | null;
  }[]> {
    const referrals = await this.referralRepo.find({
      where: { referrerId: userId },
      relations: { referee: true },
      order: { createdAt: 'DESC' },
    });

    return referrals.map(r => ({
      refereeName: r.referee?.fullName ?? null,
      refereeAvatarUrl: r.referee?.avatarUrl ?? null,
      status: r.status,
      signupReward: r.signupReward,
      kycReward: r.kycReward,
      createdAt: r.createdAt,
      settledAt: r.settledAt,
    }));
  }

  async processKycReferral(refereeId: string): Promise<void> {
    const referral = await this.referralRepo.findOne({
      where: { refereeId, status: ReferralStatus.PENDING },
      relations: { referrer: true },
    });

    if (!referral) return;

    const kycReward = 50;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const referrerLock = await queryRunner.manager
        .createQueryBuilder(User, 'u')
        .setLock('pessimistic_write')
        .where('u.id = :id', { id: referral.referrerId })
        .getOne();

      if (!referrerLock) {
        await queryRunner.rollbackTransaction();
        throw new NotFoundException('Referrer not found for KYC bonus');
      }

      referrerLock.pointsBalance = Number(referrerLock.pointsBalance) + kycReward;
      referrerLock.lifetimePoints = Number(referrerLock.lifetimePoints) + kycReward;

      if (referrerLock.lifetimePoints >= 5000) {
        referrerLock.currentTier = UserLevel.PLATINUM;
      } else if (referrerLock.lifetimePoints >= 2000) {
        referrerLock.currentTier = UserLevel.GOLD;
      } else if (referrerLock.lifetimePoints >= 1000) {
        referrerLock.currentTier = UserLevel.SILVER;
      }

      await queryRunner.manager.save(referrerLock);

      referral.kycReward = kycReward;
      referral.status = ReferralStatus.SETTLED;
      referral.settledAt = new Date();
      await queryRunner.manager.save(referral);

      await queryRunner.manager.save(
        queryRunner.manager.create(Transaction, {
          userId: referral.referrerId,
          type: 'referral',
          cashAmount: 0,
          pointsAmount: kycReward,
          pointsBalanceBefore: Number(referrerLock.pointsBalance) - kycReward,
          pointsBalanceAfter: Number(referrerLock.pointsBalance),
          description: `KYC bonus from referred friend`,
          referenceType: 'referral',
          status: 'completed',
        }),
      );

      await queryRunner.commitTransaction();
      this.logger.log(`KYC referral bonus of ${kycReward} awarded to ${referral.referrerId} for referee ${refereeId}`);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to process KYC referral for referee ${refereeId}`, err);
    } finally {
      await queryRunner.release();
    }
  }
}
