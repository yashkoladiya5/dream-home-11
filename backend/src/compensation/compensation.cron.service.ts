import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CompensationService } from './compensation.service';

@Injectable()
export class CompensationCronService {
  private readonly logger = new Logger(CompensationCronService.name);

  constructor(private readonly compensationService: CompensationService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCompensationCheck() {
    this.logger.log('Starting compensation check for unfilled contests...');

    try {
      // First, auto-close any running/upcoming contests that have expired
      const closeStats =
        await this.compensationService.autoCloseExpiredContests();
      if (closeStats.completed > 0 || closeStats.cancelled > 0) {
        this.logger.log(
          `Auto-closed expired contests: ${closeStats.completed} completed, ${closeStats.cancelled} cancelled`,
        );
      }

      const result =
        await this.compensationService.processPendingCompensations();

      if (result.contestsProcessed > 0) {
        this.logger.log(
          `Compensation complete: ${result.contestsProcessed} contests, ` +
            `${result.membersCompensated} members, ${result.totalPointsAwarded} total points`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Compensation check failed: ${(error as Error).message}`,
      );
    }
  }
}
