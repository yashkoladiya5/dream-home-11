import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { TransactionsService } from '../transactions/transactions.service';
import { SkipEnvelope } from '../common/decorators/skip-envelope.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@ApiTags('Payments')
@ApiBearerAuth()
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
  async createOrder(@GetUser() user: User, @Body() dto: CreateOrderDto) {
    const payment = await this.paymentsService.createOrder(
      user.id,
      dto.amount,
      dto.paymentMethod,
    );
    return {
      orderId: payment.orderId,
      amount: Number(payment.amount),
      status: payment.status,
    };
  }

  @Post('verify')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  async verifyPayment(@GetUser() user: User, @Body() dto: VerifyPaymentDto) {
    let {
      payment,
      bonusPoints,
      user: updatedUser,
    } = await this.paymentsService.verifyPayment(
      user.id,
      dto.orderId,
      dto.paymentId,
    );

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

  @Post('webhook')
  @Public()
  @SkipEnvelope()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Headers() headers: any, @Body() body: any) {
    const signature = headers['x-webhook-signature'];

    const isValid = this.paymentsService.verifyWebhookSignature(
      JSON.stringify(body),
      signature,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    await this.paymentsService.handleWebhookEvent(body);

    return { received: true };
  }

  @Get('history')
  async getPaymentHistory(@GetUser() user: User) {
    return this.paymentsService.getUserPayments(user.id);
  }
}
