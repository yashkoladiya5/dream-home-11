import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUES, QueueName } from './queue.constants';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue(QUEUES.OTP_SMS) private readonly otpSmsQueue: Queue,
    @InjectQueue(QUEUES.PUSH_NOTIFICATIONS)
    private readonly pushNotificationsQueue: Queue,
    @InjectQueue(QUEUES.EMAIL) private readonly emailQueue: Queue,
    @InjectQueue(QUEUES.PRIZE_DISTRIBUTION)
    private readonly prizeDistributionQueue: Queue,
    @InjectQueue(QUEUES.SETTLEMENT) private readonly settlementQueue: Queue,
    @InjectQueue(QUEUES.REMINDERS) private readonly remindersQueue: Queue,
  ) {}

  private getQueue(name: QueueName): Queue {
    const queues: Record<QueueName, Queue> = {
      [QUEUES.OTP_SMS]: this.otpSmsQueue,
      [QUEUES.PUSH_NOTIFICATIONS]: this.pushNotificationsQueue,
      [QUEUES.EMAIL]: this.emailQueue,
      [QUEUES.PRIZE_DISTRIBUTION]: this.prizeDistributionQueue,
      [QUEUES.SETTLEMENT]: this.settlementQueue,
      [QUEUES.REMINDERS]: this.remindersQueue,
    };
    return queues[name];
  }

  async add<T>(
    queueName: QueueName,
    data: T,
    options?: { delay?: number; priority?: number; jobId?: string },
  ): Promise<string> {
    const queue = this.getQueue(queueName);
    const job = await queue.add(queueName, data, {
      delay: options?.delay,
      priority: options?.priority,
      jobId: options?.jobId,
    });
    this.logger.debug(`Added job ${job.id} to queue ${queueName}`);
    return job.id ?? '';
  }

  async addBulk<T>(
    queueName: QueueName,
    items: { data: T; options?: { delay?: number; jobId?: string } }[],
  ): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.addBulk(
      items.map((item) => ({
        name: queueName,
        data: item.data,
        opts: item.options,
      })),
    );
    this.logger.debug(`Added ${items.length} jobs to queue ${queueName}`);
  }

  async getQueueStatus(queueName: QueueName): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const queue = this.getQueue(queueName);
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);
    return { waiting, active, completed, failed, delayed };
  }

  async getQueueMetrics(queueName: QueueName): Promise<{
    jobsPerMinute: number;
    avgProcessTime: number;
    failureRate: number;
  }> {
    const queue = this.getQueue(queueName);
    const [completed, failed] = await Promise.all([
      queue.getCompletedCount(),
      queue.getFailedCount(),
    ]);
    const total = completed + failed;
    return {
      jobsPerMinute: 0,
      avgProcessTime: 0,
      failureRate: total > 0 ? (failed / total) * 100 : 0,
    };
  }
}
