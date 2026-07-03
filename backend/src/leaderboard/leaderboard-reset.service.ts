import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThanOrEqual } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { User } from '../users/entities/user.entity';
import { LeaderboardArchive } from './entities/leaderboard-archive.entity';
import { LeaderboardRedisService } from './leaderboard-redis.service';

@Injectable()
export class LeaderboardResetService {
  private readonly logger = new Logger(LeaderboardResetService.name);

  constructor(
    @InjectRepository(LeaderboardArchive)
    private readonly archiveRepo: Repository<LeaderboardArchive>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly leaderboardRedis: LeaderboardRedisService,
  ) {}

  @Cron('0 0 1 * *')
  async handleMonthlyCron() {
    this.logger.log('Monthly leaderboard freeze CRON triggered');
    await this.freezeAndReset('monthly');
  }

  @Cron('0 0 * * 0')
  async handleWeeklyCron() {
    this.logger.log('Weekly leaderboard freeze CRON triggered');
    await this.freezeAndReset('weekly');
  }

  async freezeAndReset(
    cycle: 'weekly' | 'monthly',
  ): Promise<{ archived: number; reset: number }> {
    const pointsField =
      cycle === 'monthly'
        ? ('monthlyPoints' as const)
        : ('weeklyPoints' as const);
    const redisKey =
      cycle === 'monthly'
        ? LeaderboardRedisService.MONTHLY_KEY
        : LeaderboardRedisService.WEEKLY_KEY;

    const users = await this.userRepo.find({
      where: { isActive: true },
      order: { [pointsField]: 'DESC' },
    });

    if (users.length === 0) {
      this.logger.warn(`No active users found for ${cycle} reset`);
      return { archived: 0, reset: 0 };
    }

    const archives: Partial<LeaderboardArchive>[] = [];
    let rank = 1;
    for (const u of users) {
      const pts = u[pointsField];
      if (pts <= 0) continue;
      archives.push({
        cycle,
        userId: u.id,
        points: pts,
        rank,
        previousTier: u.currentTier,
        snapshotDate: new Date(),
      });
      rank++;
    }

    if (archives.length > 0) {
      await this.archiveRepo.save(archives);
      this.logger.log(`Archived ${archives.length} ${cycle} rankings`);
    }

    await this.userRepo.update({}, { [pointsField]: 0 });
    this.logger.log(`Reset ${cycle} points for all users`);

    await this.leaderboardRedis.removeLeaderboard(redisKey);
    this.logger.log(`Cleared Redis key: ${redisKey}`);

    return { archived: archives.length, reset: users.length };
  }

  async getArchives(
    cycle: string,
    page: number = 1,
    limit: number = 20,
    snapshotDate?: string,
  ): Promise<{ archives: LeaderboardArchive[]; total: number }> {
    const where: Record<string, unknown> = { cycle };

    if (snapshotDate) {
      const date = new Date(snapshotDate);
      const start = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
      );
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      where.snapshotDate = MoreThanOrEqual(start);
    }

    const [archives, total] = await this.archiveRepo.findAndCount({
      where,
      order: { snapshotDate: 'DESC', rank: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { archives, total };
  }
}
