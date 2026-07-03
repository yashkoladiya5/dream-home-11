import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SentryExceptionFilter } from './filters/sentry-exception.filter';
import { SanitizePipe } from './pipes/sanitize.pipe';
import { PinoLoggerService } from './logger/pino-logger.service';

@Global()
@Module({
  providers: [
    SanitizePipe,
    PinoLoggerService,
    {
      provide: APP_FILTER,
      useClass: SentryExceptionFilter,
    },
  ],
  exports: [SanitizePipe, PinoLoggerService],
})
export class CommonModule {}
