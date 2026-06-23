import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointLog } from './entities/point-log.entity';
import { PointsEngineService } from './points-engine.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([PointLog])],
  providers: [PointsEngineService],
  exports: [TypeOrmModule, PointsEngineService],
})
export class PointsModule {}
