import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUES } from '../queue.constants';
import { SmsService } from '../../sms/sms.service';

@Processor(QUEUES.OTP_SMS)
export class OtpSmsProcessor extends WorkerHost {
  constructor(private readonly smsService: SmsService) {
    super();
  }

  async process(
    job: Job<{ phoneNumber: string; code: string }>,
  ): Promise<void> {
    const { phoneNumber, code } = job.data;
    const message = `Dream Home 11 verification code: ${code}`;
    await this.smsService.sendSms(phoneNumber, message);
  }
}
