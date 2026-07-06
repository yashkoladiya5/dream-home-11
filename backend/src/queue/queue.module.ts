import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { QUEUES, DEFAULT_QUEUE_OPTS } from './queue.constants';
import { QueueService } from './queue.service';
import { PrizeDistributionProcessor } from './processors/prize-distribution.processor';
import { OtpSmsProcessor } from './processors/otp-sms.processor';

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
    BullModule.registerQueue(
      ...Object.values(QUEUES).map((name) => ({ name })),
    ),
  ],
  providers: [QueueService, PrizeDistributionProcessor, OtpSmsProcessor],
  exports: [BullModule, QueueService],
})
export class QueueModule {}
