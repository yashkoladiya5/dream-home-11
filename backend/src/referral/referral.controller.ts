import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ReferralService } from './referral.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { ApplyReferralDto } from './dto/apply-referral.dto';

@ApiTags('Referral')
@ApiBearerAuth()
@Controller('api/v1/referral')
@UseGuards(JwtAuthGuard)
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Post('apply')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  async applyReferral(@GetUser() user: User, @Body() dto: ApplyReferralDto) {
    return this.referralService.applyReferral(user, dto.code);
  }

  @Get('stats')
  async getReferralStats(@GetUser() user: User) {
    return this.referralService.getReferralStats(user.id);
  }

  @Get('history')
  async getReferralHistory(@GetUser() user: User) {
    return this.referralService.getReferralHistory(user.id);
  }
}
