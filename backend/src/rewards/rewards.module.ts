import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';
import { Reward } from './entities/reward.entity';
import { RewardRedemption } from './entities/reward-redemption.entity';
import { PointsModule } from '../points/points.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reward, RewardRedemption]),
    PointsModule,
    UsersModule,
  ],
  controllers: [RewardsController],
  providers: [RewardsService],
  exports: [RewardsService, TypeOrmModule],
})
export class RewardsModule {}
