import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './users/entities/user.entity';
import { Kyc } from './kyc/entities/kyc.entity';
import { Contest } from './contests/entities/contest.entity';
import { ContestMember } from './contests/entities/contest-member.entity';
import { PointLog } from './points/entities/point-log.entity';
import { FcmToken } from './notifications/entities/fcm-token.entity';
import { Reminder } from './notifications/entities/reminder.entity';
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
        entities: [User, Kyc, Contest, ContestMember, PointLog, FcmToken, Reminder, Share, Reward, RewardRedemption, Banner, Achievement, UserAchievement, PrizeHome, Transaction, Payment, SavedPaymentMethod, Withdrawal, Post, Like, Comment, Poll, PollVote],
        synchronize: config.get<string>('NODE_ENV') !== 'production',
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
