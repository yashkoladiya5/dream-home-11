import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThan, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Contest, ContestStatus } from './entities/contest.entity';
import { ContestMember } from './entities/contest-member.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUES } from '../queue/queue.constants';
import { DomainEventNames, createDomainEvent } from '../common/events/domain-events';

@Injectable()
export class ContestSchedulerService {
  private readonly logger = new Logger(ContestSchedulerService.name);

  constructor(
    @InjectRepository(Contest)
    private readonly contestRepository: Repository<Contest>,
    @InjectRepository(ContestMember)
    private readonly contestMemberRepository: Repository<ContestMember>,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue(QUEUES.PRIZE_DISTRIBUTION)
    private readonly prizeDistributionQueue: Queue,
  ) {}

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
        status: In([ContestStatus.RUNNING, ContestStatus.FILLED]),
        endTime: LessThanOrEqual(now),
      },
      take: 50,
    });

    for (const contest of contests) {
      contest.status = ContestStatus.COMPLETED;
      await this.contestRepository.save(contest);

      await this.enqueuePrizeDistribution(contest.id);

      this.eventEmitter.emit(
        DomainEventNames.CONTEST_COMPLETED,
        createDomainEvent(DomainEventNames.CONTEST_COMPLETED, {
          contestId: contest.id,
          title: contest.title,
        }),
      );

      this.logger.log(`Completed contest ${contest.id}: ${contest.title}`);
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

  private async enqueuePrizeDistribution(contestId: string): Promise<void> {
    const members = await this.contestMemberRepository.find({
      where: { contestId },
      order: { pointsEarned: 'DESC', joinedAt: 'ASC' },
    });

    const distributionPlan = members.map((m, index) => ({
      userId: m.userId,
      rank: index + 1,
      pointsEarned: m.pointsEarned,
    }));

    await this.prizeDistributionQueue.add(
      QUEUES.PRIZE_DISTRIBUTION,
      { contestId, distributionPlan },
      { jobId: `prize-${contestId}`, priority: 1 },
    );

    this.logger.log(
      `Enqueued prize distribution for contest ${contestId} (${distributionPlan.length} members)`,
    );
  }
}
