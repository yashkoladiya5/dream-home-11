import { ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.constants';
import * as os from 'os';

@SkipThrottle()
@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly startTime: number;
  private readonly version: string;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {
    this.startTime = Date.now();
    this.version = process.env.npm_package_version || '1.0.0';
  }

  @Get()
  async check() {
    try {
      await Promise.all([this.dataSource.query('SELECT 1'), this.redis.ping()]);
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          timestamp: new Date().toISOString(),
          message: 'Health check failed',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get('ready')
  async ready() {
    const start = Date.now();
    const checks: Record<string, any>[] = [];

    const dbEntry = {
      componentId: 'database',
      componentType: 'datastore',
      observedValue: 'SELECT 1',
      observedUnit: 'query',
      time: new Date().toISOString(),
    };
    try {
      await Promise.race([
        this.dataSource.query('SELECT 1'),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Database timeout after 5s')),
            5000,
          ),
        ),
      ]);
      dbEntry['status'] = 'pass';
    } catch (err) {
      dbEntry['status'] = 'fail';
      dbEntry['output'] = (err as Error).message;
    }
    checks.push(dbEntry);

    const redisEntry = {
      componentId: 'redis',
      componentType: 'datastore',
      observedValue: 'PING',
      observedUnit: 'command',
      time: new Date().toISOString(),
    };
    try {
      await Promise.race([
        this.redis.ping(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Redis timeout after 3s')), 3000),
        ),
      ]);
      redisEntry['status'] = 'pass';
    } catch (err) {
      redisEntry['status'] = 'fail';
      redisEntry['output'] = (err as Error).message;
    }
    checks.push(redisEntry);

    const allPass = checks.every((c) => c.status === 'pass');
    const status = allPass ? 'ok' : 'degraded';

    return {
      status,
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - start,
      checks,
    };
  }

  @Get('live')
  live() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      duration_ms: 0,
    };
  }

  @Get('detailed')
  async detailed(@Headers('x-health-key') healthKey: string) {
    const expectedKey = process.env.HEALTH_SECRET;
    if (expectedKey && healthKey !== expectedKey) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    const start = Date.now();
    const checks: Record<string, any>[] = [];

    const dbEntry = {
      componentId: 'database',
      componentType: 'datastore',
      observedValue: 'SELECT 1',
      observedUnit: 'query',
      time: new Date().toISOString(),
    };
    try {
      await Promise.race([
        this.dataSource.query('SELECT 1'),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Database timeout after 5s')),
            5000,
          ),
        ),
      ]);
      dbEntry['status'] = 'pass';
    } catch (err) {
      dbEntry['status'] = 'fail';
      dbEntry['output'] = (err as Error).message;
    }
    checks.push(dbEntry);

    const redisEntry = {
      componentId: 'redis',
      componentType: 'datastore',
      observedValue: 'PING',
      observedUnit: 'command',
      time: new Date().toISOString(),
    };
    try {
      await Promise.race([
        this.redis.ping(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Redis timeout after 3s')), 3000),
        ),
      ]);
      redisEntry['status'] = 'pass';
    } catch (err) {
      redisEntry['status'] = 'fail';
      redisEntry['output'] = (err as Error).message;
    }
    checks.push(redisEntry);

    const mem = process.memoryUsage();
    const memEntry = {
      componentId: 'memory',
      componentType: 'system',
      status: 'pass',
      observedValue: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
      observedUnit: 'MB',
      time: new Date().toISOString(),
    };
    checks.push(memEntry);

    const diskEntry = {
      componentId: 'disk',
      componentType: 'system',
      status: 'pass',
      observedValue: 'N/A',
      observedUnit: 'MB',
      time: new Date().toISOString(),
    };
    checks.push(diskEntry);

    const allPass = checks.every((c) => c.status === 'pass');
    const status = allPass ? 'ok' : 'degraded';

    return {
      status,
      version: this.version,
      releaseId: this.version,
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - start,
      uptime: process.uptime(),
      hostname: os.hostname(),
      processId: process.pid,
      memory: {
        rss: mem.rss,
        heapTotal: mem.heapTotal,
        heapUsed: mem.heapUsed,
        external: mem.external,
      },
      cpu: process.cpuUsage(),
      checks,
    };
  }
}
