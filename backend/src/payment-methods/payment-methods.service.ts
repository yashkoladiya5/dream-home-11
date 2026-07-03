import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedPaymentMethod } from './entities/saved-payment-method.entity';

@Injectable()
export class PaymentMethodsService {
  constructor(
    @InjectRepository(SavedPaymentMethod)
    private readonly repo: Repository<SavedPaymentMethod>,
  ) {}

  async findByUser(
    userId: string,
    category?: string,
  ): Promise<SavedPaymentMethod[]> {
    const where: any = { userId, isActive: true };
    if (category) where.category = category;
    return this.repo.find({ where, order: { createdAt: 'DESC' } });
  }

  async create(
    userId: string,
    data: {
      category: string;
      label: string;
      displayValue: string;
      providerName?: string;
    },
  ): Promise<SavedPaymentMethod> {
    const validCategories = ['upi', 'card', 'net_banking', 'wallet'];
    if (!validCategories.includes(data.category)) {
      throw new BadRequestException(
        `Invalid category. Must be one of: ${validCategories.join(', ')}`,
      );
    }
    const method = this.repo.create({
      userId,
      category: data.category,
      label: data.label,
      displayValue: data.displayValue,
      providerName: data.providerName,
    });
    return this.repo.save(method);
  }

  async remove(userId: string, id: string): Promise<void> {
    const method = await this.repo.findOne({ where: { id, userId } });
    if (!method) throw new NotFoundException('Payment method not found');
    method.isActive = false;
    await this.repo.save(method);
  }

  async getAvailableCategories(): Promise<{
    categories: {
      key: string;
      label: string;
      icon: string;
      description: string;
    }[];
  }> {
    return {
      categories: [
        {
          key: 'upi',
          label: 'UPI',
          icon: 'phone_android',
          description: 'Google Pay, PhonePe, Paytm UPI',
        },
        {
          key: 'card',
          label: 'Credit / Debit Card',
          icon: 'credit_card',
          description: 'Visa, Mastercard, RuPay',
        },
        {
          key: 'net_banking',
          label: 'Net Banking',
          icon: 'account_balance',
          description: 'HDFC, SBI, ICICI & more',
        },
        {
          key: 'wallet',
          label: 'Wallets',
          icon: 'account_balance_wallet',
          description: 'Paytm, Freecharge, Mobikwik',
        },
      ],
    };
  }
}
