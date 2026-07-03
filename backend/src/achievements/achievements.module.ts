import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AchievementsController } from './achievements.controller';
import { AchievementsService } from './achievements.service';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';
import { ContestMember } from '../contests/entities/contest-member.entity';
import { Share } from '../share-tracker/entities/share.entity';
import { RewardRedemption } from '../rewards/entities/reward-redemption.entity';
import { User } from '../users/entities/user.entity';
import { PointsModule } from '../points/points.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Achievement,
      UserAchievement,
      User,
      ContestMember,
      Share,
      RewardRedemption,
    ]),
    PointsModule,
    UsersModule,
  ],
  controllers: [AchievementsController],
  providers: [AchievementsService],
  exports: [AchievementsService, TypeOrmModule],
})
export class AchievementsModule {}
