import { Injectable } from '@nestjs/common';
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
}
