import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompensationLog } from './entities/compensation.entity';
import { CompensationService } from './compensation.service';
import { CompensationCronService } from './compensation.cron.service';
import { Contest } from '../contests/entities/contest.entity';
import { ContestMember } from '../contests/entities/contest-member.entity';
import { User } from '../users/entities/user.entity';
import { PointsModule } from '../points/points.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CompensationLog, Contest, ContestMember, User]),
    PointsModule,
    NotificationsModule,
  ],
  providers: [CompensationService, CompensationCronService],
  exports: [CompensationService],
})
export class CompensationModule {}
