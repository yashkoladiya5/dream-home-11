import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Share } from './entities/share.entity';
import { PointsEngineService } from '../points/points-engine.service';

@Injectable()
export class ShareTrackerService {
  constructor(
    @InjectRepository(Share)
    private readonly shareRepository: Repository<Share>,
    private readonly pointsEngineService: PointsEngineService,
  ) {}

  async logShare(userId: string, contestId: string, shareChannel: string): Promise<Share> {
    const inviteCode = this.generateInviteCode();
    const share = this.shareRepository.create({
      userId,
      contestId,
      shareChannel,
      status: 'sent',
      pointsAwarded: 5,
      inviteCode,
    });
    await this.shareRepository.save(share);
    await this.pointsEngineService.logPointAction(userId, 'share_contest', 5, 1.0, 5);
    return share;
  }

  async getShareHistory(userId: string): Promise<Share[]> {
    return this.shareRepository.find({
      where: { userId },
      order: { sharedAt: 'DESC' },
    });
  }

  async getShareStats(userId: string): Promise<{ totalShares: number; totalPointsEarned: number }> {
    const shares = await this.shareRepository.find({ where: { userId } });
    const totalShares = shares.length;
    const totalPointsEarned = shares.reduce((sum, s) => sum + s.pointsAwarded, 0);
    return { totalShares, totalPointsEarned };
  }

  generateInviteCode(): string {
    return randomBytes(4).toString('hex').toUpperCase().slice(0, 8);
  }
}
