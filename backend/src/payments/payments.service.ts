import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Payment } from './entities/payment.entity';
import { User } from '../users/entities/user.entity';
import { Transaction } from '../transactions/entities/transaction.entity';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly webhookSecret: string;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    const secret = this.configService.get<string>('WEBHOOK_SECRET');
    if (!secret) {
      this.logger.error('WEBHOOK_SECRET environment variable is not set');
      throw new InternalServerErrorException('Payment service misconfigured');
    }
    this.webhookSecret = secret;
  }



  async createOrder(
    userId: string,
    amount: number,
    paymentMethod?: string,
  ): Promise<Payment> {
    if (amount < 10 || amount > 50000) {
      throw new BadRequestException('Amount must be between ₹10 and ₹50,000');
    }

    const orderId = `ORD_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const payment = this.paymentRepo.create({
      userId,
      orderId,
      amount,
      paymentMethod: paymentMethod || undefined,
      status: 'pending',
      bonusPoints: 0,
    });

    return this.paymentRepo.save(payment);
  }

  async verifyPayment(
    userId: string,
    orderId: string,
    paymentId: string,
  ): Promise<{ payment: Payment; bonusPoints: number; user: User }> {
    return this.dataSource.transaction(async (entityManager) => {
      const payment = await entityManager.findOne(Payment, {
        where: { orderId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!payment) throw new NotFoundException('Payment order not found');
      if (payment.userId !== userId)
        throw new BadRequestException('Order does not belong to user');
      if (payment.status !== 'pending')
        throw new BadRequestException('Payment already processed');

      const payload = `${orderId}|${paymentId}|${payment.amount}|completed`;
      const signature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('hex');

      const bonusPoints = this.calculateBonusPoints(Number(payment.amount));

      payment.paymentId = paymentId;
      payment.status = 'completed';
      payment.signature = signature;
      payment.bonusPoints = bonusPoints;
      await entityManager.save(payment);

      const user = await entityManager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) throw new NotFoundException('User not found');

      const balanceBefore = Number(user.walletBalanceInr);
      user.walletBalanceInr = balanceBefore + Number(payment.amount);
      const savedUser = await entityManager.save(user);

      await entityManager.save(
        entityManager.create(Transaction, {
          userId,
          type: 'deposit',
          cashAmount: Number(payment.amount),
          cashBalanceBefore: balanceBefore,
          cashBalanceAfter: Number(savedUser.walletBalanceInr),
          description: `Deposit of \u20B9${Number(payment.amount)}`,
          status: 'completed',
        }),
      );

      return { payment, bonusPoints, user: savedUser };
    });
  }

  calculateBonusPoints(amount: number): number {
    if (amount >= 1000) return 300;
    if (amount >= 500) return 120;
    if (amount >= 100) return 20;
    return 0;
  }

  async getPaymentByOrderId(orderId: string): Promise<Payment | null> {
    return this.paymentRepo.findOne({ where: { orderId } });
  }

  async getUserPayments(userId: string): Promise<Payment[]> {
    return this.paymentRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}
