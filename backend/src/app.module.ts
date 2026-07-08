import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerBehindProxyGuard } from './common/guards/throttler-behind-proxy.guard';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';
import { CompressionMiddleware } from './common/middleware/compression.middleware';
import { EtagMiddleware } from './common/middleware/etag.middleware';
import { RequestSizeLimiterMiddleware } from './common/middleware/request-size-limiter.middleware';
import { BatchModule } from './common/controllers/batch.module';
import { HealthModule } from './health/health.module';
import { QueueModule } from './queue/queue.module';
import { User } from './users/entities/user.entity';
import { Kyc } from './kyc/entities/kyc.entity';
import { Contest } from './contests/entities/contest.entity';
import { ContestMember } from './contests/entities/contest-member.entity';
import { PointLog } from './points/entities/point-log.entity';
import { FcmToken } from './notifications/entities/fcm-token.entity';
import { Reminder } from './notifications/entities/reminder.entity';
import { NotificationLog } from './notifications/entities/notification-log.entity';
import { Share } from './share-tracker/entities/share.entity';
import { Reward } from './rewards/entities/reward.entity';
import { RewardRedemption } from './rewards/entities/reward-redemption.entity';
import { Banner } from './banners/entities/banner.entity';
import { BannersModule } from './banners/banners.module';
import { Achievement } from './achievements/entities/achievement.entity';
import { UserAchievement } from './achievements/entities/user-achievement.entity';
import { AchievementsModule } from './achievements/achievements.module';
import { RewardsModule } from './rewards/rewards.module';
import { PointsModule } from './points/points.module';
import { UsersModule } from './users/users.module';
import { KycModule } from './kyc/kyc.module';
import { AuthModule } from './auth/auth.module';
import { ContestsModule } from './contests/contests.module';
import { SeedModule } from './seed/seed.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrizeHome } from './prize-homes/entities/prize-home.entity';
import { PrizeHomesModule } from './prize-homes/prize-homes.module';
import { Transaction } from './transactions/entities/transaction.entity';
import { TransactionsModule } from './transactions/transactions.module';
import { RedisModule } from './redis/redis.module';
import { RedisThrottlerStorageService } from './redis/redis-throttler-storage.service';
import { ShareTrackerModule } from './share-tracker/share-tracker.module';
import { Payment } from './payments/entities/payment.entity';
import { PaymentsModule } from './payments/payments.module';
import { SavedPaymentMethod } from './payment-methods/entities/saved-payment-method.entity';
import { PaymentMethodsModule } from './payment-methods/payment-methods.module';
import { Withdrawal } from './withdrawals/entities/withdrawal.entity';
import { WithdrawalsModule } from './withdrawals/withdrawals.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { Post } from './feed/entities/post.entity';
import { Like } from './feed/entities/like.entity';
import { Comment } from './feed/entities/comment.entity';
import { FeedModule } from './feed/feed.module';
import { GamificationModule } from './gamification/gamification.module';
import { Poll } from './polls/entities/poll.entity';
import { PollVote } from './polls/entities/poll-vote.entity';
import { PollsModule } from './polls/polls.module';
import { Referral } from './referral/entities/referral.entity';
import { Chat } from './chat/entities/chat.entity';
import { ChatMessage } from './chat/entities/chat-message.entity';
import { ChatParticipant } from './chat/entities/chat-participant.entity';
import { ChatModule } from './chat/chat.module';
import { ReferralModule } from './referral/referral.module';
import { SupportTicket } from './support/entities/support-ticket.entity';
import { SupportModule } from './support/support.module';
import { CompensationLog } from './compensation/entities/compensation.entity';
import { AdminModule } from './admin/admin.module';
import { AppConfigModule } from './config/config.module';
import { SystemConfig } from './config/entities/system-config.entity';
import { CompensationModule } from './compensation/compensation.module';
import { SmsModule } from './sms/sms.module';
import { AuditLog } from './audit/entities/audit-log.entity';
import { AuditModule } from './audit/audit.module';
import { RefreshToken } from './auth/entities/refresh-token.entity';
import { Warning } from './admin/entities/warning.entity';
import { FraudAlert } from './admin/entities/fraud-alert.entity';
import { LeaderboardArchive } from './leaderboard/entities/leaderboard-archive.entity';
import { CommonModule } from './common/common.module';
import { MetricsModule } from './common/metrics/metrics.module';
import { Wallet } from './wallet/entities/wallet.entity';
import { WalletModule } from './wallet/wallet.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_DATABASE', 'dream_home_11'),
        entities: [
          User,
          Kyc,
          Contest,
          ContestMember,
          PointLog,
          FcmToken,
          Reminder,
          NotificationLog,
          Share,
          Reward,
          RewardRedemption,
          Banner,
          Achievement,
          UserAchievement,
          PrizeHome,
          Transaction,
          Payment,
          SavedPaymentMethod,
          Withdrawal,
          Post,
          Like,
          Comment,
          Poll,
          PollVote,
          Referral,
          SupportTicket,
          Chat,
          ChatMessage,
          ChatParticipant,
          SystemConfig,
          CompensationLog,
          AuditLog,
          RefreshToken,
          Warning,
          FraudAlert,
          LeaderboardArchive,
          Wallet,
        ],
        synchronize: config.get<string>('NODE_ENV') !== 'production',
        autoLoadEntities: false,
        keepConnectionAlive: true,
        retryAttempts: 10,
        retryDelay: 3000,
        logging: ['error', 'warn', 'schema'],
        maxQueryExecutionTime: 1000,
        applicationName: config.get<string>('APP_NAME', 'dream-home-11'),
        extra: {
          max: config.get<number>('DB_POOL_SIZE', 50),
          min: config.get<number>('DB_POOL_MIN', 5),
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        },
        poolErrorHandler: (err: Error) => {
          console.error('[DB Pool] Connection error:', err.message);
        },
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [RedisThrottlerStorageService],
      useFactory: (storage: RedisThrottlerStorageService) => ({
        throttlers: [
          {
            ttl: 60000,
            limit: process.env.NODE_ENV === 'production' ? 30 : 100000,
          },
        ],
        storage,
      }),
    }),
    ScheduleModule.forRoot(),
    UsersModule,
    KycModule,
    AuthModule,
    ContestsModule,
    PointsModule,
    RewardsModule,
    BannersModule,
    AchievementsModule,
    SeedModule,
    NotificationsModule,
    ShareTrackerModule,
    RedisModule,
    PrizeHomesModule,
    TransactionsModule,
    PaymentsModule,
    PaymentMethodsModule,
    WithdrawalsModule,
    LeaderboardModule,
    FeedModule,
    GamificationModule,
    PollsModule,
    SupportModule,
    ChatModule,
    ReferralModule,
    AdminModule,
    AppConfigModule,
    CompensationModule,
    AuditModule,
    SmsModule,
    CommonModule,
    HealthModule,
    MetricsModule,
    BatchModule,
    QueueModule,
    WalletModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        RequestIdMiddleware,
        CorrelationIdMiddleware,
        RequestLoggingMiddleware,
        CompressionMiddleware,
        EtagMiddleware,
        RequestSizeLimiterMiddleware,
      )
      .forRoutes('*');
  }
}
