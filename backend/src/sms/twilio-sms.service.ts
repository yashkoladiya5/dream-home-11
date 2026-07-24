import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const twilio = require('twilio');

@Injectable()
export class TwilioSmsService {
  private readonly logger = new Logger(TwilioSmsService.name);
  private readonly client: any = null;
  private readonly fromNumber: string;
  private readonly useMock: boolean;

  constructor(private readonly configService: ConfigService) {
    this.fromNumber =
      this.configService.get<string>('TWILIO_PHONE_NUMBER') || '';
    this.useMock = this.configService.get<string>('SMS_PROVIDER') !== 'twilio';

    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');

    if (!this.useMock && accountSid && authToken) {
      this.client = twilio(accountSid, authToken);
      this.logger.log('Twilio SMS client initialized');
    } else {
      this.logger.warn(
        'Twilio credentials not configured — falling back to mock SMS',
      );
    }
  }

  async sendSms(phoneNumber: string, message: string): Promise<void> {
    if (this.useMock || !this.client) {
      this.logger.log(
        `[Mock Twilio SMS] To: ${phoneNumber}, Message: ${message}`,
      );
      return;
    }

    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: phoneNumber,
      });
      this.logger.log(`Twilio SMS sent to ${phoneNumber}: sid=${result.sid}`);
    } catch (error) {
      this.logger.error(
        `Twilio SMS failed to ${phoneNumber}: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async sendVerificationSms(phoneNumber: string, code: string): Promise<void> {
    const message = `Dream Home 11 verification code: ${code}`;
    await this.sendSms(phoneNumber, message);
  }
}
