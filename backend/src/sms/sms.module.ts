import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SmsService } from './sms.service';
import { TwilioSmsService } from './twilio-sms.service';

@Module({
  imports: [ConfigModule],
  providers: [SmsService, TwilioSmsService],
  exports: [SmsService, TwilioSmsService],
})
export class SmsModule {}
