import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { User } from '../users/entities/user.entity';
import { WalletService } from '../wallet/wallet.service';
import { ConfigService } from '../config/config.service';
import { createMockRepository, MockRepository } from '../test/mock-repository.factory';
import { createMockDataSource, createMockWalletService, createMockAppConfigService, createMockConfigService } from '../test/mock-services.factory';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let paymentRepo: MockRepository<Payment>;
  let userRepo: MockRepository<User>;
  let mockDataSource: ReturnType<typeof createMockDataSource>;
  let mockWalletService: ReturnType<typeof createMockWalletService>;
  let mockAppConfigService: ReturnType<typeof createMockAppConfigService>;
  let mockNestConfigService: ReturnType<typeof createMockConfigService>;

  const mockPayment: Payment = {
    id: 'payment-1',
    userId: 'user-1',
    orderId: 'ORD_1234567890_ABCD',
    amount: 500,
    status: 'pending',
    paymentMethod: 'razorpay',
    bonusPoints: 0,
    signature: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser: User = {
    id: 'user-1',
    phoneNumber: '+911234567890',
    email: null,
    fullName: 'Test User',
    avatarUrl: null,
    createdAt: new Date(),
    currentTier: 'bronze' as any,
    lifetimePoints: 0,
    weeklyPoints: 0,
    monthlyPoints: 0,
    walletBalanceInr: 1000,
    pointsBalance: 0,
    isActive: true,
    deviceId: 'device-1',
    referralCode: 'REF123',
    referredBy: null,
    currentStreak: 0,
    longestStreak: 0,
    lastStreakDate: null,
    state: null,
    bankAccountNumber: null,
    bankIfsc: null,
    bankName: null,
    upiId: null,
    role: 'user' as any,
    kyc: null,
    wallet: null,
  };

  beforeEach(async () => {
    paymentRepo = createMockRepository<Payment>();
    userRepo = createMockRepository<User>();
    mockDataSource = createMockDataSource();
    mockWalletService = createMockWalletService();
    mockAppConfigService = createMockAppConfigService();
    mockNestConfigService = createMockConfigService({ WEBHOOK_SECRET: 'test-webhook-secret' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: getRepositoryToken(Payment), useValue: paymentRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: DataSource, useValue: mockDataSource },
        { provide: NestConfigService, useValue: mockNestConfigService },
        { provide: ConfigService, useValue: mockAppConfigService },
        { provide: WalletService, useValue: mockWalletService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrder', () => {
    it('should create a payment order successfully', async () => {
      (paymentRepo.create as jest.Mock).mockReturnValue(mockPayment);
      (paymentRepo.save as jest.Mock).mockResolvedValue(mockPayment);

      const result = await service.createOrder('user-1', 500);
      expect(result.orderId).toContain('ORD_');
      expect(result.status).toBe('pending');
      expect(result.amount).toBe(500);
    });

    it('should throw BadRequestException for amount below minimum', async () => {
      await expect(service.createOrder('user-1', 5)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for amount above maximum', async () => {
      await expect(service.createOrder('user-1', 100000)).rejects.toThrow(BadRequestException);
    });
  });

  describe('calculateBonusPoints', () => {
    it('should return tier 3 bonus for high amounts', async () => {
      const points = await service.calculateBonusPoints(1000);
      expect(points).toBe(100);
    });

    it('should return tier 2 bonus for medium amounts', async () => {
      const points = await service.calculateBonusPoints(500);
      expect(points).toBe(50);
    });

    it('should return tier 1 bonus for low amounts', async () => {
      const points = await service.calculateBonusPoints(100);
      expect(points).toBe(10);
    });

    it('should return 0 for amounts below tier 1', async () => {
      const points = await service.calculateBonusPoints(50);
      expect(points).toBe(0);
    });
  });

  describe('verifyPayment', () => {
    it('should verify payment and credit wallet', async () => {
      const highAmountPayment = { ...mockPayment, amount: 1500 };
      const manager = {
        findOne: jest.fn().mockResolvedValue(highAmountPayment),
        save: jest.fn().mockResolvedValue({ ...highAmountPayment, status: 'completed' }),
        create: jest.fn().mockReturnValue({}),
      };
      mockDataSource.transaction.mockImplementation(async (cb: any) => {
        const result = await cb(manager);
        return result;
      });
      (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
      (userRepo.save as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.verifyPayment('user-1', 'ORD_1234567890_ABCD', 'pay_abc123');
      expect(result.payment.status).toBe('completed');
      expect(result.bonusPoints).toBe(100);
    });

    it('should throw NotFoundException when payment order not found', async () => {
      mockDataSource.transaction.mockImplementation(async (cb: any) => {
        const manager = { findOne: jest.fn().mockResolvedValue(null), save: jest.fn() };
        return cb(manager);
      });
      await expect(service.verifyPayment('user-1', 'invalid-order', 'pay_abc')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for mismatched user', async () => {
      const otherPayment = { ...mockPayment, userId: 'other-user' };
      mockDataSource.transaction.mockImplementation(async (cb: any) => {
        const manager = { findOne: jest.fn().mockResolvedValue(otherPayment), save: jest.fn() };
        return cb(manager);
      });
      await expect(service.verifyPayment('user-1', 'ORD_123', 'pay_abc')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when payment already processed', async () => {
      const processedPayment = { ...mockPayment, status: 'completed' };
      mockDataSource.transaction.mockImplementation(async (cb: any) => {
        const manager = { findOne: jest.fn().mockResolvedValue(processedPayment), save: jest.fn() };
        return cb(manager);
      });
      await expect(service.verifyPayment('user-1', 'ORD_123', 'pay_abc')).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should return true for valid signature', () => {
      const payload = 'order_id|payment_id|500|completed';
      const signature = require('crypto')
        .createHmac('sha256', 'test-webhook-secret')
        .update(payload)
        .digest('hex');
      expect(service.verifyWebhookSignature(payload, signature)).toBe(true);
    });

    it('should return false for empty signature', () => {
      expect(service.verifyWebhookSignature('payload', '')).toBe(false);
    });

    it('should return false for mismatched signature', () => {
      expect(service.verifyWebhookSignature('payload', 'invalid-signature')).toBe(false);
    });
  });

  describe('handleWebhookEvent', () => {
    it('should process payment.captured event', async () => {
      const eventBody = { event: 'payment.captured', order_id: 'ORD_123', payment_id: 'pay_abc' };
      (paymentRepo.findOne as jest.Mock).mockResolvedValue(mockPayment);
      const managerSave = jest.fn().mockResolvedValue({});
      mockDataSource.transaction.mockImplementation(async (cb: any) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(mockPayment),
          save: managerSave,
          create: jest.fn().mockReturnValue({}),
        };
        return cb(manager);
      });

      await service.handleWebhookEvent(eventBody);
      expect(paymentRepo.findOne).toHaveBeenCalledWith({ where: { orderId: 'ORD_123' } });
      expect(managerSave).toHaveBeenCalled();
    });

    it('should ignore events without order_id', async () => {
      await service.handleWebhookEvent({ event: 'payment.captured' });
      expect(paymentRepo.findOne).not.toHaveBeenCalled();
    });

    it('should silently skip if payment not found or already processed', async () => {
      (paymentRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.handleWebhookEvent({ event: 'payment.captured', order_id: 'ORD_123', payment_id: 'pay_abc' })).resolves.toBeUndefined();
    });

    it('should ignore unknown event types', async () => {
      await service.handleWebhookEvent({ event: 'unknown.event' });
      expect(paymentRepo.findOne).not.toHaveBeenCalled();
    });
  });
});
