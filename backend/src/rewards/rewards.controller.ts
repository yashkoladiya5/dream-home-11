import { Controller, Get, Post, Param, Req, UseGuards, NotFoundException } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/v1/rewards')
@UseGuards(JwtAuthGuard)
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get()
  async getCatalog() {
    return this.rewardsService.getCatalog();
  }

  @Get('redemptions')
  async getRedemptionHistory(@Req() req) {
    return this.rewardsService.getRedemptionHistory(req.user.id);
  }

  @Get(':id')
  async getReward(@Param('id') id: string) {
    return this.rewardsService.getRewardById(id);
  }

  @Post(':id/redeem')
  async redeemReward(@Req() req, @Param('id') id: string) {
    return this.rewardsService.redeemReward(req.user.id, id);
  }
}
