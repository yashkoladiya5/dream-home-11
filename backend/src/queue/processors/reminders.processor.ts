import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { getMessaging } from 'firebase-admin/messaging';
import { QUEUES } from '../queue.constants';
import { Reminder } from '../../notifications/entities/reminder.entity';
import { FcmToken } from '../../notifications/entities/fcm-token.entity';
import { NotificationLog } from '../../notifications/entities/notification-log.entity';

@Injectable()
@Processor(QUEUES.REMINDERS)
export class RemindersProcessor extends WorkerHost {
  private readonly logger = new Logger(RemindersProcessor.name);

  constructor(
    @InjectRepository(Reminder)
    private readonly reminderRepo: Repository<Reminder>,
    @InjectRepository(FcmToken)
    private readonly fcmTokenRepo: Repository<FcmToken>,
    @InjectRepository(NotificationLog)
    private readonly notificationLogRepo: Repository<NotificationLog>,
  ) {
    super();
  }

  async process(job: Job<{ reminderId?: string }>): Promise<void> {
    if (job.data.reminderId) {
      await this.processSingleReminder(job.data.reminderId);
    } else {
      await this.processDueReminders();
    }
  }

  private async processSingleReminder(reminderId: string): Promise<void> {
    const reminder = await this.reminderRepo.findOne({
      where: { id: reminderId },
      relations: { contest: true },
    });

    if (!reminder || reminder.status !== 'pending') return;

    await this.sendReminder(reminder);
  }

  private async processDueReminders(): Promise<void> {
    const dueReminders = await this.reminderRepo.find({
      where: {
        remindAt: LessThanOrEqual(new Date()),
        status: 'pending',
      },
    });

    for (const reminder of dueReminders) {
      await this.sendReminder(reminder);
    }
  }

  private async sendReminder(reminder: Reminder): Promise<void> {
    const contestTitle = reminder.contest?.title || 'your contest';

    await this.notificationLogRepo.save(
      this.notificationLogRepo.create({
        userId: reminder.userId,
        title: 'Contest Reminder',
        body: `${contestTitle} is starting soon!`,
        type: 'contest_reminder',
        isRead: false,
      }),
    );

    const tokens = await this.fcmTokenRepo.find({
      where: { userId: reminder.userId },
      select: { id: true, token: true },
    });

    for (const fcmToken of tokens) {
      try {
        await getMessaging().send({
          notification: {
            title: 'Contest Reminder',
            body: `${contestTitle} is starting soon!`,
          },
          token: fcmToken.token,
          data: { contestId: reminder.contestId, type: 'contest_reminder' },
        });
      } catch (error: any) {
        this.logger.error(`FCM send failed for token ${fcmToken.id}: ${error.message}`);
      }
    }

    reminder.status = 'sent';
    await this.reminderRepo.save(reminder);

    this.logger.log(`Reminder ${reminder.id} sent for contest ${reminder.contestId}`);
  }
}
