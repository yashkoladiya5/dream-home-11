import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class StreakService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async updateStreak(userId: string): Promise<{
    currentStreak: number;
    bonusAwarded: boolean;
    bonusPoints: number;
    longestStreak: number;
  }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = user.currentStreak || 0;
    const lastDate = user.lastStreakDate;

    if (lastDate) {
      const last = new Date(lastDate);
      last.setHours(0, 0, 0, 0);
      const diffDays = Math.round(
        (today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays === 0) {
        return {
          currentStreak: streak,
          bonusAwarded: false,
          bonusPoints: 0,
          longestStreak: user.longestStreak || 0,
        };
      } else if (diffDays === 1) {
        streak += 1;
      } else {
        streak = 1;
      }
    } else {
      streak = 1;
    }

    user.currentStreak = streak;
    user.lastStreakDate = today;
    if (streak > (user.longestStreak || 0)) {
      user.longestStreak = streak;
    }

    let bonusPoints = 0;
    if (streak === 7) bonusPoints = 100;
    else if (streak === 30) bonusPoints = 600;

    if (bonusPoints > 0) {
      user.pointsBalance = Number(user.pointsBalance) + bonusPoints;
      user.lifetimePoints = Number(user.lifetimePoints) + bonusPoints;
    }

    await this.userRepo.save(user);

    return {
      currentStreak: streak,
      bonusAwarded: bonusPoints > 0,
      bonusPoints,
      longestStreak: user.longestStreak || 0,
    };
  }

  async getStreakInfo(userId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    lastStreakDate: string | null;
    nextMilestone: number | null;
    daysToNextMilestone: number | null;
    nextMilestoneReward: number | null;
  }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const milestones = [
      { days: 7, reward: 100 },
      { days: 30, reward: 600 },
    ];

    const streak = user.currentStreak || 0;
    let nextMilestone: number | null = null;
    let daysToNextMilestone: number | null = null;
    let nextMilestoneReward: number | null = null;

    for (const m of milestones) {
      if (streak < m.days) {
        nextMilestone = m.days;
        daysToNextMilestone = m.days - streak;
        nextMilestoneReward = m.reward;
        break;
      }
    }

    return {
      currentStreak: streak,
      longestStreak: user.longestStreak || 0,
      lastStreakDate: user.lastStreakDate
        ? typeof user.lastStreakDate === 'string'
          ? user.lastStreakDate
          : user.lastStreakDate.toISOString()
        : null,
      nextMilestone,
      daysToNextMilestone,
      nextMilestoneReward,
    };
  }

  async applyMissedDayPenalties(): Promise<number> {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 1);
    twoDaysAgo.setHours(0, 0, 0, 0);

    const users = await this.userRepo.find({
      where: {
        lastStreakDate: LessThan(twoDaysAgo),
        isActive: true,
      },
    });

    let penaltyCount = 0;
    for (const user of users) {
      user.pointsBalance = Math.max(0, Number(user.pointsBalance) - 200);
      user.currentStreak = 0;
      await this.userRepo.save(user);
      penaltyCount++;
    }

    return penaltyCount;
  }
}
