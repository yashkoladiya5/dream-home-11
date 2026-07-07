import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { QUEUES } from '../queue.constants';
import { Contest, ContestStatus } from '../../contests/entities/contest.entity';
import { ContestMember } from '../../contests/entities/contest-member.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { User } from '../../users/entities/user.entity';
import { DomainEventNames, createDomainEvent } from '../../common/events/domain-events';

@Injectable()
@Processor(QUEUES.SETTLEMENT)
export class SettlementProcessor extends WorkerHost {
  private readonly logger = new Logger(SettlementProcessor.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job<{ contestId: string }>): Promise<void> {
    const { contestId } = job.data;
    this.logger.log(`Processing settlement for contest ${contestId}`);

    await this.dataSource.transaction(async (entityManager) => {
      const contest = await entityManager.findOne(Contest, {
        where: { id: contestId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!contest) {
        this.logger.warn(`Contest ${contestId} not found`);
        return;
      }

      if (contest.status !== ContestStatus.COMPLETED) {
        this.logger.warn(`Contest ${contestId} status is ${contest.status}, not completed`);
        return;
      }

      const members = await entityManager.find(ContestMember, {
        where: { contestId },
        relations: { user: true },
      });

      const entryFee = Number(contest.entryFeeInr);
      let settledCount = 0;
      for (const member of members) {
        if (entryFee > 0) {
          const user = await entityManager.findOne(User, {
            where: { id: member.userId },
            lock: { mode: 'pessimistic_write' },
          });

          if (user) {
            await entityManager.save(
              entityManager.create(Transaction, {
                userId: member.userId,
                type: 'settlement',
                cashAmount: -entryFee,
                description: `Settlement for contest #${contestId}`,
                referenceType: 'contest',
                referenceId: contestId,
                status: 'completed',
              }),
            );
            settledCount++;
          }
        }
      }

      this.logger.log(`Contest ${contestId}: settled ${settledCount}/${members.length} members`);
    });

    this.eventEmitter.emit(
      DomainEventNames.CONTEST_SETTLED,
      createDomainEvent(DomainEventNames.CONTEST_SETTLED, { contestId }),
    );

    this.logger.log(`Settlement complete for contest ${contestId}`);
  }
}
