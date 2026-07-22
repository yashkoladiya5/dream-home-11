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
import { WalletModule } from '../wallet/wallet.module';

import { AppConfigModule } from '../config/config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contest, ContestMember]),
    BullModule.registerQueue({ name: QUEUES.PRIZE_DISTRIBUTION }),
    UsersModule,
    AuthModule,
    WalletModule,
    AppConfigModule,
  ],
  providers: [ContestsService, ContestsGateway, ContestSchedulerService],
  controllers: [ContestsController],
  exports: [TypeOrmModule, ContestsService, ContestsGateway],
})
// Module for managing all contests, gateway, and schedulers
export class ContestsModule {}
