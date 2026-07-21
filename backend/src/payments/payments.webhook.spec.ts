import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { ConfigService as NestConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

describe('PaymentsService Webhook Signature', () => {
  let service: any; // Using any to bypass injection for just the signature test

  beforeEach(() => {
    // We only need verifyWebhookSignature, so we instantiate it manually or mock it
    service = new PaymentsService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { get: (key: string) => (key === 'WEBHOOK_SECRET' ? 'test_secret' : null) } as any,
      {} as any,
      {} as any,
    );
  });

  it('should correctly verify a valid webhook signature', () => {
    const payload = JSON.stringify({ event: 'payment.captured', amount: 1000 });
    const signature = crypto
      .createHmac('sha256', 'test_secret')
      .update(payload)
      .digest('hex');

    const isValid = service.verifyWebhookSignature(payload, signature);
    expect(isValid).toBe(true);
  });

  it('should reject an invalid webhook signature', () => {
    const payload = JSON.stringify({ event: 'payment.captured', amount: 1000 });
    const signature = 'invalid_signature_hash_1234567890abcdef1234567890abcdef12345678';

    const isValid = service.verifyWebhookSignature(payload, signature);
    expect(isValid).toBe(false);
  });
});
