import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Contest } from './entities/contest.entity';
import { ContestMember } from './entities/contest-member.entity';
import { ContestsService } from './contests.service';
import { ContestsController } from './contests.controller';
import { ContestsGateway } from './contests.gateway';
import { ContestSchedulerService } from './contest-scheduler.service';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { QUEUES } from '../queue/queue.constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contest, ContestMember]),
    BullModule.registerQueue({ name: QUEUES.PRIZE_DISTRIBUTION }),
    UsersModule,
    AuthModule,
  ],
  providers: [ContestsService, ContestsGateway, ContestSchedulerService],
  controllers: [ContestsController],
  exports: [TypeOrmModule, ContestsService, ContestsGateway],
})
export class ContestsModule {}
