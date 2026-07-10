import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contest } from '../contests/entities/contest.entity';
import { User } from '../users/entities/user.entity';
import { Kyc } from '../kyc/entities/kyc.entity';
import { ContestsModule } from '../contests/contests.module';
import { ContestSchedulerService } from './contest-scheduler.service';
import { DataRetentionService } from './data-retention.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contest, User, Kyc]),
    ContestsModule,
  ],
  providers: [ContestSchedulerService, DataRetentionService],
})
export class SchedulerModule {}
