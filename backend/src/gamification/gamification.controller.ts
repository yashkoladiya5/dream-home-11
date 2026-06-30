import { Controller, Post, Get, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/v1/gamification')
@UseGuards(JwtAuthGuard)
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Post('spin')
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  async spin(@Req() req) {
    return this.gamificationService.spin(req.user.id);
  }

  @Get('spin/status')
  async spinStatus(@Req() req) {
    return this.gamificationService.getSpinStatus(req.user.id);
  }
}
