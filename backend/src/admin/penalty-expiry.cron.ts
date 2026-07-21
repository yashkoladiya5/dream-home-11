import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Warning, WarningStatus } from './entities/warning.entity';

@Injectable()
export class PenaltyExpiryCronService {
  private readonly logger = new Logger(PenaltyExpiryCronService.name);

  constructor(
    @InjectRepository(Warning)
    private readonly warningRepo: Repository<Warning>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    this.logger.log('Running daily cron job: Expiring old warnings');

    try {
      const now = new Date();
      
      const expiredWarnings = await this.warningRepo.find({
        where: {
          status: WarningStatus.ACTIVE,
          expiresAt: LessThan(now),
        },
      });

      if (expiredWarnings.length > 0) {
        for (const warning of expiredWarnings) {
          warning.status = WarningStatus.EXPIRED;
          // Optionally, we could reinstate some points if that was the business rule,
          // but usually warnings just expire without refunding penalty points.
        }

        await this.warningRepo.save(expiredWarnings);
        this.logger.log(`Successfully expired ${expiredWarnings.length} warnings.`);
      } else {
        this.logger.log('No warnings to expire today.');
      }
    } catch (error: any) {
      this.logger.error(`Failed to process warning expirations: ${error.message}`);
    }
  }
}
