import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PointsEngineService } from './points-engine.service';
import { StreakService } from './streak.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { UserLevel } from '../users/entities/user.entity';

@ApiTags('Points')
@ApiBearerAuth()
@Controller('api/v1/points')
@UseGuards(JwtAuthGuard)
export class PointsController {
  constructor(
    private readonly pointsEngineService: PointsEngineService,
    private readonly streakService: StreakService,
    private readonly usersService: UsersService,
  ) {}

  @Get('actions/today')
  async getTodayActions(@Req() req) {
    const userId = req.user.id;
    return this.pointsEngineService.getTodayActionsStatus(userId);
  }

  @Get('streak')
  async getStreak(@Req() req) {
    const userId = req.user.id;
    return this.streakService.getStreakInfo(userId);
  }

  @Post('action')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async performAction(@Req() req, @Body('action') action: string) {
    const userId = req.user.id;
    if (!action) {
      return { success: false, reason: 'Action type is required' };
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const result = await this.pointsEngineService.performDailyAction(
      userId,
      action,
      user.currentTier,
    );

    if (!result) {
      return { success: false, reason: 'Unknown action type' };
    }

    if (result.success) {
      user.lifetimePoints = Number(user.lifetimePoints) + result.finalPoints;
      user.pointsBalance = Number(user.pointsBalance) + result.finalPoints;

      if (user.lifetimePoints >= 15000) {
        user.currentTier = UserLevel.PLATINUM;
      } else if (user.lifetimePoints >= 5000) {
        user.currentTier = UserLevel.GOLD;
      } else if (user.lifetimePoints >= 1000) {
        user.currentTier = UserLevel.SILVER;
      }

      await this.usersService.updateUser(user);

      result.lifetimePoints = user.lifetimePoints;
      result.currentTier = user.currentTier;

      // Handle streak for daily_login
      if (action === 'daily_login') {
        const streakResult = await this.streakService.updateStreak(userId);
        (result as any).streak = streakResult.currentStreak;
        (result as any).longestStreak = streakResult.longestStreak;
        (result as any).streakBonusAwarded = streakResult.bonusAwarded;
        (result as any).streakBonusPoints = streakResult.bonusPoints;

        if (streakResult.bonusPoints > 0) {
          user.lifetimePoints =
            Number(user.lifetimePoints) + streakResult.bonusPoints;
          user.pointsBalance =
            Number(user.pointsBalance) + streakResult.bonusPoints;

          if (user.lifetimePoints >= 15000) {
            user.currentTier = UserLevel.PLATINUM;
          } else if (user.lifetimePoints >= 5000) {
            user.currentTier = UserLevel.GOLD;
          } else if (user.lifetimePoints >= 1000) {
            user.currentTier = UserLevel.SILVER;
          }

          await this.usersService.updateUser(user);
          result.lifetimePoints = user.lifetimePoints;
          result.currentTier = user.currentTier;
        }
      }
    }

    return result;
  }
}
