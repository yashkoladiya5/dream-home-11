import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { ShareTrackerService } from './share-tracker.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/v1/shares')
@UseGuards(JwtAuthGuard)
export class ShareTrackerController {
  constructor(private readonly shareTrackerService: ShareTrackerService) {}

  @Post()
  async logShare(
    @Req() req,
    @Body('contestId') contestId: string,
    @Body('shareChannel') shareChannel: string,
  ) {
    if (!shareChannel)
      return { success: false, reason: 'shareChannel is required' };
    const share = await this.shareTrackerService.logShare(
      req.user.id,
      contestId,
      shareChannel,
    );
    return { success: true, share };
  }

  @Get('history')
  async getHistory(@Req() req) {
    return this.shareTrackerService.getShareHistory(req.user.id);
  }

  @Get('stats')
  async getStats(@Req() req) {
    return this.shareTrackerService.getShareStats(req.user.id);
  }
}
