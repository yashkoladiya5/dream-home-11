import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { getMessaging } from 'firebase-admin/messaging';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QUEUES } from '../queue.constants';
import { FcmToken } from '../../notifications/entities/fcm-token.entity';
import { NotificationLog } from '../../notifications/entities/notification-log.entity';

@Processor(QUEUES.PUSH_NOTIFICATIONS)
export class PushNotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(PushNotificationsProcessor.name);

  constructor(
    @InjectRepository(FcmToken)
    private readonly fcmTokenRepo: Repository<FcmToken>,
    @InjectRepository(NotificationLog)
    private readonly notificationLogRepo: Repository<NotificationLog>,
  ) {
    super();
  }

  async process(
    job: Job<{
      userId: string;
      title: string;
      body: string;
      data?: Record<string, string>;
      type?: string;
    }>,
  ): Promise<void> {
    const { userId, title, body, data, type } = job.data;
    this.logger.log(`Sending push notification to user ${userId}: ${title}`);

    await this.notificationLogRepo.save(
      this.notificationLogRepo.create({
        userId,
        title,
        body,
        type: type || 'general',
        isRead: false,
      }),
    );

    const tokens = await this.fcmTokenRepo.find({
      where: { userId },
      select: { id: true, token: true },
    });

    if (tokens.length === 0) {
      this.logger.warn(`No FCM tokens found for user ${userId}`);
      return;
    }

    for (const fcmToken of tokens) {
      try {
        await getMessaging().send({
          notification: { title, body },
          token: fcmToken.token,
          data: { ...data, type: type || 'general' },
        });
      } catch (error: any) {
        this.logger.error(`FCM send failed for token ${fcmToken.id}: ${error.message}`);
      }
    }
  }
}
