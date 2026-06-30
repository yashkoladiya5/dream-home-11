import { Controller, Post, Get, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { TransactionsService } from '../transactions/transactions.service';

@Controller('api/v1/payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly usersService: UsersService,
    private readonly transactionsService: TransactionsService,
  ) {}

  @Post('order')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  async createOrder(
    @GetUser() user: User,
    @Body('amount') amount: number,
    @Body('paymentMethod') paymentMethod?: string,
  ) {
    const payment = await this.paymentsService.createOrder(user.id, amount, paymentMethod);
    return {
      orderId: payment.orderId,
      amount: Number(payment.amount),
      status: payment.status,
    };
  }

  @Post('verify')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  async verifyPayment(
    @GetUser() user: User,
    @Body('orderId') orderId: string,
    @Body('paymentId') paymentId: string,
  ) {
    const { payment, bonusPoints } = await this.paymentsService.verifyPayment(user.id, orderId, paymentId);

    let updatedUser = await this.usersService.addCash(user.id, Number(payment.amount));

    if (bonusPoints > 0) {
      updatedUser = await this.usersService.awardPoints(user.id, bonusPoints);
      await this.transactionsService.logTransaction({
        userId: user.id,
        type: 'points_bonus',
        pointsAmount: bonusPoints,
        pointsBalanceBefore: Number(user.pointsBalance),
        pointsBalanceAfter: Number(updatedUser.pointsBalance),
        description: `Deposit bonus: +${bonusPoints} pts for ₹${Number(payment.amount)} deposit`,
        referenceType: 'payment',
        referenceId: payment.id,
        status: 'completed',
      });
    }

    return {
      success: true,
      orderId: payment.orderId,
      paymentId: payment.paymentId,
      amount: Number(payment.amount),
      bonusPoints,
      walletBalance: Number(updatedUser.walletBalanceInr),
      pointsBalance: Number(updatedUser.pointsBalance),
    };
  }

  @Get('history')
  async getPaymentHistory(@GetUser() user: User) {
    return this.paymentsService.getUserPayments(user.id);
  }
}
