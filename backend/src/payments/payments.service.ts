import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService as NestConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Payment } from './entities/payment.entity';
import { User } from '../users/entities/user.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { WalletService } from '../wallet/wallet.service';
import { Wallet } from '../wallet/entities/wallet.entity';
import { ConfigService } from '../config/config.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly webhookSecret: string;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    private readonly dataSource: DataSource,
    private readonly nestConfigService: NestConfigService,
    private readonly appConfigService: ConfigService,
    private readonly walletService: WalletService,
  ) {
    const secret = this.nestConfigService.get<string>('WEBHOOK_SECRET');
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
    const config = await this.appConfigService.getConfig();
    const minAmount = 10;
    const maxAmount = Number(config.maxWithdrawalAmount) || 50000;
    if (amount < minAmount || amount > maxAmount) {
      throw new BadRequestException(`Amount must be between ₹${minAmount} and ₹${maxAmount}`);
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

      const bonusPoints = await this.calculateBonusPoints(userId, Number(payment.amount), entityManager);

      payment.paymentId = paymentId;
      payment.status = 'completed';
      payment.signature = signature;
      payment.bonusPoints = bonusPoints;
      await entityManager.save(payment);

      const wallet = await entityManager.findOne(Wallet, {
        where: { userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!wallet) throw new NotFoundException('Wallet not found');

      const balanceBefore = Number(wallet.balanceInr);
      wallet.balanceInr = balanceBefore + Number(payment.amount);
      const savedWallet = await entityManager.save(wallet);

      const transaction = entityManager.create(Transaction, {
        userId,
        type: 'deposit',
        cashAmount: Number(payment.amount),
        cashBalanceBefore: balanceBefore,
        cashBalanceAfter: Number(savedWallet.balanceInr),
        description: `Deposit of \u20B9${Number(payment.amount)}`,
        referenceType: 'payment',
        referenceId: payment.id,
        status: 'completed',
      });
      await entityManager.save(transaction);

      const user = await entityManager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) throw new NotFoundException('User not found');
      user.walletBalanceInr = Number(savedWallet.balanceInr);
      const savedUser = await entityManager.save(user);

      return { payment, bonusPoints, user: savedUser };
    });
  }

  async calculateBonusPoints(userId: string, amount: number, entityManager?: import('typeorm').EntityManager): Promise<number> {
    const config = await this.appConfigService.getConfig();
    let bonus = 0;
    
    if (amount >= Number(config.bonusTier3Threshold)) bonus = config.bonusTier3Points;
    else if (amount >= Number(config.bonusTier2Threshold)) bonus = config.bonusTier2Points;
    else if (amount >= Number(config.bonusTier1Threshold)) bonus = config.bonusTier1Points;

    if (bonus === 0) return 0;

    // Check monthly limits (5 times per month)
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const repo = entityManager ? entityManager.getRepository(Transaction) : this.transactionRepo;
    const bonusCountThisMonth = await repo.createQueryBuilder('t')
      .where('t.userId = :userId', { userId })
      .andWhere('t.type = :type', { type: 'points_bonus' })
      .andWhere('t.createdAt >= :startDate', { startDate: firstDayOfMonth })
      .getCount();

    if (bonusCountThisMonth >= 5) {
      this.logger.log(`User ${userId} has reached the max deposit bonus limit of 5 this month.`);
      return 0; // Cap reached
    }

    return bonus;
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!signature) return false;
    const computed = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');
    if (computed.length !== signature.length) return false;
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
  }

  async handleWebhookEvent(body: any): Promise<void> {
    const event = body?.event;
    if (!event) return;

    if (event === 'payment.captured' || event === 'order.paid') {
      const orderId = body?.order_id || body?.orderId;
      const paymentId = body?.payment_id || body?.paymentId;
      if (!orderId || !paymentId) return;

      const payment = await this.paymentRepo.findOne({ where: { orderId } });
      if (!payment || payment.status !== 'pending') return;

      await this.dataSource.transaction(async (entityManager) => {
        const lockedPayment = await entityManager.findOne(Payment, {
          where: { orderId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!lockedPayment || lockedPayment.status !== 'pending') return;

        const bonusPoints = await this.calculateBonusPoints(lockedPayment.userId, Number(lockedPayment.amount), entityManager);

        lockedPayment.paymentId = paymentId;
        lockedPayment.status = 'completed';
        lockedPayment.bonusPoints = bonusPoints;
        await entityManager.save(lockedPayment);

        const user = await entityManager.findOne(User, {
          where: { id: lockedPayment.userId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!user) return;

        const balanceBefore = Number(user.walletBalanceInr);
        user.walletBalanceInr = balanceBefore + Number(lockedPayment.amount);
        const savedUser = await entityManager.save(user);

        await entityManager.save(
          entityManager.create(Transaction, {
            userId: lockedPayment.userId,
            type: 'deposit',
            cashAmount: Number(lockedPayment.amount),
            cashBalanceBefore: balanceBefore,
            cashBalanceAfter: Number(savedUser.walletBalanceInr),
            description: `Deposit of ₹${Number(lockedPayment.amount)}`,
            status: 'completed',
          }),
        );
      });
    }
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
