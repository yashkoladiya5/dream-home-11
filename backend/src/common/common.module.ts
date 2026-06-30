import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './filters/http-exception.filter';
import { SanitizePipe } from './pipes/sanitize.pipe';

@Global()
@Module({
  providers: [
    SanitizePipe,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
  exports: [SanitizePipe],
})
export class CommonModule {}
