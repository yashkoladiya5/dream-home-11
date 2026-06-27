import { Inject, Injectable, Logger } from '@nestjs/common';
import { REDIS_CLIENT } from '../redis/redis.constants';
import Redis from 'ioredis';

export interface LeaderboardEntry {
  userId: string;
  score: number;
  rank: number;
  fullName?: string;
  avatarUrl?: string;
  currentTier?: string;
}

@Injectable()
export class LeaderboardRedisService {
  private readonly logger = new Logger(LeaderboardRedisService.name);

  // Key patterns
  static readonly GLOBAL_KEY = 'leaderboard:global';
  static readonly WEEKLY_KEY = 'leaderboard:global:weekly';
  static readonly MONTHLY_KEY = 'leaderboard:global:monthly';
  static readonly CONTEST_PREFIX = 'leaderboard:contest:';
  static readonly LIFETIME_KEY = 'leaderboard:lifetime';
  static readonly WEEKLY_TTL = 7 * 24 * 60 * 60;
  static readonly MONTHLY_TTL = 30 * 24 * 60 * 60;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  private async _exec<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      this.logger.warn(`Redis command failed: ${(err as Error).message}`);
      return fallback;
    }
  }

  // --- Core Sorted Set Operations ---

  async addScore(leaderboardKey: string, userId: string, score: number): Promise<void> {
    await this._exec(() => this.redis.zadd(leaderboardKey, score, userId), undefined);
  }

  async incrementScore(leaderboardKey: string, userId: string, increment: number): Promise<number> {
    return this._exec(() => this.redis.zincrby(leaderboardKey, increment, userId).then(Number), 0);
  }

  async getTopUsers(
    leaderboardKey: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<LeaderboardEntry[]> {
    return this._exec(async () => {
      const start = (page - 1) * limit;
      const end = start + limit - 1;
      const results = await this.redis.zrevrange(leaderboardKey, start, end, 'WITHSCORES');
      return this._parseResults(results, start);
    }, []);
  }

  async getUserRank(leaderboardKey: string, userId: string): Promise<number | null> {
    return this._exec(async () => {
      const rank = await this.redis.zrevrank(leaderboardKey, userId);
      return rank !== null ? rank + 1 : null;
    }, null);
  }

  async getUserScore(leaderboardKey: string, userId: string): Promise<number | null> {
    return this._exec(async () => {
      const score = await this.redis.zscore(leaderboardKey, userId);
      return score !== null ? Number(score) : null;
    }, null);
  }

  async getTotalCount(leaderboardKey: string): Promise<number> {
    return this._exec(() => this.redis.zcard(leaderboardKey), 0);
  }

  async removeUser(leaderboardKey: string, userId: string): Promise<void> {
    await this._exec(() => this.redis.zrem(leaderboardKey, userId), undefined);
  }

  async removeLeaderboard(leaderboardKey: string): Promise<void> {
    await this._exec(() => this.redis.del(leaderboardKey), undefined);
  }

  async getUsersInRange(
    leaderboardKey: string,
    minRank: number,
    maxRank: number,
  ): Promise<LeaderboardEntry[]> {
    return this._exec(async () => {
      const start = minRank - 1;
      const end = maxRank - 1;
      const results = await this.redis.zrevrange(leaderboardKey, start, end, 'WITHSCORES');
      return this._parseResults(results, start);
    }, []);
  }

  async getTopWithUserRank(
    leaderboardKey: string,
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ entries: LeaderboardEntry[]; userRank: LeaderboardEntry | null; totalCount: number }> {
    const [entries, userRank, totalCount] = await Promise.all([
      this.getTopUsers(leaderboardKey, page, limit),
      this._getUserEntry(leaderboardKey, userId),
      this.getTotalCount(leaderboardKey),
    ]);
    return { entries, userRank, totalCount };
  }

  // --- Cycle Keys ---

  // --- TTL Methods ---

  getTtlForCycle(cycle: string): number | null {
    switch (cycle) {
      case 'weekly': return LeaderboardRedisService.WEEKLY_TTL;
      case 'monthly': return LeaderboardRedisService.MONTHLY_TTL;
      default: return null;
    }
  }

  async setKeyExpiry(leaderboardKey: string, ttl: number | null): Promise<void> {
    if (ttl !== null) {
      await this._exec(() => this.redis.expire(leaderboardKey, ttl), undefined);
    }
  }

  // --- Cycle Keys ---

  getCycleKey(cycle: string, contestId?: string): string {
    switch (cycle) {
      case 'weekly': return LeaderboardRedisService.WEEKLY_KEY;
      case 'monthly': return LeaderboardRedisService.MONTHLY_KEY;
      case 'custom': return contestId ? this.getContestKey(contestId) : LeaderboardRedisService.GLOBAL_KEY;
      default: return LeaderboardRedisService.GLOBAL_KEY;
    }
  }

  static getStaticCycleKey(cycle: string): string {
    switch (cycle) {
      case 'weekly': return LeaderboardRedisService.WEEKLY_KEY;
      case 'monthly': return LeaderboardRedisService.MONTHLY_KEY;
      default: return LeaderboardRedisService.GLOBAL_KEY;
    }
  }

  // --- Contest-specific Keys ---

  getContestKey(contestId: string, cycle?: string): string {
    return `${LeaderboardRedisService.CONTEST_PREFIX}${contestId}`;
  }

  // --- Batch Operations ---

  async batchSetScores(
    leaderboardKey: string,
    scores: { userId: string; score: number }[],
  ): Promise<void> {
    if (scores.length === 0) return;
    await this._exec(async () => {
      const pipeline = this.redis.pipeline();
      for (const { userId, score } of scores) {
        pipeline.zadd(leaderboardKey, score, userId);
      }
      await pipeline.exec();
    }, undefined);
  }

  // --- Private Helpers ---

  private _parseResults(results: string[], startIndex: number): LeaderboardEntry[] {
    const entries: LeaderboardEntry[] = [];
    for (let i = 0; i < results.length; i += 2) {
      const userId = results[i];
      const score = Number(results[i + 1]);
      entries.push({
        userId,
        score,
        rank: startIndex + (i / 2) + 1,
      });
    }
    return entries;
  }

  private async _getUserEntry(
    leaderboardKey: string,
    userId: string,
  ): Promise<LeaderboardEntry | null> {
    const [rank, score] = await Promise.all([
      this.getUserRank(leaderboardKey, userId),
      this.getUserScore(leaderboardKey, userId),
    ]);
    if (rank === null || score === null) return null;
    return { userId, score, rank };
  }
}
