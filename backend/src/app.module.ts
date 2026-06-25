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
import { ShareTrackerModule } from './share-tracker/share-tracker.module';

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
        entities: [User, Kyc, Contest, ContestMember, PointLog, FcmToken, Reminder, Share, Reward, RewardRedemption, Banner, Achievement, UserAchievement, PrizeHome, Transaction],
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
    PrizeHomesModule,
    TransactionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
