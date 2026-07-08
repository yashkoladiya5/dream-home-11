import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Contest, ContestStatus } from '../contests/entities/contest.entity';
import { ContestsService } from '../contests/contests.service';

@Injectable()
export class ContestSchedulerService {
  private readonly logger = new Logger('ContestAutoComplete');

  constructor(
    @InjectRepository(Contest)
    private readonly contestRepository: Repository<Contest>,
    private readonly contestsService: ContestsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async autoCompleteContests() {
    const now = new Date();
    const expired = await this.contestRepository.find({
      where: {
        status: ContestStatus.RUNNING,
        endTime: LessThanOrEqual(now),
      },
      take: 50,
    });

    for (const contest of expired) {
      try {
        const result = await this.contestsService.completeContest(contest.id);
        this.logger.log(
          `Auto-completed contest ${contest.id}: ${contest.title} with ${result.winners.length} winners`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to auto-complete contest ${contest.id}: ${(error as Error).message}`,
        );
      }
    }
  }
}
