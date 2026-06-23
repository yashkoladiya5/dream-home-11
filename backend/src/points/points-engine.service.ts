import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { PointLog } from './entities/point-log.entity';

@Injectable()
export class PointsEngineService {
  private readonly TIER_MULTIPLIERS: Record<string, number> = {
    bronze: 1.0,
    silver: 1.1,
    gold: 1.25,
    platinum: 1.5,
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
}
