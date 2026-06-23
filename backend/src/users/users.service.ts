import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User, UserLevel } from './entities/user.entity';
import { ContestMember } from '../contests/entities/contest-member.entity';
import { Contest } from '../contests/entities/contest.entity';
import { PointsEngineService } from '../points/points-engine.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ContestMember)
    private readonly contestMemberRepository: Repository<ContestMember>,
    @InjectRepository(Contest)
    private readonly contestRepository: Repository<Contest>,
    private readonly pointsEngineService: PointsEngineService,
  ) {}

  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { phoneNumber } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: { kyc: true },
    });
  }

  async upsertUser(phoneNumber: string, deviceId: string): Promise<User> {
    let user = await this.findByPhoneNumber(phoneNumber);

    if (user) {
      user.deviceId = deviceId;
      return this.userRepository.save(user);
    }

    user = this.userRepository.create({
      phoneNumber,
      deviceId,
      currentTier: UserLevel.BRONZE,
      lifetimePoints: 0,
      pointsBalance: 0,
      walletBalanceInr: 0.0,
      isActive: true,
    });

    return this.userRepository.save(user);
  }

  async addCash(userId: string, amount: number): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.walletBalanceInr = Number(user.walletBalanceInr) + amount;
    return this.userRepository.save(user);
  }

  async joinContest(userId: string, entryFee: number, pointsEarned: number): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (Number(user.walletBalanceInr) < entryFee) {
      throw new BadRequestException('Insufficient wallet balance');
    }
    const multiplier = this.pointsEngineService.getMultiplier(user.currentTier);
    const finalPoints = this.pointsEngineService.calculatePoints(pointsEarned, user.currentTier);
    user.walletBalanceInr = Number(user.walletBalanceInr) - entryFee;
    user.pointsBalance = Number(user.pointsBalance) + finalPoints;
    user.lifetimePoints = Number(user.lifetimePoints) + finalPoints;

    // Update tier rank based on lifetime points
    if (user.lifetimePoints >= 5000) {
      user.currentTier = UserLevel.PLATINUM;
    } else if (user.lifetimePoints >= 2000) {
      user.currentTier = UserLevel.GOLD;
    } else if (user.lifetimePoints >= 1000) {
      user.currentTier = UserLevel.SILVER;
    }

    await this.userRepository.save(user);

    await this.pointsEngineService.logPointAction(userId, 'contest_join', pointsEarned, multiplier, finalPoints);

    return user;
  }

  async redeemReward(userId: string, pointsCost: number): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (Number(user.pointsBalance) < pointsCost) {
      throw new BadRequestException('Insufficient points balance');
    }
    user.pointsBalance = Number(user.pointsBalance) - pointsCost;
    return this.userRepository.save(user);
  }

  async updateProfile(
    userId: string,
    updateData: { fullName?: string; email?: string; avatarUrl?: string },
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateData.fullName !== undefined) {
      user.fullName = updateData.fullName;
    }
    if (updateData.email !== undefined) {
      if (updateData.email && !updateData.email.includes('@')) {
        throw new BadRequestException('Invalid email format');
      }
      user.email = updateData.email;
    }
    if (updateData.avatarUrl !== undefined) {
      user.avatarUrl = updateData.avatarUrl;
    }

    return this.userRepository.save(user);
  }

  async getMultiplierInfo(userId: string): Promise<{
    currentTier: string;
    currentMultiplier: number;
    lifetimePoints: number;
    pointsToNextTier: number | null;
    nextTier: string | null;
    nextMultiplier: number | null;
  }> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const { tier, multiplier } = this.pointsEngineService.getTierInfo(user.lifetimePoints);
    const { nextTier, nextMultiplier, pointsToNextTier } = this.pointsEngineService.getNextTierInfo(user.lifetimePoints);

    return {
      currentTier: tier,
      currentMultiplier: multiplier,
      lifetimePoints: user.lifetimePoints,
      pointsToNextTier,
      nextTier,
      nextMultiplier,
    };
  }

  async getUserStats(userId: string) {
    const memberEntries = await this.contestMemberRepository.find({ where: { userId } });
    const contestIds = memberEntries.map(m => m.contestId);

    const totalContestsJoined = memberEntries.length;
    const totalPointsEarned = memberEntries.reduce((sum, m) => sum + m.pointsEarned, 0);

    if (totalContestsJoined === 0) {
      return {
        totalContestsJoined: 0,
        totalContestsWon: 0,
        totalPointsEarned: 0,
        totalEntryFeesSpent: 0,
        averageRank: 0,
        bestRank: null,
        winRate: 0,
      };
    }

    let wonCount = 0;
    let totalRanks = 0;
    let bestRank = Number.MAX_SAFE_INTEGER;

    for (const contestId of contestIds) {
      const allMembers = await this.contestMemberRepository.find({
        where: { contestId },
        order: { pointsEarned: 'DESC', joinedAt: 'ASC' },
      });
      const rank = allMembers.findIndex(m => m.userId === userId) + 1;
      totalRanks += rank;
      if (rank < bestRank) bestRank = rank;
      if (rank === 1) wonCount++;
    }

    const contests = await this.contestRepository.find({
      where: { id: In(contestIds) },
    });
    const totalEntryFeesSpent = contests.reduce(
      (sum, c) => sum + Number(c.entryFeeInr),
      0,
    );

    const averageRank = Math.round((totalRanks / totalContestsJoined) * 10) / 10;
    const winRate = Math.round((wonCount / totalContestsJoined) * 100 * 10) / 10;

    return {
      totalContestsJoined,
      totalContestsWon: wonCount,
      totalPointsEarned,
      totalEntryFeesSpent,
      averageRank,
      bestRank,
      winRate,
    };
  }

  async getMyContests(userId: string): Promise<{ contests: any[] }> {
    const members = await this.contestMemberRepository.find({
      where: { userId },
      relations: { contest: true },
      order: { joinedAt: 'DESC' },
    });

    const contests = await Promise.all(members.map(async (member) => {
      const myPoints = member.pointsEarned;

      const rankResult = await this.contestMemberRepository
        .createQueryBuilder('cm')
        .select('COUNT(*)', 'rank')
        .where('cm.contestId = :contestId', { contestId: member.contestId })
        .andWhere('cm.pointsEarned > :myPoints', { myPoints })
        .getRawOne();
      const myRank = (rankResult?.rank || 0) + 1;

      return { ...member.contest, myPoints, myRank };
    }));

    return { contests };
  }
}

