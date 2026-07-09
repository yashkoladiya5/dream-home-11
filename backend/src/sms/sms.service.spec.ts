/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { SmsService } from './sms.service';

describe('SmsService', () => {
  let service: SmsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SmsService],
    }).compile();

    service = module.get<SmsService>(SmsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendSms', () => {
    it('should send an SMS without throwing', async () => {
      await expect(
        service.sendSms('+919999999999', 'Test message'),
      ).resolves.not.toThrow();
    });

    it('should handle special characters in message', async () => {
      await expect(
        service.sendSms('+919999999999', 'Hello! Your OTP is 1234. Valid for 5 mins.'),
      ).resolves.not.toThrow();
    });

    it('should handle empty message gracefully', async () => {
      await expect(
        service.sendSms('+919999999999', ''),
      ).resolves.not.toThrow();
    });

    it('should handle international phone numbers', async () => {
      await expect(
        service.sendSms('+1234567890', 'Welcome!'),
      ).resolves.not.toThrow();
    });
  });

  describe('sendCompensationSms', () => {
    it('should send compensation SMS with points and contest title', async () => {
      await expect(
        service.sendCompensationSms('+919999999999', 100, 'Mega Contest'),
      ).resolves.not.toThrow();
    });

    it('should handle zero points compensation', async () => {
      await expect(
        service.sendCompensationSms('+919999999999', 0, 'Free Contest'),
      ).resolves.not.toThrow();
    });

    it('should handle large point values', async () => {
      await expect(
        service.sendCompensationSms('+919999999999', 999999, 'Grand Prize'),
      ).resolves.not.toThrow();
    });

    it('should handle special characters in contest title', async () => {
      await expect(
        service.sendCompensationSms('+919999999999', 50, 'Weekend $pecial! @Home'),
      ).resolves.not.toThrow();
    });
  });
});
