import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import client from 'prom-client';
import * as os from 'os';
import Redis from 'ioredis';

export interface HealthThresholds {
  cpuUsagePercent: number;
  memoryUsagePercent: number;
  redisMemoryUsagePercent: number;
  dbPoolUsagePercent: number;
}

export interface HealthStatus {
  cpu: HealthComponentStatus;
  memory: HealthComponentStatus;
  redis: HealthComponentStatus;
  database: HealthComponentStatus;
  overall: 'healthy' | 'degraded' | 'unhealthy';
  checkedAt: string;
}

export interface HealthComponentStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  value: number;
  threshold: number;
  message?: string;
}

@Injectable()
export class HealthMetricsService implements OnModuleDestroy {
  private readonly logger = new Logger(HealthMetricsService.name);

  private readonly cpuUsageGauge: client.Gauge<string>;
  private readonly memoryUsageGauge: client.Gauge<string>;
  private readonly memoryTotalGauge: client.Gauge<string>;
  private readonly redisMemoryGauge: client.Gauge<string>;
  private readonly dbPoolUsageGauge: client.Gauge<string>;
  private readonly dbPoolActiveGauge: client.Gauge<string>;
  private readonly dbPoolIdleGauge: client.Gauge<string>;
  private readonly healthCheckStatus: client.Gauge<string>;
  private readonly uptimeGauge: client.Gauge<string>;

  private healthCheckInterval: ReturnType<typeof setInterval> | null = null;
  private readonly startTime = Date.now();
  private readonly gaugeValues: Record<string, number> = {};

  private readonly thresholds: HealthThresholds = {
    cpuUsagePercent: parseFloat(
      process.env.HEALTH_CPU_THRESHOLD || '85',
    ),
    memoryUsagePercent: parseFloat(
      process.env.HEALTH_MEMORY_THRESHOLD || '85',
    ),
    redisMemoryUsagePercent: parseFloat(
      process.env.HEALTH_REDIS_MEMORY_THRESHOLD || '80',
    ),
    dbPoolUsagePercent: parseFloat(
      process.env.HEALTH_DB_POOL_THRESHOLD || '80',
    ),
  };

  constructor() {
    this.cpuUsageGauge = new client.Gauge({
      name: 'health_cpu_usage_percent',
      help: 'Current CPU usage percentage',
    });

    this.memoryUsageGauge = new client.Gauge({
      name: 'health_memory_usage_percent',
      help: 'Current memory usage percentage',
    });

    this.memoryTotalGauge = new client.Gauge({
      name: 'health_memory_total_bytes',
      help: 'Total system memory in bytes',
    });

    this.redisMemoryGauge = new client.Gauge({
      name: 'health_redis_memory_usage_percent',
      help: 'Redis memory usage percentage',
    });

    this.dbPoolUsageGauge = new client.Gauge({
      name: 'health_db_pool_usage_percent',
      help: 'Database connection pool usage percentage',
    });

    this.dbPoolActiveGauge = new client.Gauge({
      name: 'health_db_pool_active_connections',
      help: 'Number of active database connections',
    });

    this.dbPoolIdleGauge = new client.Gauge({
      name: 'health_db_pool_idle_connections',
      help: 'Number of idle database connections',
    });

    this.healthCheckStatus = new client.Gauge({
      name: 'health_check_status',
      help: 'Overall health check status (1=healthy, 0.5=degraded, 0=unhealthy)',
      labelNames: ['component'],
    });

    this.uptimeGauge = new client.Gauge({
      name: 'app_uptime_seconds',
      help: 'Application uptime in seconds',
    });

    this.startPeriodicChecks();
  }

  private startPeriodicChecks(): void {
    const intervalMs = parseInt(
      process.env.HEALTH_CHECK_INTERVAL_MS || '30000',
      10,
    );

    this.healthCheckInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);

    this.logger.log(
      `Health metrics collection started with ${intervalMs / 1000}s interval`,
    );
  }

  private collectMetrics(): void {
    this.collectCpuMetrics();
    this.collectMemoryMetrics();
    this.collectUptime();

    this.collectRedisMetrics().catch(() => {
      this.logger.debug('Redis metrics collection skipped (not configured)');
    });

    this.collectDbPoolMetrics().catch(() => {
      this.logger.debug(
        'Database pool metrics collection skipped (not configured)',
      );
    });
  }

  private collectCpuMetrics(): void {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    for (const cpu of cpus) {
      for (const type of Object.keys(cpu.times) as Array<
        keyof os.CpuInfo['times']
      >) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    }

    const idlePercent = (totalIdle / totalTick) * 100;
    const usagePercent = 100 - idlePercent;

    this.cpuUsageGauge.set(usagePercent);
    this.gaugeValues['cpu'] = usagePercent;

    if (usagePercent > this.thresholds.cpuUsagePercent) {
      this.logger.warn(
        {
          cpuUsage: usagePercent.toFixed(2),
          threshold: this.thresholds.cpuUsagePercent,
        },
        'CPU usage exceeds threshold',
      );
    }

    this.healthCheckStatus
      .labels('cpu')
      .set(
        usagePercent > this.thresholds.cpuUsagePercent
          ? 0
          : usagePercent > this.thresholds.cpuUsagePercent * 0.8
            ? 0.5
            : 1,
      );
  }

  private collectMemoryMetrics(): void {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const usagePercent = (usedMem / totalMem) * 100;

    this.memoryUsageGauge.set(usagePercent);
    this.memoryTotalGauge.set(totalMem);
    this.gaugeValues['memory'] = usagePercent;

    if (usagePercent > this.thresholds.memoryUsagePercent) {
      this.logger.warn(
        {
          memoryUsage: usagePercent.toFixed(2),
          totalMB: (totalMem / 1024 / 1024).toFixed(0),
          usedMB: (usedMem / 1024 / 1024).toFixed(0),
          threshold: this.thresholds.memoryUsagePercent,
        },
        'Memory usage exceeds threshold',
      );
    }

    this.healthCheckStatus
      .labels('memory')
      .set(
        usagePercent > this.thresholds.memoryUsagePercent
          ? 0
          : usagePercent > this.thresholds.memoryUsagePercent * 0.8
            ? 0.5
            : 1,
      );
  }

  private collectUptime(): void {
    const uptimeSeconds = (Date.now() - this.startTime) / 1000;
    this.uptimeGauge.set(uptimeSeconds);
  }

  private async collectRedisMetrics(): Promise<void> {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) return;

    let redis: Redis | null = null;
    try {
      redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        lazyConnect: true,
      });

      await redis.connect();
      const info = await redis.info('memory');
      await redis.quit().catch(() => {});

      const usedMemory = this.parseRedisInfo(info, 'used_memory');
      const maxMemory = this.parseRedisInfo(info, 'maxmemory');

      if (maxMemory > 0) {
        const usagePercent = (usedMemory / maxMemory) * 100;
        this.redisMemoryGauge.set(usagePercent);
        this.gaugeValues['redis'] = usagePercent;

        if (usagePercent > this.thresholds.redisMemoryUsagePercent) {
          this.logger.warn(
            {
              redisMemoryUsage: usagePercent.toFixed(2),
              usedMB: (usedMemory / 1024 / 1024).toFixed(0),
              maxMB: (maxMemory / 1024 / 1024).toFixed(0),
              threshold: this.thresholds.redisMemoryUsagePercent,
            },
            'Redis memory usage exceeds threshold',
          );
        }

        this.healthCheckStatus
          .labels('redis')
          .set(
            usagePercent > this.thresholds.redisMemoryUsagePercent
              ? 0
              : usagePercent > this.thresholds.redisMemoryUsagePercent * 0.8
                ? 0.5
                : 1,
          );
      }
    } catch {
      if (redis) await redis.quit().catch(() => {});
      this.healthCheckStatus.labels('redis').set(0.5);
    }
  }

  private async collectDbPoolMetrics(): Promise<void> {
    const dbHost = process.env.DB_HOST;
    if (!dbHost) return;

    try {
      const { default: pg } = await import('pg');
      const client = new pg.Client({
        host: dbHost,
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        connectionTimeoutMillis: 2000,
      });

      await client.connect();

      const result = await client.query(`
        SELECT
          count(*) as active,
          (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_conn
        FROM pg_stat_activity
        WHERE state = 'active'
      `);

      await client.end();

      const active = parseInt(result.rows[0].active, 10);
      const maxConn = parseInt(result.rows[0].max_conn, 10);
      const usagePercent = (active / maxConn) * 100;

      this.dbPoolUsageGauge.set(usagePercent);
      this.dbPoolActiveGauge.set(active);
      this.dbPoolIdleGauge.set(maxConn - active);
      this.gaugeValues['database'] = usagePercent;

      if (usagePercent > this.thresholds.dbPoolUsagePercent) {
        this.logger.warn(
          {
            dbPoolUsage: usagePercent.toFixed(2),
            activeConnections: active,
            maxConnections: maxConn,
            threshold: this.thresholds.dbPoolUsagePercent,
          },
          'Database pool usage exceeds threshold',
        );
      }

      this.healthCheckStatus
        .labels('database')
        .set(
          usagePercent > this.thresholds.dbPoolUsagePercent
            ? 0
            : usagePercent > this.thresholds.dbPoolUsagePercent * 0.8
              ? 0.5
              : 1,
        );
    } catch {
      this.healthCheckStatus.labels('database').set(0.5);
    }
  }

  private parseRedisInfo(info: string, key: string): number {
    const match = info.match(new RegExp(`${key}:(\\d+)`));
    return match ? parseInt(match[1], 10) : 0;
  }

  async getHealthStatus(): Promise<HealthStatus> {
    this.collectMetrics();

    const components: Record<string, HealthComponentStatus> = {
      cpu: {
        status: this.getComponentStatus(this.gaugeValues['cpu'] || 0, this.thresholds.cpuUsagePercent),
        value: this.gaugeValues['cpu'] || 0,
        threshold: this.thresholds.cpuUsagePercent,
      },
      memory: {
        status: this.getComponentStatus(this.gaugeValues['memory'] || 0, this.thresholds.memoryUsagePercent),
        value: this.gaugeValues['memory'] || 0,
        threshold: this.thresholds.memoryUsagePercent,
      },
      redis: {
        status: this.getComponentStatus(this.gaugeValues['redis'] || 0, this.thresholds.redisMemoryUsagePercent),
        value: this.gaugeValues['redis'] || 0,
        threshold: this.thresholds.redisMemoryUsagePercent,
      },
      database: {
        status: this.getComponentStatus(this.gaugeValues['database'] || 0, this.thresholds.dbPoolUsagePercent),
        value: this.gaugeValues['database'] || 0,
        threshold: this.thresholds.dbPoolUsagePercent,
      },
    };

    const statuses = Object.values(components).map((c) => c.status);
    let overall: HealthStatus['overall'] = 'healthy';
    if (statuses.includes('unhealthy')) overall = 'unhealthy';
    else if (statuses.includes('degraded')) overall = 'degraded';

    return {
      ...components,
      overall,
      checkedAt: new Date().toISOString(),
    } as HealthStatus;
  }

  private getComponentStatus(
    value: number,
    threshold: number,
  ): 'healthy' | 'degraded' | 'unhealthy' {
    if (value > threshold) return 'unhealthy';
    if (value > threshold * 0.8) return 'degraded';
    return 'healthy';
  }

  onModuleDestroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      this.logger.log('Health metrics collection stopped');
    }
  }
}
