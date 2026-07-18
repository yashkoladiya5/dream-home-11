import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { QUEUES } from '../queue.constants';

@Processor(QUEUES.EMAIL)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    super();
    // Configure default transport (this should ideally be env-based in a real setup)
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async process(
    job: Job<{
      to: string;
      subject: string;
      body: string;
      type?: string;
    }>,
  ): Promise<void> {
    const { to, subject, body, type } = job.data;
    this.logger.log(`Sending email to ${to}: ${subject} (${type || 'general'})`);

    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"Dream Home 11" <noreply@dreamhome11.com>',
        to,
        subject,
        html: body,
      });

      this.logger.log(`Email sent: ${info.messageId}`);
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      throw error; // Rethrow to allow BullMQ to retry if configured
    }

    await job.updateProgress(100);
  }
}
