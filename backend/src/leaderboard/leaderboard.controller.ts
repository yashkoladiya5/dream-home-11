import { Controller, Get, Post, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In } from 'typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { ContestMember } from '../contests/entities/contest-member.entity';
import { LeaderboardRedisService, LeaderboardEntry } from './leaderboard-redis.service';
import { LeaderboardSyncService } from './leaderboard-sync.service';

@Controller('api/v1/leaderboard')
@UseGuards(JwtAuthGuard)
export class LeaderboardController {
  constructor(
    private readonly leaderboardRedis: LeaderboardRedisService,
    private readonly leaderboardSync: LeaderboardSyncService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ContestMember)
    private readonly contestMemberRepo: Repository<ContestMember>,
  ) {}

  @Get()
  async getGlobalLeaderboard(
    @GetUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('cycle') cycle?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));
    const cycleStr = cycle || 'all_time';
    const key = this.leaderboardRedis.getCycleKey(cycleStr);

    const result = await this.leaderboardRedis.getTopWithUserRank(key, user.id, pageNum, limitNum);

    if (result.entries.length > 0) {
      const enrichedEntries = await this._enrichEntries(result.entries);
      const enrichedUserRank = result.userRank
        ? (await this._enrichEntries([result.userRank]))[0]
        : null;
      return { entries: enrichedEntries, userRank: enrichedUserRank, totalCount: result.totalCount, cycle: cycleStr };
    }

    return this._fallbackLeaderboard(user, pageNum, limitNum, cycleStr);
  }

  private async _fallbackLeaderboard(user: User, page: number, limit: number, cycle: string) {
    const orderField = cycle === 'weekly' ? 'weeklyPoints' : cycle === 'monthly' ? 'monthlyPoints' : 'lifetimePoints';
    const [users, totalCount] = await this.userRepo.findAndCount({
      where: { isActive: true },
      select: { id: true, fullName: true, avatarUrl: true, currentTier: true, lifetimePoints: true, weeklyPoints: true, monthlyPoints: true },
      order: { [orderField]: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    const entries: LeaderboardEntry[] = users.map((u, i) => ({
      userId: u.id,
      score: Number(u[orderField as keyof Pick<User, 'lifetimePoints' | 'weeklyPoints' | 'monthlyPoints'>] ?? 0),
      rank: (page - 1) * limit + i + 1,
      fullName: u.fullName ?? undefined,
      avatarUrl: u.avatarUrl ?? undefined,
      currentTier: u.currentTier ?? undefined,
    }));

    const userIdx = users.findIndex(u => u.id === user.id);
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
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));
    const key = this.leaderboardRedis.getCycleKey(cycle || 'all_time');

    if (!query || query.trim().length === 0) {
      return this.getGlobalLeaderboard(user, page, limit, cycle);
    }

    const [matchingUsers, totalCount] = await this.userRepo.findAndCount({
      where: [
        { fullName: ILike(`%${query.trim()}%`) },
        { phoneNumber: ILike(`%${query.trim()}%`) },
      ],
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
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));
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
      return { entries: enrichedEntries, userRank: enrichedUserRank, totalCount: result.totalCount, cycle: cycleStr };
    }

    const fallback = await this._fallbackContestLeaderboard(user, contestId, pageNum, limitNum);
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
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));
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
      return { entries: enrichedEntries, userRank: enrichedUserRank, totalCount: result.totalCount, cycle: 'custom' };
    }

    const fallback = await this._fallbackContestLeaderboard(user, contestId, pageNum, limitNum);
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
  async triggerSync() {
    const result = await this.leaderboardSync.syncAll();
    return { message: 'Leaderboard sync triggered successfully', ...result };
  }

  @Post('sync/contest/:contestId')
  async triggerContestSync(
    @Param('contestId', ParseUUIDPipe) contestId: string,
  ) {
    const memberCount = await this.leaderboardSync.syncContestLeaderboard(contestId);
    return { message: `Synced ${memberCount} members for contest ${contestId}`, memberCount };
  }

  private async _fallbackContestLeaderboard(user: User, contestId: string, page: number, limit: number) {
    const [members, totalCount] = await this.contestMemberRepo.findAndCount({
      where: { contestId },
      relations: { user: true },
      order: { pointsEarned: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    const entries: LeaderboardEntry[] = members.map((m, i) => ({
      userId: m.userId,
      score: m.pointsEarned,
      rank: (page - 1) * limit + i + 1,
      fullName: m.user?.fullName ?? undefined,
      avatarUrl: m.user?.avatarUrl ?? undefined,
      currentTier: m.user?.currentTier ?? undefined,
    }));

    const userMemberIdx = members.findIndex(m => m.userId === user.id);
    const userRank = userMemberIdx >= 0 ? entries[userMemberIdx] : null;

    return { entries, userRank, totalCount };
  }

  private async _enrichEntries(entries: LeaderboardEntry[]): Promise<LeaderboardEntry[]> {
    if (entries.length === 0) return entries;

    const userIds = entries.map(e => e.userId);
    const users = await this.userRepo.find({
      where: { id: In(userIds) },
      select: { id: true, fullName: true, avatarUrl: true, currentTier: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    return entries.map(entry => ({
      ...entry,
      fullName: userMap.get(entry.userId)?.fullName ?? undefined,
      avatarUrl: userMap.get(entry.userId)?.avatarUrl ?? undefined,
      currentTier: userMap.get(entry.userId)?.currentTier ?? undefined,
    }));
  }
}
