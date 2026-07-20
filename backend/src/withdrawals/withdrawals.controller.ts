import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { WithdrawalsService } from './withdrawals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('api/v1/payments')
@UseGuards(JwtAuthGuard)
export class WithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) {}

  @Post('withdraw')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  async requestWithdrawal(
    @GetUser() user: User,
    @Body() dto: RequestWithdrawalDto,
  ) {
    const parsedAmount = typeof dto.amount === 'string' ? parseFloat(dto.amount as any) : dto.amount;
    const withdrawal = await this.withdrawalsService.requestWithdrawal(
      user.id,
      parsedAmount,
      {
        bankAccountNumber: dto.bankAccountNumber,
        bankIfsc: dto.bankIfsc,
        bankName: dto.bankName,
        upiId: dto.upiId,
      },
    );
    await this.withdrawalsService.logWithdrawalRequest(
      user.id,
      withdrawal.id,
      parsedAmount,
    );
    return {
      id: withdrawal.id,
      amount: Number(withdrawal.amount),
      status: withdrawal.status,
      createdAt: withdrawal.createdAt,
    };
  }

  @Get('withdraw/history')
  async getWithdrawalHistory(
    @GetUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.withdrawalsService.getWithdrawalHistory(
      user.id,
      pageNum,
      limitNum,
    );
  }

  @Get('withdraw/stats')
  async getWithdrawalStats(@GetUser() user: User) {
    return this.withdrawalsService.getWithdrawalStats(user.id);
  }

  @Get('withdraw/:id')
  async getWithdrawalById(@GetUser() user: User, @Param('id') id: string) {
    return this.withdrawalsService.getWithdrawalById(id, user.id);
  }
}
