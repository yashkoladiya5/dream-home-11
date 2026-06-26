import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContestMember } from '../contests/entities/contest-member.entity';
import { Contest } from '../contests/entities/contest.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { LeaderboardRedisService } from './leaderboard-redis.service';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardSyncService } from './leaderboard-sync.service';

@Module({
  imports: [TypeOrmModule.forFeature([ContestMember, Contest, User]), UsersModule],
  providers: [LeaderboardRedisService, LeaderboardSyncService],
  controllers: [LeaderboardController],
  exports: [LeaderboardRedisService],
})
export class LeaderboardModule {}
