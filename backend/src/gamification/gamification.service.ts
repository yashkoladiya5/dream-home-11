import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { REDIS_CLIENT } from '../redis/redis.constants';
import Redis from 'ioredis';
import { User, UserLevel } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { PointsEngineService } from '../points/points-engine.service';
import { TransactionsService } from '../transactions/transactions.service';

export interface SpinResult {
  success: boolean;
  segmentIndex: number;
  prizePoints: number;
  tier: string;
  message: string;
  canSpinAgain: boolean;
  nextAvailableSpin: string | null;
}

@Injectable()
export class GamificationService {
  private readonly TIER_SEGMENTS: Record<string, number[]> = {
    bronze: [10, 12, 14, 15, 16, 18, 20],
    silver: [15, 18, 20, 22, 25, 28, 30],
    gold: [20, 25, 28, 30, 32, 35, 40],
    platinum: [30, 35, 38, 40, 42, 45, 50],
  };

  private readonly DAILY_SPIN_KEY_PREFIX = 'spin:daily:';

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly usersService: UsersService,
    private readonly pointsEngineService: PointsEngineService,
    private readonly transactionsService: TransactionsService,
  ) {}

  async spin(userId: string): Promise<SpinResult> {
    // Atomic SET NX prevents concurrent daily-spin race conditions
    const key = this.DAILY_SPIN_KEY_PREFIX + userId;
    const ttl = this.getSecondsUntilEndOfDay();
    let limitExceeded = false;
    try {
      const result = await this.redis.set(key, '1', 'EX', ttl, 'NX');
      limitExceeded = result === null;
    } catch {
      // Redis unavailable — let the spin proceed (graceful degradation)
    }
    if (limitExceeded) {
      const nextSpin = this.getNextAvailableSpin();
      return {
        success: false,
        segmentIndex: -1,
        prizePoints: 0,
        tier: '',
        message: 'Daily spin limit reached. Come back tomorrow!',
        canSpinAgain: false,
        nextAvailableSpin: nextSpin,
      };
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.isActive) {
      throw new BadRequestException('User account is inactive');
    }

    const tier = user.currentTier || 'bronze';
    const segments =
      this.TIER_SEGMENTS[tier.toLowerCase()] || this.TIER_SEGMENTS.bronze;
    const segmentIndex = Math.floor(Math.random() * segments.length);
    const prizePoints = segments[segmentIndex];

    const prevLifetime = Number(user.lifetimePoints);
    const prevPoints = Number(user.pointsBalance);
    user.lifetimePoints = prevLifetime + prizePoints;
    user.pointsBalance = prevPoints + prizePoints;

    if (user.lifetimePoints >= 5000) {
      user.currentTier = UserLevel.PLATINUM;
    } else if (user.lifetimePoints >= 2000) {
      user.currentTier = UserLevel.GOLD;
    } else if (user.lifetimePoints >= 1000) {
      user.currentTier = UserLevel.SILVER;
    }

    await this.userRepo.save(user);

    await this.pointsEngineService.logPointAction(
      userId,
      'spin_wheel',
      prizePoints,
      1.0,
      prizePoints,
    );

    await this.transactionsService.logTransaction({
      userId,
      type: 'points_earned',
      pointsAmount: prizePoints,
      pointsBalanceBefore: prevPoints,
      pointsBalanceAfter: user.pointsBalance,
      description: `Spin Wheel: Won ${prizePoints} points (${tier} tier)`,
      referenceType: 'spin_wheel',
    });

    const nextSpin = this.getNextAvailableSpin();
    return {
      success: true,
      segmentIndex,
      prizePoints,
      tier: tier.toLowerCase(),
      message: `Congratulations! You won ${prizePoints} points!`,
      canSpinAgain: false,
      nextAvailableSpin: nextSpin,
    };
  }

  async canSpinToday(userId: string): Promise<boolean> {
    try {
      const key = this.DAILY_SPIN_KEY_PREFIX + userId;
      const exists = await this.redis.get(key);
      return exists === null;
    } catch {
      return true;
    }
  }

  async getSpinStatus(userId: string): Promise<{
    canSpin: boolean;
    nextAvailableSpin: string | null;
  }> {
    const canSpin = await this.canSpinToday(userId);
    return {
      canSpin,
      nextAvailableSpin: canSpin ? null : this.getNextAvailableSpin(),
    };
  }

  private getSecondsUntilEndOfDay(): number {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    return Math.ceil((endOfDay.getTime() - now.getTime()) / 1000);
  }

  private getNextAvailableSpin(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.toISOString();
  }
}
