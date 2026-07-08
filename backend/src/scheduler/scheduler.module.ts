import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contest } from '../contests/entities/contest.entity';
import { ContestsModule } from '../contests/contests.module';
import { ContestSchedulerService } from './contest-scheduler.service';

@Module({
  imports: [TypeOrmModule.forFeature([Contest]), ContestsModule],
  providers: [ContestSchedulerService],
})
export class SchedulerModule {}
