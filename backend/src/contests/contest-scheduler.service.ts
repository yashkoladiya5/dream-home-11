import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Contest, ContestStatus } from './entities/contest.entity';
import { ContestsService } from './contests.service';
import { DomainEventNames, createDomainEvent } from '../common/events/domain-events';

@Injectable()
export class ContestSchedulerService {
  private readonly logger = new Logger(ContestSchedulerService.name);

  constructor(
    @InjectRepository(Contest)
    private readonly contestRepository: Repository<Contest>,
    private readonly eventEmitter: EventEmitter2,
    private readonly contestsService: ContestsService,
  ) {}

  // Run status checker cron job every 30 seconds to handle transitions
  @Cron(CronExpression.EVERY_30_SECONDS)
  async processStatusTransitions(): Promise<void> {
    await this.activateUpcomingContests();
    await this.completeExpiredContests();
  }

  private async activateUpcomingContests(): Promise<void> {
    const now = new Date();
    const contests = await this.contestRepository.find({
      where: {
        status: ContestStatus.UPCOMING,
        startTime: LessThanOrEqual(now),
      },
      take: 50,
    });

    for (const contest of contests) {
      contest.status = ContestStatus.RUNNING;
      await this.contestRepository.save(contest);

      this.eventEmitter.emit(
        DomainEventNames.CONTEST_STARTED,
        createDomainEvent(DomainEventNames.CONTEST_STARTED, {
          contestId: contest.id,
          title: contest.title,
        }),
      );

      this.logger.log(`Activated contest ${contest.id}: ${contest.title}`);
    }
  }

  private async completeExpiredContests(): Promise<void> {
    const now = new Date();
    const contests = await this.contestRepository.find({
      where: {
        status: ContestStatus.RUNNING,
        endTime: LessThanOrEqual(now),
      },
      take: 50,
    });

    for (const contest of contests) {
      try {
        const result = await this.contestsService.completeContest(contest.id);

        this.eventEmitter.emit(
          DomainEventNames.CONTEST_COMPLETED,
          createDomainEvent(DomainEventNames.CONTEST_COMPLETED, {
            contestId: contest.id,
            title: contest.title,
          }),
        );

        this.logger.log(
          `Completed contest ${contest.id}: ${contest.title} with ${result.winners.length} winners`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to complete contest ${contest.id}: ${(error as Error).message}`,
        );
      }
    }
  }

  async checkAndFillContest(contestId: string): Promise<void> {
    const contest = await this.contestRepository.findOne({
      where: { id: contestId },
    });
    if (!contest) return;

    if (
      contest.status === ContestStatus.RUNNING &&
      contest.filledSlots >= contest.maxSlots
    ) {
      contest.status = ContestStatus.FILLED;
      await this.contestRepository.save(contest);
      this.logger.log(`Contest ${contestId} filled all slots`);
    }
  }
}
