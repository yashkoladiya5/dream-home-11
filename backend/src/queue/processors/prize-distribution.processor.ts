import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUES } from '../queue.constants';
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { User } from '../../users/entities/user.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import {
  DomainEventNames,
  createDomainEvent,
} from '../../common/events/domain-events';

interface DistributionEntry {
  userId: string;
  rank: number;
  pointsEarned: number;
}

const PRIZE_SHARES: Record<number, number> = {
  1: 0.5,
  2: 0.3,
  3: 0.2,
};

@Injectable()
@Processor(QUEUES.PRIZE_DISTRIBUTION)
export class PrizeDistributionProcessor extends WorkerHost {
  private readonly logger = new Logger(PrizeDistributionProcessor.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async process(
    job: Job<{ contestId: string; distributionPlan: DistributionEntry[] }>,
  ): Promise<void> {
    const { contestId, distributionPlan } = job.data;
    this.logger.log(
      `Processing prize distribution for contest ${contestId} (${distributionPlan.length} members)`,
    );

    const winners = distributionPlan.filter((e) => e.rank <= 3);
    if (winners.length === 0) {
      this.logger.warn(`No winners for contest ${contestId}`);
      return;
    }

    const totalPrize = this.calculateTotalPrize(distributionPlan);

    await this.dataSource.transaction(async (entityManager) => {
      for (const winner of winners) {
        const share = PRIZE_SHARES[winner.rank] || 0;
        const prizeAmount = Math.round(totalPrize * share);

        if (prizeAmount <= 0) continue;

        const user = await entityManager.findOne(User, {
          where: { id: winner.userId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!user) {
          this.logger.warn(`User ${winner.userId} not found, skipping prize`);
          continue;
        }

        const pointsBefore = Number(user.pointsBalance);
        user.pointsBalance = pointsBefore + prizeAmount;
        user.lifetimePoints = Number(user.lifetimePoints) + prizeAmount;
        await entityManager.save(user);

        await entityManager.save(
          entityManager.create(Transaction, {
            userId: winner.userId,
            type: 'prize',
            pointsAmount: prizeAmount,
            pointsBalanceBefore: pointsBefore,
            pointsBalanceAfter: Number(user.pointsBalance),
            description: `Prize for contest #${contestId} (Rank ${winner.rank})`,
            referenceType: 'contest',
            referenceId: contestId,
            status: 'completed',
          }),
        );

        this.logger.log(
          `User ${winner.userId}: Rank ${winner.rank} → ${prizeAmount} points`,
        );
      }
    });

    this.eventEmitter.emit(
      DomainEventNames.PRIZE_DISTRIBUTED,
      createDomainEvent(DomainEventNames.PRIZE_DISTRIBUTED, {
        contestId,
        prizePool: totalPrize,
        winners: winners.map((w) => ({ userId: w.userId, rank: w.rank })),
      }),
    );

    this.logger.log(`Prize distribution complete for contest ${contestId}`);
  }

  private calculateTotalPrize(distributionPlan: DistributionEntry[]): number {
    return distributionPlan.reduce((sum, entry) => sum + entry.pointsEarned, 0);
  }
}
