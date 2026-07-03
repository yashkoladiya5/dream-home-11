import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, MoreThanOrEqual, In } from 'typeorm';
import { PointLog } from './entities/point-log.entity';

@Injectable()
export class PointsEngineService {
  private readonly TIER_MULTIPLIERS: Record<string, number> = {
    bronze: 1.0,
    silver: 1.1,
    gold: 1.25,
    platinum: 1.5,
  };

  private readonly DAILY_ACTIONS: Record<
    string,
    { name: string; description: string; basePoints: number; dailyCap: number }
  > = {
    app_open: {
      name: 'App Open',
      description: 'Open the app daily',
      basePoints: 10,
      dailyCap: 1,
    },
    notification_on: {
      name: 'Notification Toggle',
      description: 'Enable notifications',
      basePoints: 20,
      dailyCap: 1,
    },
    feed_like_comment: {
      name: 'Feed Engagement',
      description: 'Like or comment on posts',
      basePoints: 10,
      dailyCap: 5,
    },
    daily_login: {
      name: 'Daily Login',
      description: 'Log in to the app',
      basePoints: 10,
      dailyCap: 1,
    },
  };

  constructor(
    @InjectRepository(PointLog)
    private readonly pointLogRepo: Repository<PointLog>,
  ) {}

  getMultiplier(tier: string): number {
    return this.TIER_MULTIPLIERS[tier.toLowerCase()] ?? 1.0;
  }

  calculatePoints(basePoints: number, tier: string): number {
    return Math.round(basePoints * this.getMultiplier(tier));
  }

  async logPointAction(
    userId: string,
    action: string,
    basePoints: number,
    multiplier: number,
    finalPoints: number,
  ): Promise<PointLog> {
    const log = this.pointLogRepo.create({
      userId,
      action,
      basePoints,
      multiplier,
      finalPoints,
    });
    return this.pointLogRepo.save(log);
  }

  async logPointActionWithEntityManager(
    entityManager: EntityManager,
    userId: string,
    action: string,
    basePoints: number,
    multiplier: number,
    finalPoints: number,
  ): Promise<PointLog> {
    const log = entityManager.create(PointLog, {
      userId,
      action,
      basePoints,
      multiplier,
      finalPoints,
    });
    return entityManager.save(log);
  }

  getTierInfo(lifetimePoints: number): { tier: string; multiplier: number } {
    let tier: string;
    if (lifetimePoints >= 5000) {
      tier = 'platinum';
    } else if (lifetimePoints >= 2000) {
      tier = 'gold';
    } else if (lifetimePoints >= 1000) {
      tier = 'silver';
    } else {
      tier = 'bronze';
    }
    return { tier, multiplier: this.getMultiplier(tier) };
  }

  getNextTierInfo(lifetimePoints: number): {
    nextTier: string | null;
    nextMultiplier: number | null;
    pointsToNextTier: number | null;
  } {
    const thresholds = [
      { tier: 'silver', points: 1000, multiplier: 1.1 },
      { tier: 'gold', points: 2000, multiplier: 1.25 },
      { tier: 'platinum', points: 5000, multiplier: 1.5 },
    ];
    for (const t of thresholds) {
      if (lifetimePoints < t.points) {
        return {
          nextTier: t.tier,
          nextMultiplier: t.multiplier,
          pointsToNextTier: t.points - lifetimePoints,
        };
      }
    }
    return { nextTier: null, nextMultiplier: null, pointsToNextTier: null };
  }

  async getTodayActionCount(userId: string, action: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const count = await this.pointLogRepo.count({
      where: {
        userId,
        action,
        createdAt: MoreThanOrEqual(today),
      },
    });
    return count;
  }

  async canPerformAction(
    userId: string,
    action: string,
  ): Promise<{
    canPerform: boolean;
    todayCount: number;
    dailyCap: number;
    reason?: string;
  }> {
    const def = this.DAILY_ACTIONS[action];
    if (!def) {
      return {
        canPerform: false,
        todayCount: 0,
        dailyCap: 0,
        reason: 'Unknown action',
      };
    }
    const todayCount = await this.getTodayActionCount(userId, action);
    if (todayCount >= def.dailyCap) {
      return {
        canPerform: false,
        todayCount,
        dailyCap: def.dailyCap,
        reason: 'Daily cap reached',
      };
    }
    return { canPerform: true, todayCount, dailyCap: def.dailyCap };
  }

  async getTodayActionsStatus(userId: string): Promise<{
    actions: {
      action: string;
      name: string;
      description: string;
      basePoints: number;
      dailyCap: number;
      todayCount: number;
      canPerform: boolean;
      reason?: string;
    }[];
    todayPoints: number;
    maxDailyPoints: number;
  }> {
    const actionKeys = Object.keys(this.DAILY_ACTIONS);
    let todayPoints = 0;
    let maxDailyPoints = 0;

    const actions = await Promise.all(
      actionKeys.map(async (key) => {
        const def = this.DAILY_ACTIONS[key];
        const status = await this.canPerformAction(userId, key);
        maxDailyPoints += def.basePoints * def.dailyCap;
        return {
          action: key,
          name: def.name,
          description: def.description,
          basePoints: def.basePoints,
          dailyCap: def.dailyCap,
          todayCount: status.todayCount,
          canPerform: status.canPerform,
          reason: status.reason,
        };
      }),
    );

    // Calculate today's total earned points for these actions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayLogs = await this.pointLogRepo.find({
      where: {
        userId,
        action: In(actionKeys),
        createdAt: MoreThanOrEqual(today),
      },
    });
    todayPoints = todayLogs.reduce((sum, log) => sum + log.finalPoints, 0);

    return { actions, todayPoints, maxDailyPoints };
  }

  async performDailyAction(
    userId: string,
    action: string,
    tier: string,
  ): Promise<{
    success: boolean;
    action: string;
    basePoints: number;
    multiplier: number;
    finalPoints: number;
    todayCount: number;
    dailyCap: number;
    canPerform: boolean;
    reason?: string;
    lifetimePoints: number;
    currentTier: string;
  } | null> {
    const def = this.DAILY_ACTIONS[action];
    if (!def) return null;

    const status = await this.canPerformAction(userId, action);
    if (!status.canPerform) {
      return {
        success: false,
        action,
        basePoints: def.basePoints,
        multiplier: this.getMultiplier(tier),
        finalPoints: 0,
        todayCount: status.todayCount,
        dailyCap: def.dailyCap,
        canPerform: false,
        reason: status.reason,
        lifetimePoints: 0,
        currentTier: tier,
      };
    }

    const multiplier = this.getMultiplier(tier);
    const finalPoints = this.calculatePoints(def.basePoints, tier);

    await this.logPointAction(
      userId,
      action,
      def.basePoints,
      multiplier,
      finalPoints,
    );

    return {
      success: true,
      action,
      basePoints: def.basePoints,
      multiplier,
      finalPoints,
      todayCount: status.todayCount + 1,
      dailyCap: def.dailyCap,
      canPerform: status.todayCount + 1 < def.dailyCap,
      lifetimePoints: 0,
      currentTier: tier,
    };
  }
}
