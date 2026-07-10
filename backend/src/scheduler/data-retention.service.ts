import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { Kyc } from '../kyc/entities/kyc.entity';

@Injectable()
export class DataRetentionService {
  private readonly logger = new Logger(DataRetentionService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Kyc)
    private readonly kycRepo: Repository<Kyc>,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async enforceDataRetention() {
    const retentionDays = this.configService.get<number>('DATA_RETENTION_DAYS', 90);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);

    this.logger.log(`Enforcing data retention policy: ${retentionDays} days`);

    const deletedUsers = await this.userRepo.find({
      where: { deletedAt: LessThan(cutoff) as any },
      withDeleted: true,
    });

    for (const user of deletedUsers) {
      await this.userRepo.remove(user);
      this.logger.log(`Permanently deleted user ${user.id}`);
    }

    const inactiveCutoff = new Date();
    inactiveCutoff.setDate(inactiveCutoff.getDate() - 365);
    const inactiveUsers = await this.userRepo.find({
      where: { isActive: true },
    });

    for (const user of inactiveUsers) {
      if (!user.lastStreakDate || user.lastStreakDate < inactiveCutoff) {
        await this.kycRepo.update(
          { userId: user.id },
          {
            dateOfBirth: undefined as any,
            panNumber: '' as any,
            aadhaarNumber: '' as any,
            status: 'expired' as any,
          },
        );
        this.logger.log(`Anonymized KYC for inactive user ${user.id}`);
      }
    }
  }
}
