import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

import { GetTransactionsDto } from './dto/get-transactions.dto';

@ApiTags('Transactions')
@ApiBearerAuth()
@Controller('api/v1/transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  async getHistory(
    @GetUser() user: User,
    @Query() dto: GetTransactionsDto,
  ) {
    return this.transactionsService.getHistory(
      user.id,
      dto.page ?? 1,
      dto.limit ?? 20,
      dto.type,
    );
  }

  @Get('balance')
  async getBalanceSummary(@GetUser() user: User) {
    return this.transactionsService.getBalanceSummary(user.id);
  }
}
