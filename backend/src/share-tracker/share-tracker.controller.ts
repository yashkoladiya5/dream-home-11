import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ShareTrackerService } from './share-tracker.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { TrackShareDto } from './dto/track-share.dto';

@ApiTags('Shares')
@ApiBearerAuth()
@Controller('api/v1/shares')
@UseGuards(JwtAuthGuard)
export class ShareTrackerController {
  constructor(private readonly shareTrackerService: ShareTrackerService) {}

  @Post()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async logShare(@Req() req, @Body() dto: TrackShareDto) {
    const share = await this.shareTrackerService.logShare(
      req.user.id,
      dto.contestId,
      dto.shareChannel,
      dto.shareType || 'app',
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
