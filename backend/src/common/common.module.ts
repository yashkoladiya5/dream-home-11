import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { SentryExceptionFilter } from './filters/sentry-exception.filter';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { SanitizePipe } from './pipes/sanitize.pipe';
import { PinoLoggerService } from './logger/pino-logger.service';
import { ShutdownHook } from './hooks/shutdown.hook';
import { CorrelationIdMiddleware } from './middleware/correlation-id.middleware';
import { RequestLoggingMiddleware } from './middleware/request-logging.middleware';
import { PoolConfigModule } from './database/pool-config.module';
import { CacheInterceptor } from './interceptors/cache.interceptor';
import { QueryOptimizerService } from './database/query-optimizer.service';
import { AuditLogModule } from './audit/audit-log.module';

@Global()
@Module({
  imports: [PoolConfigModule, AuditLogModule],
  providers: [
    SanitizePipe,
    PinoLoggerService,
    ShutdownHook,
    CorrelationIdMiddleware,
    RequestLoggingMiddleware,
    QueryOptimizerService,
    {
      provide: APP_FILTER,
      useClass: SentryExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
  exports: [
    SanitizePipe,
    PinoLoggerService,
    ShutdownHook,
    CorrelationIdMiddleware,
    RequestLoggingMiddleware,
    QueryOptimizerService,
    AuditLogModule,
  ],
})
export class CommonModule {}
