import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointLog } from './entities/point-log.entity';
import { PointsEngineService } from './points-engine.service';
import { StreakService } from './streak.service';
import { StreakCronService } from './streak-cron.service';
import { PointsController } from './points.controller';
import { UsersModule } from '../users/users.module';
import { User } from '../users/entities/user.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([PointLog, User]), UsersModule],
  controllers: [PointsController],
  providers: [PointsEngineService, StreakService, StreakCronService],
  exports: [TypeOrmModule, PointsEngineService, StreakService],
})
export class PointsModule {}
