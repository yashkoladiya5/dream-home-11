/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentMethodsController } from './payment-methods.controller';
import { PaymentMethodsService } from './payment-methods.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('PaymentMethodsController', () => {
  let controller: PaymentMethodsController;

  const mockPaymentMethodsService = {
    getAvailableCategories: jest.fn(),
    findByUser: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser = { id: 'user-uuid', phoneNumber: '+919999999999' };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentMethodsController],
      providers: [
        { provide: PaymentMethodsService, useValue: mockPaymentMethodsService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PaymentMethodsController>(PaymentMethodsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCategories', () => {
    it('should return available categories', async () => {
      const categories = {
        categories: [
          { key: 'upi', label: 'UPI', icon: 'phone_android', description: 'Google Pay, PhonePe, Paytm UPI' },
        ],
      };
      mockPaymentMethodsService.getAvailableCategories.mockResolvedValue(categories);

      const result = await controller.getCategories();
      expect(result).toEqual(categories);
    });
  });

  describe('getAll', () => {
    it('should return payment methods for user without category filter', async () => {
      const methods = [{ id: 'pm-uuid', category: 'upi', label: 'My UPI' }];
      mockPaymentMethodsService.findByUser.mockResolvedValue(methods);

      const result = await controller.getAll(mockUser as any, undefined);
      expect(result).toEqual(methods);
      expect(mockPaymentMethodsService.findByUser).toHaveBeenCalledWith('user-uuid', undefined);
    });

    it('should return payment methods with category filter', async () => {
      const methods = [{ id: 'pm-uuid', category: 'card', label: 'HDFC Card' }];
      mockPaymentMethodsService.findByUser.mockResolvedValue(methods);

      const result = await controller.getAll(mockUser as any, 'card');
      expect(result).toEqual(methods);
      expect(mockPaymentMethodsService.findByUser).toHaveBeenCalledWith('user-uuid', 'card');
    });

    it('should return empty array when user has no methods', async () => {
      mockPaymentMethodsService.findByUser.mockResolvedValue([]);

      const result = await controller.getAll(mockUser as any, undefined);
      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create a new payment method', async () => {
      const body = { category: 'upi', label: 'My UPI', displayValue: 'user@paytm' };
      const created = { id: 'pm-uuid', userId: 'user-uuid', ...body };
      mockPaymentMethodsService.create.mockResolvedValue(created);

      const result = await controller.create(mockUser as any, body);
      expect(result).toEqual(created);
      expect(mockPaymentMethodsService.create).toHaveBeenCalledWith('user-uuid', body);
    });

    it('should pass providerName when provided', async () => {
      const body = {
        category: 'card',
        label: 'HDFC Card',
        displayValue: 'xxxx-xxxx-xxxx-1234',
        providerName: 'Visa',
      };
      mockPaymentMethodsService.create.mockResolvedValue({ id: 'pm-uuid', ...body });

      await controller.create(mockUser as any, body);
      expect(mockPaymentMethodsService.create).toHaveBeenCalledWith('user-uuid', body);
    });

    it('should propagate service errors for invalid category', async () => {
      const body = { category: 'invalid', label: 'Test', displayValue: 'test' };
      mockPaymentMethodsService.create.mockRejectedValue(new Error('Invalid category'));

      await expect(controller.create(mockUser as any, body)).rejects.toThrow('Invalid category');
    });
  });

  describe('remove', () => {
    it('should soft-delete a payment method', async () => {
      mockPaymentMethodsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockUser as any, 'pm-uuid');
      expect(result).toEqual({ success: true });
      expect(mockPaymentMethodsService.remove).toHaveBeenCalledWith('user-uuid', 'pm-uuid');
    });

    it('should propagate not found error', async () => {
      mockPaymentMethodsService.remove.mockRejectedValue(new Error('Payment method not found'));

      await expect(controller.remove(mockUser as any, 'nonexistent')).rejects.toThrow(
        'Payment method not found',
      );
    });
  });
});
