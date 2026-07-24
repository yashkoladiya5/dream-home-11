import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ContestMember } from '../contests/entities/contest-member.entity';
import { Contest } from '../contests/entities/contest.entity';
import { User } from '../users/entities/user.entity';
import { LeaderboardRedisService } from './leaderboard-redis.service';

@Injectable()
export class LeaderboardSyncService implements OnApplicationBootstrap {
  private readonly logger = new Logger(LeaderboardSyncService.name);
  private isSyncing = false;

  constructor(
    @InjectRepository(ContestMember)
    private readonly contestMemberRepo: Repository<ContestMember>,
    @InjectRepository(Contest)
    private readonly contestRepo: Repository<Contest>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly leaderboardRedis: LeaderboardRedisService,
  ) {}

  // --- Public Trigger Methods ---

  async syncAll(): Promise<{
    global: number;
    contests: number;
    contestCount: number;
  }> {
    this.logger.log('Starting full leaderboard sync...');
    const globalCount = await this.syncGlobalLeaderboard();
    const { memberCount, contestCount } =
      await this.syncAllContestLeaderboards();
    this.logger.log(
      `Full sync complete: ${globalCount} global users, ${memberCount} members across ${contestCount} contests`,
    );
    return { global: globalCount, contests: memberCount, contestCount };
  }

  async syncGlobalLeaderboard(): Promise<number> {
    const users = await this.userRepo.find({
      where: { isActive: true },
      select: {
        id: true,
        lifetimePoints: true,
        weeklyPoints: true,
        monthlyPoints: true,
      },
    });

    const lifetimeScores = users
      .filter((u) => u.lifetimePoints > 0)
      .map((u) => ({
        userId: u.id,
        score: u.lifetimePoints,
      }));
    await this.leaderboardRedis.batchSetScores(
      LeaderboardRedisService.GLOBAL_KEY,
      lifetimeScores,
    );

    const weeklyScores = users
      .filter((u) => u.weeklyPoints > 0)
      .map((u) => ({
        userId: u.id,
        score: u.weeklyPoints,
      }));
    await this.leaderboardRedis.batchSetScores(
      LeaderboardRedisService.WEEKLY_KEY,
      weeklyScores,
    );
    await this.leaderboardRedis.setKeyExpiry(
      LeaderboardRedisService.WEEKLY_KEY,
      LeaderboardRedisService.WEEKLY_TTL,
    );

    const monthlyScores = users
      .filter((u) => u.monthlyPoints > 0)
      .map((u) => ({
        userId: u.id,
        score: u.monthlyPoints,
      }));
    await this.leaderboardRedis.batchSetScores(
      LeaderboardRedisService.MONTHLY_KEY,
      monthlyScores,
    );
    await this.leaderboardRedis.setKeyExpiry(
      LeaderboardRedisService.MONTHLY_KEY,
      LeaderboardRedisService.MONTHLY_TTL,
    );

    this.logger.log(
      `Synced ${lifetimeScores.length} lifetime, ${weeklyScores.length} weekly, ${monthlyScores.length} monthly users`,
    );
    return lifetimeScores.length;
  }

  async syncAllContestLeaderboards(): Promise<{
    memberCount: number;
    contestCount: number;
  }> {
    const contests = await this.contestRepo.find();
    if (contests.length === 0) return { memberCount: 0, contestCount: 0 };

    const contestIds = contests.map((c) => c.id);
    const allMembers = await this.contestMemberRepo.find({
      where: { contestId: In(contestIds) },
      select: { userId: true, pointsEarned: true, contestId: true },
    });

    const membersByContest = new Map<string, typeof allMembers>();
    for (const member of allMembers) {
      const list = membersByContest.get(member.contestId) || [];
      list.push(member);
      membersByContest.set(member.contestId, list);
    }

    let totalMembers = 0;
    const pipeline = this.leaderboardRedis.batchSetScores.bind(
      this.leaderboardRedis,
    );
    const tasks: Promise<void>[] = [];

    for (const contest of contests) {
      const members = membersByContest.get(contest.id) || [];
      if (members.length === 0) continue;

      const scores = members.map((m) => ({
        userId: m.userId,
        score: m.pointsEarned,
      }));

      const contestKey = this.leaderboardRedis.getContestKey(contest.id);
      tasks.push(this.leaderboardRedis.batchSetScores(contestKey, scores));
      totalMembers += members.length;
    }

    await Promise.all(tasks);

    this.logger.log(
      `Synced ${totalMembers} members across ${contests.length} contest leaderboards`,
    );
    return { memberCount: totalMembers, contestCount: contests.length };
  }

  async syncContestLeaderboard(contestId: string): Promise<number> {
    const members = await this.contestMemberRepo.find({
      where: { contestId },
      select: { userId: true, pointsEarned: true },
    });

    if (members.length === 0) return 0;

    const scores = members.map((m) => ({
      userId: m.userId,
      score: m.pointsEarned,
    }));

    const contestKey = this.leaderboardRedis.getContestKey(contestId);
    await this.leaderboardRedis.batchSetScores(contestKey, scores);
    return members.length;
  }

  // --- Startup Sync ---

  async onApplicationBootstrap() {
    this.logger.log('Running initial leaderboard sync on startup...');
    try {
      await this.syncAll();
    } catch (err) {
      this.logger.warn(
        `Initial leaderboard sync failed (Redis may be unavailable): ${(err as Error).message}`,
      );
    }
  }

  // --- CRON Schedule ---

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCronSync() {
    if (this.isSyncing) {
      this.logger.warn('Sync already in progress, skipping CRON tick');
      return;
    }

    this.isSyncing = true;
    try {
      await this.syncAll();
    } catch (err) {
      this.logger.error(`CRON sync failed: ${(err as Error).message}`);
    } finally {
      this.isSyncing = false;
    }
  }
}
