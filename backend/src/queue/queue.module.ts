import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QUEUES, DEFAULT_QUEUE_OPTS } from './queue.constants';
import { FcmToken } from '../notifications/entities/fcm-token.entity';
import { NotificationLog } from '../notifications/entities/notification-log.entity';
import { Reminder } from '../notifications/entities/reminder.entity';
import { QueueService } from './queue.service';
import { PrizeDistributionProcessor } from './processors/prize-distribution.processor';
import { OtpSmsProcessor } from './processors/otp-sms.processor';
import { PushNotificationsProcessor } from './processors/push-notifications.processor';
import { EmailProcessor } from './processors/email.processor';
import { SettlementProcessor } from './processors/settlement.processor';
import { RemindersProcessor } from './processors/reminders.processor';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          maxRetriesPerRequest: 3,
          retryStrategy: (times: number) => {
            if (times > 5) return null;
            return Math.min(times * 200, 3000);
          },
        },
        defaultJobOptions: DEFAULT_QUEUE_OPTS.defaultJobOptions,
      }),
    }),
    TypeOrmModule.forFeature([FcmToken, NotificationLog, Reminder]),
    BullModule.registerQueue(
      ...Object.values(QUEUES).map((name) => ({ name })),
    ),
  ],
  providers: [
    QueueService,
    PrizeDistributionProcessor,
    OtpSmsProcessor,
    PushNotificationsProcessor,
    EmailProcessor,
    SettlementProcessor,
    RemindersProcessor,
  ],
  exports: [BullModule, QueueService],
})
export class QueueModule {}
