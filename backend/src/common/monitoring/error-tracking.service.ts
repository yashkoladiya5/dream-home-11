import { Injectable, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import client from 'prom-client';
import { requestContext } from '../middleware/request-id.middleware';

export interface ErrorContext {
  userId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  extra?: Record<string, unknown>;
}

export interface Breadcrumb {
  category: string;
  message: string;
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  data?: Record<string, unknown>;
}

@Injectable()
export class ErrorTrackingService {
  private readonly logger = new Logger(ErrorTrackingService.name);

  private readonly errorCounter: client.Counter<string>;
  private readonly errorByEndpoint: client.Counter<string>;
  private readonly errorByStatusCode: client.Counter<string>;
  private readonly sentryErrorCounter: client.Counter<string>;

  private readonly endpointErrorWindow = new Map<
    string,
    { count: number; windowStart: number }
  >();

  private static readonly WINDOW_DURATION_MS = 60_000;

  constructor() {
    this.errorCounter = new client.Counter({
      name: 'app_errors_total',
      help: 'Total number of application errors',
      labelNames: ['severity', 'type'],
    });

    this.errorByEndpoint = new client.Counter({
      name: 'app_errors_by_endpoint_total',
      help: 'Errors by endpoint',
      labelNames: ['method', 'endpoint', 'status_code'],
    });

    this.errorByStatusCode = new client.Counter({
      name: 'app_errors_by_status_total',
      help: 'Errors grouped by status code',
      labelNames: ['status_code'],
    });

    this.sentryErrorCounter = new client.Counter({
      name: 'sentry_events_total',
      help: 'Total Sentry events sent',
      labelNames: ['level', 'environment'],
    });
  }

  captureError(error: Error | unknown, context: ErrorContext = {}): string {
    const requestId =
      context.requestId || this.getRequestIdFromContext() || 'unknown';

    const errorObj =
      error instanceof Error ? error : new Error(String(error));
    const errorType = errorObj.constructor.name || 'UnknownError';

    this.logger.error(
      {
        requestId,
        endpoint: context.endpoint,
        method: context.method,
        statusCode: context.statusCode,
        userId: context.userId,
        errorType,
        stack: errorObj.stack,
      },
      `Error captured: ${errorObj.message}`,
    );

    this.errorCounter.labels('error', errorType).inc();

    if (context.endpoint && context.method && context.statusCode) {
      this.errorByEndpoint
        .labels(context.method, context.endpoint, context.statusCode.toString())
        .inc();
      this.errorByStatusCode
        .labels(context.statusCode.toString())
        .inc();
    }

    this.trackEndpointErrorRate(context.endpoint || 'unknown');

    const sentryId = Sentry.captureException(errorObj, (scope) => {
      scope.setTag('error_type', errorType);
      scope.setTag('request_id', requestId);

      if (context.userId) {
        scope.setUser({ id: context.userId });
      }
      if (context.endpoint) {
        scope.setTag('endpoint', `${context.method || 'UNKNOWN'} ${context.endpoint}`);
      }
      if (context.statusCode) {
        scope.setTag('status_code', context.statusCode.toString());
      }
      if (context.extra) {
        scope.setExtras(context.extra);
      }

      scope.setExtra('request_id', requestId);
      scope.setExtra('captured_at', new Date().toISOString());

      return scope;
    });

    const env = process.env.NODE_ENV || 'development';
    this.sentryErrorCounter.labels('error', env).inc();

    return sentryId;
  }

  captureMessage(
    message: string,
    level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'error',
    context: ErrorContext = {},
  ): string {
    const requestId =
      context.requestId || this.getRequestIdFromContext() || 'unknown';

    const logFn =
      level === 'fatal' || level === 'error'
        ? this.logger.error.bind(this.logger)
        : level === 'warning'
          ? this.logger.warn.bind(this.logger)
          : this.logger.log.bind(this.logger);

    logFn(
      {
        requestId,
        endpoint: context.endpoint,
        method: context.method,
        level,
      },
      `Message captured: ${message}`,
    );

    this.errorCounter.labels(level, 'message').inc();

    const sentryId = Sentry.captureMessage(message, (scope) => {
      scope.setLevel(level);
      scope.setTag('request_id', requestId);

      if (context.userId) {
        scope.setUser({ id: context.userId });
      }
      if (context.endpoint) {
        scope.setTag('endpoint', `${context.method || 'UNKNOWN'} ${context.endpoint}`);
      }
      if (context.extra) {
        scope.setExtras(context.extra);
      }

      return scope;
    });

    const env = process.env.NODE_ENV || 'development';
    this.sentryErrorCounter.labels(level, env).inc();

    return sentryId;
  }

  addBreadcrumb(breadcrumb: Breadcrumb): void {
    Sentry.addBreadcrumb({
      category: breadcrumb.category,
      message: breadcrumb.message,
      level: breadcrumb.level || 'info',
      data: breadcrumb.data,
      timestamp: Date.now() / 1000,
    });
  }

  captureHttpError(
    error: Error | unknown,
    method: string,
    url: string,
    statusCode: number,
    userId?: string,
  ): string {
    return this.captureError(error, {
      method,
      endpoint: url,
      statusCode,
      userId,
      extra: { source: 'http_handler' },
    });
  }

  captureDatabaseError(
    error: Error | unknown,
    queryType: string,
    durationMs: number,
  ): string {
    return this.captureError(error, {
      endpoint: `db:${queryType}`,
      method: 'QUERY',
      statusCode: 500,
      extra: { queryType, durationMs, source: 'database' },
    });
  }

  private trackEndpointErrorRate(endpoint: string): void {
    const now = Date.now();
    const existing = this.endpointErrorWindow.get(endpoint);

    if (!existing || now - existing.windowStart > ErrorTrackingService.WINDOW_DURATION_MS) {
      this.endpointErrorWindow.set(endpoint, {
        count: 1,
        windowStart: now,
      });
      return;
    }

    existing.count++;

    if (existing.count > 100) {
      this.logger.warn(
        {
          endpoint,
          errorCount: existing.count,
          windowSeconds: ErrorTrackingService.WINDOW_DURATION_MS / 1000,
        },
        `High error rate detected for endpoint: ${endpoint}`,
      );
    }
  }

  private getRequestIdFromContext(): string | undefined {
    try {
      const store = requestContext.getStore();
      return store?.get('requestId');
    } catch {
      return undefined;
    }
  }

  flush(): Promise<boolean> {
    return Sentry.flush(2000);
  }
}
