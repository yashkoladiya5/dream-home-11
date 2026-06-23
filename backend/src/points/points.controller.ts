import { Controller, Get, Post, Body, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { PointsEngineService } from './points-engine.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { UserLevel } from '../users/entities/user.entity';

@Controller('api/v1/points')
@UseGuards(JwtAuthGuard)
export class PointsController {
  constructor(
    private readonly pointsEngineService: PointsEngineService,
    private readonly usersService: UsersService,
  ) {}

  @Get('actions/today')
  async getTodayActions(@Req() req) {
    const userId = req.user.id;
    return this.pointsEngineService.getTodayActionsStatus(userId);
  }

  @Post('action')
  async performAction(@Req() req, @Body('action') action: string) {
    const userId = req.user.id;
    if (!action) {
      return { success: false, reason: 'Action type is required' };
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const result = await this.pointsEngineService.performDailyAction(userId, action, user.currentTier);

    if (!result) {
      return { success: false, reason: 'Unknown action type' };
    }

    if (result.success) {
      user.lifetimePoints = Number(user.lifetimePoints) + result.finalPoints;
      user.pointsBalance = Number(user.pointsBalance) + result.finalPoints;

      if (user.lifetimePoints >= 5000) {
        user.currentTier = UserLevel.PLATINUM;
      } else if (user.lifetimePoints >= 2000) {
        user.currentTier = UserLevel.GOLD;
      } else if (user.lifetimePoints >= 1000) {
        user.currentTier = UserLevel.SILVER;
      }

      await this.usersService.updateUser(user);

      result.lifetimePoints = user.lifetimePoints;
      result.currentTier = user.currentTier;
    }

    return result;
  }
}
