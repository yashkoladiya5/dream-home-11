import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StreakService } from './streak.service';

@Injectable()
export class StreakCronService {
  private readonly logger = new Logger(StreakCronService.name);

  constructor(private readonly streakService: StreakService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleMidnightStreakCheck() {
    this.logger.log('Running midnight streak check...');
    try {
      const penaltyCount = await this.streakService.applyMissedDayPenalties();
      this.logger.log(
        `Streak check complete. Applied penalties to ${penaltyCount} users.`,
      );
    } catch (error) {
      this.logger.error('Failed to run midnight streak check', error);
    }
  }
}
