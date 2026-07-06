import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Reflector } from '@nestjs/core';
import { AppExceptionFilter } from './filters/app-exception.filter';
import { SanitizePipe } from './pipes/sanitize.pipe';
import { PinoLoggerService } from './logger/pino-logger.service';
import { ShutdownHook } from './hooks/shutdown.hook';
import { CorrelationIdMiddleware } from './middleware/correlation-id.middleware';
import { RequestLoggingMiddleware } from './middleware/request-logging.middleware';
import { PoolConfigModule } from './database/pool-config.module';
import { CacheInterceptor } from './interceptors/cache.interceptor';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { QueryOptimizerService } from './database/query-optimizer.service';
import { AuditLogModule } from './audit/audit-log.module';

@Global()
@Module({
  imports: [
    PoolConfigModule,
    AuditLogModule,
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true,
    }),
  ],
  providers: [
    SanitizePipe,
    PinoLoggerService,
    ShutdownHook,
    CorrelationIdMiddleware,
    RequestLoggingMiddleware,
    QueryOptimizerService,
    {
      provide: APP_FILTER,
      useClass: AppExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useFactory: (reflector: Reflector) => new TransformInterceptor(reflector),
      inject: [Reflector],
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
