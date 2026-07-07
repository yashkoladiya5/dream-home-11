import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { QUEUES } from '../queue.constants';

@Processor(QUEUES.EMAIL)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  async process(
    job: Job<{
      to: string;
      subject: string;
      body: string;
      type?: string;
    }>,
  ): Promise<void> {
    const { to, subject, type } = job.data;
    this.logger.log(`Sending email to ${to}: ${subject} (${type || 'general'})`);

    this.logger.warn(`Email sending not configured — job ${job.id} acknowledged`);

    await job.updateProgress(100);
  }
}
