import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SentryExceptionFilter } from './filters/sentry-exception.filter';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { SanitizePipe } from './pipes/sanitize.pipe';
import { PinoLoggerService } from './logger/pino-logger.service';
import { ShutdownHook } from './hooks/shutdown.hook';
import { CorrelationIdMiddleware } from './middleware/correlation-id.middleware';
import { RequestLoggingMiddleware } from './middleware/request-logging.middleware';
import { PoolConfigModule } from './database/pool-config.module';

@Global()
@Module({
  imports: [PoolConfigModule],
  providers: [
    SanitizePipe,
    PinoLoggerService,
    ShutdownHook,
    CorrelationIdMiddleware,
    RequestLoggingMiddleware,
    {
      provide: APP_FILTER,
      useClass: SentryExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
  exports: [SanitizePipe, PinoLoggerService, ShutdownHook, CorrelationIdMiddleware, RequestLoggingMiddleware],
})
export class CommonModule {}
