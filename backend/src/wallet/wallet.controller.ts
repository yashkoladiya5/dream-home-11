import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { TransactionsService } from '../transactions/transactions.service';

@ApiTags('Wallet')
@ApiBearerAuth()
@Controller('api/v1/wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly transactionsService: TransactionsService,
  ) {}

  @Get()
  async getBalance(@GetUser() user: User) {
    return this.walletService.getBalance(user.id);
  }

  @Get('transactions')
  async getTransactions(
    @GetUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.transactionsService.getHistory(user.id, page ?? 1, limit ?? 20);
  }
}
