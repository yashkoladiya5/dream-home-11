import { Injectable } from '@nestjs/common';
import client from 'prom-client';

@Injectable()
export class PrometheusService {
  private readonly httpRequestsTotal: client.Counter<string>;
  private readonly httpRequestDuration: client.Histogram<string>;
  private readonly dbQueryDuration: client.Histogram<string>;
  private readonly usersRegisteredTotal: client.Counter<string>;
  private readonly contestsJoinedTotal: client.Counter<string>;
  private readonly activeConnections: client.Gauge<string>;
  private readonly pointsAwardedTotal: client.Counter<string>;

  constructor() {
    client.collectDefaultMetrics();

    this.httpRequestsTotal = new client.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status'],
    });

    this.httpRequestDuration = new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'path'],
      buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    });

    this.dbQueryDuration = new client.Histogram({
      name: 'db_query_duration_seconds',
      help: 'Database query duration in seconds',
      labelNames: ['query_type'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
    });

    this.usersRegisteredTotal = new client.Counter({
      name: 'users_registered_total',
      help: 'Total number of registered users',
    });

    this.contestsJoinedTotal = new client.Counter({
      name: 'contests_joined_total',
      help: 'Total number of contest joins',
    });

    this.activeConnections = new client.Gauge({
      name: 'active_connections',
      help: 'Number of active WebSocket connections',
    });

    this.pointsAwardedTotal = new client.Counter({
      name: 'points_awarded_total',
      help: 'Total number of points awarded',
    });
  }

  incrementHttpRequests(method: string, path: string, status: number): void {
    this.httpRequestsTotal.labels(method, path, status.toString()).inc();
  }

  observeHttpDuration(method: string, path: string, durationMs: number): void {
    this.httpRequestDuration.labels(method, path).observe(durationMs / 1000);
  }

  observeDbQuery(queryType: string, durationMs: number): void {
    this.dbQueryDuration.labels(queryType).observe(durationMs / 1000);
  }

  incrementUsersRegistered(): void {
    this.usersRegisteredTotal.inc();
  }

  incrementContestsJoined(): void {
    this.contestsJoinedTotal.inc();
  }

  setActiveConnections(count: number): void {
    this.activeConnections.set(count);
  }

  incrementPointsAwarded(points: number): void {
    this.pointsAwardedTotal.inc(points);
  }

  get metrics(): Promise<string> {
    return client.register.metrics();
  }
}
