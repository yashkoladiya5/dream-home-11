import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointLog } from './entities/point-log.entity';
import { PointsEngineService } from './points-engine.service';
import { PointsController } from './points.controller';
import { UsersModule } from '../users/users.module';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([PointLog]), UsersModule],
  controllers: [PointsController],
  providers: [PointsEngineService],
  exports: [TypeOrmModule, PointsEngineService],
})
export class PointsModule {}
