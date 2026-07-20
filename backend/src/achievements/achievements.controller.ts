import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AchievementsService } from './achievements.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Achievements')
@ApiBearerAuth()
@Controller('api/v1/achievements')
@UseGuards(JwtAuthGuard)
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  async getAchievements(@Req() req) {
    return this.achievementsService.getAchievementsWithProgress(req.user.id);
  }

  @Post('check')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async checkAndAward(@Req() req) {
    return this.achievementsService.checkAndAwardAchievements(req.user.id);
  }
}
