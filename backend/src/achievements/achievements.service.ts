import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';
import { ContestMember } from '../contests/entities/contest-member.entity';
import { Share } from '../share-tracker/entities/share.entity';
import { RewardRedemption } from '../rewards/entities/reward-redemption.entity';
import { User } from '../users/entities/user.entity';
import { PointsEngineService } from '../points/points-engine.service';

export interface AchievementProgress {
  id: string;
  key: string;
  title: string;
  description: string | null;
  icon: string | null;
  bonusPoints: number;
  sortOrder: number;
  earned: boolean;
  earnedAt: Date | null;
}

@Injectable()
export class AchievementsService {
  private readonly logger = new Logger(AchievementsService.name);

  constructor(
    @InjectRepository(Achievement)
    private readonly achievementRepo: Repository<Achievement>,
    @InjectRepository(UserAchievement)
    private readonly userAchievementRepo: Repository<UserAchievement>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ContestMember)
    private readonly contestMemberRepo: Repository<ContestMember>,
    @InjectRepository(Share)
    private readonly shareRepo: Repository<Share>,
    @InjectRepository(RewardRedemption)
    private readonly redemptionRepo: Repository<RewardRedemption>,
    private readonly pointsEngineService: PointsEngineService,
  ) {}

  async getAchievementsWithProgress(userId: string): Promise<AchievementProgress[]> {
    const allAchievements = await this.achievementRepo.find({
      order: { sortOrder: 'ASC' },
    });
    const userAchievements = await this.userAchievementRepo.find({
      where: { userId },
      relations: { achievement: true },
    });

    const earnedMap = new Map<string, Date>();
    for (const ua of userAchievements) {
      earnedMap.set(ua.achievementId, ua.earnedAt);
    }

    return allAchievements.map((a) => ({
      id: a.id,
      key: a.key,
      title: a.title,
      description: a.description,
      icon: a.icon,
      bonusPoints: a.bonusPoints,
      sortOrder: a.sortOrder,
      earned: earnedMap.has(a.id),
      earnedAt: earnedMap.get(a.id) ?? null,
    }));
  }

  async checkAndAwardAchievements(userId: string): Promise<AchievementProgress[]> {
    const all = await this.getAchievementsWithProgress(userId);
    const alreadyEarned = new Set(all.filter((a) => a.earned).map((a) => a.key));

    const [contestCount, shareCount, redemptionCount, user] = await Promise.all([
      this.contestMemberRepo.count({ where: { userId } }),
      this.shareRepo.count({ where: { userId } }),
      this.redemptionRepo.count({ where: { userId } }),
      this.userRepo.findOne({ where: { id: userId } }),
    ]);

    if (!user) return all;

    const lifetimePoints = user.lifetimePoints;
    const currentStreak = user.currentStreak;

    for (const achievement of all) {
      if (alreadyEarned.has(achievement.key)) continue;

      let earned = false;

      switch (achievement.key) {
        case 'first_contest':
          earned = contestCount >= 1;
          break;
        case 'ten_contests':
          earned = contestCount >= 10;
          break;
        case 'fifty_contests':
          earned = contestCount >= 50;
          break;
        case 'streak_7':
          earned = currentStreak >= 7;
          break;
        case 'streak_30':
          earned = currentStreak >= 30;
          break;
        case 'share_first':
          earned = shareCount >= 1;
          break;
        case 'share_ten':
          earned = shareCount >= 10;
          break;
        case 'points_5000':
          earned = lifetimePoints >= 5000;
          break;
        case 'points_10000':
          earned = lifetimePoints >= 10000;
          break;
        case 'first_redeem':
          earned = redemptionCount >= 1;
          break;
      }

      if (earned) {
        const ach = await this.achievementRepo.findOne({ where: { key: achievement.key } });
        if (!ach) continue;

        await this.userAchievementRepo.save(
          this.userAchievementRepo.create({ userId, achievementId: ach.id }),
        );

        if (ach.bonusPoints > 0) {
          const multiplier = this.pointsEngineService.getMultiplier(user.currentTier);
          const finalPoints = this.pointsEngineService.calculatePoints(ach.bonusPoints, user.currentTier);
          user.pointsBalance = Number(user.pointsBalance) + finalPoints;
          user.lifetimePoints = Number(user.lifetimePoints) + finalPoints;

          if (user.lifetimePoints >= 5000) {
            user.currentTier = 'platinum' as any;
          } else if (user.lifetimePoints >= 2000) {
            user.currentTier = 'gold' as any;
          } else if (user.lifetimePoints >= 1000) {
            user.currentTier = 'silver' as any;
          }

          await this.userRepo.save(user);
          await this.pointsEngineService.logPointAction(
            userId,
            'achievement_bonus',
            ach.bonusPoints,
            multiplier,
            finalPoints,
          );
        }

        this.logger.log(`🏆 User ${userId} earned achievement: ${achievement.key}`);
      }
    }

    return this.getAchievementsWithProgress(userId);
  }
}
