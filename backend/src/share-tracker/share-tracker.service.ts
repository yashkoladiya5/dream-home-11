import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Share } from './entities/share.entity';
import { PointsEngineService } from '../points/points-engine.service';

export const SHARE_POINTS = 50;

@Injectable()
export class ShareTrackerService {
  constructor(
    @InjectRepository(Share)
    private readonly shareRepo: Repository<Share>,
    private readonly pointsEngineService: PointsEngineService,
  ) {}

  async logShare(
    userId: string,
    contestId: string | null,
    shareChannel: string,
    shareType: string = 'app',
  ): Promise<Share> {
    let pointsToAward = 15; // default app share
    if (shareType === 'contest') {
      pointsToAward = 10;
    } else if (shareType === 'winner' || shareType === 'achievement') {
      pointsToAward = 20;
    }

    const inviteCode = this.generateInviteCode();
    const share = this.shareRepo.create({
      userId,
      contestId,
      shareChannel,
      status: 'sent',
      pointsAwarded: pointsToAward,
      inviteCode,
    });
    const saved = await this.shareRepo.save(share);
    await this.pointsEngineService.logPointAction(
      userId,
      'share_contest',
      pointsToAward,
      1.0,
      pointsToAward,
    );
    return saved;
  }

  async getShareHistory(userId: string): Promise<Share[]> {
    return this.shareRepo.find({
      where: { userId },
      order: { sharedAt: 'DESC' },
    });
  }

  async getShareStats(userId: string): Promise<{
    totalShares: number;
    totalPoints: number;
    inviteCode: string | null;
  }> {
    const shares = await this.shareRepo.find({ where: { userId } });
    const totalShares = shares.length;
    const totalPoints = shares.reduce((sum, s) => sum + s.pointsAwarded, 0);
    const latestShare = shares.length > 0 ? shares[0] : null;
    return {
      totalShares,
      totalPoints,
      inviteCode: latestShare?.inviteCode ?? null,
    };
  }

  private generateInviteCode(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }
}
