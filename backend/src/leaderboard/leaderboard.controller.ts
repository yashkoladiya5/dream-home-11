import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Inject,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In } from 'typeorm';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { ContestMember } from '../contests/entities/contest-member.entity';
import {
  LeaderboardRedisService,
  LeaderboardEntry,
} from './leaderboard-redis.service';
import { LeaderboardResetService } from './leaderboard-reset.service';
import { LeaderboardSyncService } from './leaderboard-sync.service';
import { CacheControl } from '../common/decorators/cache-control.decorator';

import { GetLeaderboardDto } from './dto/get-leaderboard.dto';

@ApiTags('Leaderboard')
@ApiBearerAuth()
@Controller('api/v1/leaderboard')
@UseGuards(JwtAuthGuard)
@Throttle({ default: { ttl: 60000, limit: 10000 } })
@CacheControl(60)
export class LeaderboardController {
  constructor(
    private readonly leaderboardRedis: LeaderboardRedisService,
    private readonly leaderboardSync: LeaderboardSyncService,
    private readonly leaderboardReset: LeaderboardResetService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ContestMember)
    private readonly contestMemberRepo: Repository<ContestMember>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  @Get()
  async getGlobalLeaderboard(
    @GetUser() user: User,
    @Query() dto: GetLeaderboardDto,
  ) {
    const pageNum = Math.max(1, dto.page || 1);
    const limitNum = Math.min(100, Math.max(1, dto.limit || 20));
    const cycleStr = dto.cycle || 'all_time';
    const key = this.leaderboardRedis.getCycleKey(cycleStr);

    const result = await this.leaderboardRedis.getTopWithUserRank(
      key,
      user.id,
      pageNum,
      limitNum,
    );

    if (result.entries.length > 0) {
      const enrichedEntries = await this._enrichEntries(result.entries);
      const enrichedUserRank = result.userRank
        ? (await this._enrichEntries([result.userRank]))[0]
        : null;
      return {
        entries: enrichedEntries,
        userRank: enrichedUserRank,
        totalCount: result.totalCount,
        cycle: cycleStr,
      };
    }

    return this._fallbackLeaderboard(user, pageNum, limitNum, cycleStr);
  }

  private async _fallbackLeaderboard(
    user: User,
    page: number,
    limit: number,
    cycle: string,
  ) {
    const orderField =
      cycle === 'weekly'
        ? 'weeklyPoints'
        : cycle === 'monthly'
          ? 'monthlyPoints'
          : 'lifetimePoints';
    const [users, totalCount] = await this.userRepo.findAndCount({
      where: { isActive: true },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        currentTier: true,
        lifetimePoints: true,
        weeklyPoints: true,
        monthlyPoints: true,
      },
      order: { [orderField]: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    const entries: LeaderboardEntry[] = users.map((u, i) => ({
      userId: u.id,
      score: Number(u[orderField] ?? 0),
      rank: (page - 1) * limit + i + 1,
      fullName: u.fullName ?? undefined,
      avatarUrl: u.avatarUrl ?? undefined,
      currentTier: u.currentTier ?? undefined,
    }));

    const userIdx = users.findIndex((u) => u.id === user.id);
    const userRank = userIdx >= 0 ? entries[userIdx] : null;

    return { entries, userRank, totalCount, cycle };
  }

  @Get('search')
  async searchLeaderboard(
    @GetUser() user: User,
    @Query('q') query: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('cycle') cycle?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const limitNum = Math.min(
      100,
      Math.max(1, parseInt(limit || '20', 10) || 20),
    );
    const key = this.leaderboardRedis.getCycleKey(cycle || 'all_time');

    if (!query || query.trim().length === 0) {
      return this.getGlobalLeaderboard(user, {
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        cycle,
      });
    }

    const [matchingUsers, totalCount] = await this.userRepo.findAndCount({
      where: [{ fullName: ILike(`%${query.trim()}%`) }],
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        currentTier: true,
        lifetimePoints: true,
        weeklyPoints: true,
        monthlyPoints: true,
      },
      take: limitNum,
      skip: (pageNum - 1) * limitNum,
    });

    const entries: LeaderboardEntry[] = [];
    for (const u of matchingUsers) {
      const [rank, score] = await Promise.all([
        this.leaderboardRedis.getUserRank(key, u.id),
        this.leaderboardRedis.getUserScore(key, u.id),
      ]);
      entries.push({
        userId: u.id,
        score: score ?? 0,
        rank: rank ?? 0,
        fullName: u.fullName ?? undefined,
        avatarUrl: u.avatarUrl ?? undefined,
        currentTier: u.currentTier ?? undefined,
      });
    }

    entries.sort((a, b) => {
      if (!a.rank && !b.rank) return 0;
      if (!a.rank) return 1;
      if (!b.rank) return -1;
      return a.rank - b.rank;
    });

    return { entries, userRank: null, totalCount, cycle: cycle || 'all_time' };
  }

  @Get('contest/:contestId')
  async getContestLeaderboard(
    @GetUser() user: User,
    @Param('contestId', ParseUUIDPipe) contestId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('cycle') cycle?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const limitNum = Math.min(
      100,
      Math.max(1, parseInt(limit || '20', 10) || 20),
    );
    const cycleStr = cycle || 'all_time';
    const contestKey = this.leaderboardRedis.getContestKey(contestId, cycleStr);

    const result = await this.leaderboardRedis.getTopWithUserRank(
      contestKey,
      user.id,
      pageNum,
      limitNum,
    );

    if (result.entries.length > 0) {
      const enrichedEntries = await this._enrichEntries(result.entries);
      const enrichedUserRank = result.userRank
        ? (await this._enrichEntries([result.userRank]))[0]
        : null;
      return {
        entries: enrichedEntries,
        userRank: enrichedUserRank,
        totalCount: result.totalCount,
        cycle: cycleStr,
      };
    }

    const fallback = await this._fallbackContestLeaderboard(
      user,
      contestId,
      pageNum,
      limitNum,
    );
    return { ...fallback, cycle: cycleStr };
  }

  @Get('series/:contestId')
  async getSeriesLeaderboard(
    @GetUser() user: User,
    @Param('contestId', ParseUUIDPipe) contestId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const limitNum = Math.min(
      100,
      Math.max(1, parseInt(limit || '20', 10) || 20),
    );
    const contestKey = this.leaderboardRedis.getContestKey(contestId, 'custom');

    const result = await this.leaderboardRedis.getTopWithUserRank(
      contestKey,
      user.id,
      pageNum,
      limitNum,
    );

    if (result.entries.length > 0) {
      const enrichedEntries = await this._enrichEntries(result.entries);
      const enrichedUserRank = result.userRank
        ? (await this._enrichEntries([result.userRank]))[0]
        : null;
      return {
        entries: enrichedEntries,
        userRank: enrichedUserRank,
        totalCount: result.totalCount,
        cycle: 'custom',
      };
    }

    const fallback = await this._fallbackContestLeaderboard(
      user,
      contestId,
      pageNum,
      limitNum,
    );
    return { ...fallback, cycle: 'custom' };
  }

  @Get('me')
  async getMyLeaderboardRank(
    @GetUser() user: User,
    @Query('contestId') contestId?: string,
    @Query('cycle') cycle?: string,
  ) {
    const key = contestId
      ? this.leaderboardRedis.getContestKey(contestId)
      : this.leaderboardRedis.getCycleKey(cycle || 'all_time');

    const [rank, score] = await Promise.all([
      this.leaderboardRedis.getUserRank(key, user.id),
      this.leaderboardRedis.getUserScore(key, user.id),
    ]);

    const totalCount = await this.leaderboardRedis.getTotalCount(key);

    return {
      userId: user.id,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      currentTier: user.currentTier,
      rank,
      score,
      totalCount,
      leaderboardType: contestId ? 'contest' : 'global',
    };
  }

  @Post('sync')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async triggerSync() {
    const result = await this.leaderboardSync.syncAll();
    return { message: 'Leaderboard sync triggered successfully', ...result };
  }

  @Post('sync/contest/:contestId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async triggerContestSync(
    @Param('contestId', ParseUUIDPipe) contestId: string,
  ) {
    const memberCount =
      await this.leaderboardSync.syncContestLeaderboard(contestId);
    return {
      message: `Synced ${memberCount} members for contest ${contestId}`,
      memberCount,
    };
  }

  @Post('reset/weekly')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async resetWeeklyLeaderboard() {
    const result = await this.leaderboardReset.freezeAndReset('weekly');
    return { message: 'Weekly leaderboard reset completed', ...result };
  }

  @Post('reset/monthly')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async resetMonthlyLeaderboard() {
    const result = await this.leaderboardReset.freezeAndReset('monthly');
    return { message: 'Monthly leaderboard reset completed', ...result };
  }

  @Get('archive')
  async getLeaderboardArchives(
    @Query('cycle') cycle: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('snapshotDate') snapshotDate?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const limitNum = Math.min(
      100,
      Math.max(1, parseInt(limit || '20', 10) || 20),
    );
    const cycleStr = (cycle || 'monthly').toLowerCase();
    return this.leaderboardReset.getArchives(
      cycleStr,
      pageNum,
      limitNum,
      snapshotDate,
    );
  }

  private async _fallbackContestLeaderboard(
    user: User,
    contestId: string,
    page: number,
    limit: number,
  ) {
    const [members, totalCount] = await this.contestMemberRepo.findAndCount({
      where: { contestId },
      relations: { user: true },
      order: { pointsEarned: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
      select: {
        id: true,
        userId: true,
        pointsEarned: true,
        user: {
          id: true,
          fullName: true,
          avatarUrl: true,
          currentTier: true,
          lifetimePoints: true,
        },
      },
    });

    const entries: LeaderboardEntry[] = members.map((m, i) => ({
      userId: m.userId,
      score: m.pointsEarned,
      rank: (page - 1) * limit + i + 1,
      fullName: m.user?.fullName ?? undefined,
      avatarUrl: m.user?.avatarUrl ?? undefined,
      currentTier: m.user?.currentTier ?? undefined,
    }));

    const userMemberIdx = members.findIndex((m) => m.userId === user.id);
    const userRank = userMemberIdx >= 0 ? entries[userMemberIdx] : null;

    return { entries, userRank, totalCount };
  }

  private async _enrichEntries(
    entries: LeaderboardEntry[],
  ): Promise<LeaderboardEntry[]> {
    if (entries.length === 0) return entries;

    const userIds = entries.map((e) => e.userId);
    const missingUserIds: string[] = [];

    try {
      // 1. Try to fetch cached profiles from Redis
      const pipeline = this.redis.pipeline();
      for (const id of userIds) {
        pipeline.get(`user:cache:${id}`);
      }
      const cacheResults = await pipeline.exec();

      const userMap = new Map<string, any>();
      if (cacheResults) {
        userIds.forEach((id, index) => {
          const res = cacheResults[index];
          const val = Array.isArray(res) ? res[1] : res;
          if (val) {
            try {
              userMap.set(id, JSON.parse(val as string));
            } catch (_) {}
          }
        });
      }

      // 2. Identify missing user profiles
      for (const id of userIds) {
        if (!userMap.has(id)) {
          missingUserIds.push(id);
        }
      }

      // 3. Query PostgreSQL only for missing profiles
      if (missingUserIds.length > 0) {
        const users = await this.userRepo.find({
          where: { id: In(missingUserIds) },
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            currentTier: true,
          },
        });

        // Cache missing profiles in Redis with 5 mins TTL
        const cachePipeline = this.redis.pipeline();
        for (const u of users) {
          userMap.set(u.id, u);
          cachePipeline.set(`user:cache:${u.id}`, JSON.stringify(u), 'EX', 300);
        }
        await cachePipeline.exec();
      }

      // 4. Map profiles back to matching leaderboard entries
      return entries.map((entry) => {
        const u = userMap.get(entry.userId);
        return {
          ...entry,
          fullName: u?.fullName ?? undefined,
          avatarUrl: u?.avatarUrl ?? undefined,
          currentTier: u?.currentTier ?? undefined,
        };
      });
    } catch (_) {
      // Fallback to direct PostgreSQL queries if Redis fails
      const users = await this.userRepo.find({
        where: { id: In(userIds) },
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
          currentTier: true,
        },
      });
      const userMap = new Map(users.map((u) => [u.id, u]));
      return entries.map((entry) => ({
        ...entry,
        fullName: userMap.get(entry.userId)?.fullName ?? undefined,
        avatarUrl: userMap.get(entry.userId)?.avatarUrl ?? undefined,
        currentTier: userMap.get(entry.userId)?.currentTier ?? undefined,
      }));
    }
  }
}
