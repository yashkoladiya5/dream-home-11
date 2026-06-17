import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserLevel } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
}

