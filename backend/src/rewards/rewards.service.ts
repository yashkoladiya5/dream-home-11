import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reward } from './entities/reward.entity';
import { RewardRedemption } from './entities/reward-redemption.entity';
import { User } from '../users/entities/user.entity';
import { PointsEngineService } from '../points/points-engine.service';

@Injectable()
export class RewardsService {
  constructor(
    @InjectRepository(Reward)
    private readonly rewardRepo: Repository<Reward>,
    @InjectRepository(RewardRedemption)
    private readonly redemptionRepo: Repository<RewardRedemption>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly pointsEngineService: PointsEngineService,
  ) {}

  async getCatalog(): Promise<Reward[]> {
    return this.rewardRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async getRewardById(id: string): Promise<Reward> {
    const reward = await this.rewardRepo.findOne({ where: { id } });
    if (!reward) throw new NotFoundException('Reward not found');
    return reward;
  }

  async redeemReward(userId: string, rewardId: string): Promise<RewardRedemption> {
    const reward = await this.rewardRepo.findOne({ where: { id: rewardId } });
    if (!reward) throw new NotFoundException('Reward not found');
    if (!reward.isActive) throw new BadRequestException('Reward is no longer available');
    if (reward.stock !== null && reward.stock <= 0) throw new BadRequestException('Reward is out of stock');

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (Number(user.pointsBalance) < reward.pointsRequired) {
      throw new BadRequestException('Insufficient points balance');
    }

    // Deduct points
    user.pointsBalance = Number(user.pointsBalance) - reward.pointsRequired;
    await this.userRepo.save(user);

    // Decrement stock if applicable
    if (reward.stock !== null) {
      reward.stock -= 1;
      await this.rewardRepo.save(reward);
    }

    // Create redemption record
    const redemption = this.redemptionRepo.create({
      userId,
      rewardId,
      pointsSpent: reward.pointsRequired,
      status: 'pending',
    });
    const saved = await this.redemptionRepo.save(redemption);

    // Log point spend (negative points action)
    await this.pointsEngineService.logPointAction(
      userId,
      'reward_redeem',
      reward.pointsRequired,
      1.0,
      -reward.pointsRequired,
    );

    // Return with reward relation
    return this.redemptionRepo.findOne({
      where: { id: saved.id },
      relations: { reward: true },
    }) as Promise<RewardRedemption>;
  }

  async getRedemptionHistory(userId: string): Promise<RewardRedemption[]> {
    return this.redemptionRepo.find({
      where: { userId },
      relations: { reward: true },
      order: { redeemedAt: 'DESC' },
    });
  }

  async getRedemptionById(id: string): Promise<RewardRedemption> {
    const redemption = await this.redemptionRepo.findOne({
      where: { id },
      relations: { reward: true },
    });
    if (!redemption) throw new NotFoundException('Redemption not found');
    return redemption;
  }
}
