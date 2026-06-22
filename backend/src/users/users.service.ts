import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserLevel } from './entities/user.entity';
import { ContestMember } from '../contests/entities/contest-member.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ContestMember)
    private readonly contestMemberRepository: Repository<ContestMember>,
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
    user.walletBalanceInr = Number(user.walletBalanceInr) - entryFee;
    user.pointsBalance = Number(user.pointsBalance) + pointsEarned;
    user.lifetimePoints = Number(user.lifetimePoints) + pointsEarned;
    
    // Update tier rank based on lifetime points
    if (user.lifetimePoints >= 5000) {
      user.currentTier = UserLevel.PLATINUM;
    } else if (user.lifetimePoints >= 2000) {
      user.currentTier = UserLevel.GOLD;
    } else if (user.lifetimePoints >= 1000) {
      user.currentTier = UserLevel.SILVER;
    }

    return this.userRepository.save(user);
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

