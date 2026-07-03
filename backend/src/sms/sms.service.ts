import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async sendSms(phoneNumber: string, message: string): Promise<void> {
    // Mock SMS implementation - follows existing pattern from auth.service.ts
    this.logger.log(`[Mock SMS] To: ${phoneNumber}, Message: ${message}`);

    try {
      // In production, integrate with Twilio or similar provider here
      // const twilioClient = require('twilio')(accountSid, authToken);
      // await twilioClient.messages.create({ body: message, from: '+1XXXXXXX', to: phoneNumber });
      this.logger.log(`[Mock SMS] Successfully sent to ${phoneNumber}`);
    } catch (error) {
      this.logger.error(
        `[Mock SMS] Failed to send to ${phoneNumber}: ${(error as Error).message}`,
      );
    }
  }

  async sendCompensationSms(
    phoneNumber: string,
    points: number,
    contestTitle: string,
  ): Promise<void> {
    const message = `Dream Home 11: You've received ${points} points as compensation for the cancelled contest "${contestTitle}". These points have been added to your account.`;
    await this.sendSms(phoneNumber, message);
  }
}
