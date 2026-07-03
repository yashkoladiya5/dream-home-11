import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PrometheusService } from './prometheus.service';

@Controller()
export class MetricsController {
  constructor(private readonly prometheusService: PrometheusService) {}

  @Get('metrics')
  async getMetrics(@Res() res: Response): Promise<void> {
    const metrics = await this.prometheusService.metrics;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(metrics);
  }
}
