import { Module } from '@nestjs/common';
import { PrometheusService } from './prometheus.service';
import { MetricsController } from './metrics.controller';

@Module({
  controllers: [MetricsController],
  providers: [PrometheusService],
  exports: [PrometheusService],
})
export class MetricsModule {}
