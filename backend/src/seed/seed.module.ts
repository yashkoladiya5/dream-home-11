import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contest } from '../contests/entities/contest.entity';
import { ContestMember } from '../contests/entities/contest-member.entity';
import { User } from '../users/entities/user.entity';
import { Reward } from '../rewards/entities/reward.entity';
import { Banner } from '../banners/entities/banner.entity';
import { Achievement } from '../achievements/entities/achievement.entity';
import { PrizeHome } from '../prize-homes/entities/prize-home.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { SavedPaymentMethod } from '../payment-methods/entities/saved-payment-method.entity';
import { Kyc } from '../kyc/entities/kyc.entity';
import { Withdrawal } from '../withdrawals/entities/withdrawal.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([Contest, ContestMember, User, Reward, Banner, Achievement, PrizeHome, Transaction, SavedPaymentMethod, Kyc, Withdrawal])],
  providers: [SeedService],
})
export class SeedModule {}
