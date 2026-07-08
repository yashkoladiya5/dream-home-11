import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PaymentMethodsService } from './payment-methods.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('api/v1/payment-methods')
@UseGuards(JwtAuthGuard)
export class PaymentMethodsController {
  constructor(private readonly service: PaymentMethodsService) {}

  @Get('categories')
  async getCategories() {
    return this.service.getAvailableCategories();
  }

  @Get()
  async getAll(@GetUser() user: User, @Query('category') category?: string) {
    return this.service.findByUser(user.id, category);
  }

  @Post()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @GetUser() user: User,
    @Body()
    body: {
      category: string;
      label: string;
      displayValue: string;
      providerName?: string;
    },
  ) {
    return this.service.create(user.id, body);
  }

  @Delete(':id')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  async remove(@GetUser() user: User, @Param('id') id: string) {
    await this.service.remove(user.id, id);
    return { success: true };
  }
}
