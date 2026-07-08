import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Kyc } from '../kyc/entities/kyc.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { ContestMember } from '../contests/entities/contest-member.entity';
import { PointLog } from '../points/entities/point-log.entity';
import { Withdrawal } from '../withdrawals/entities/withdrawal.entity';
import { Referral } from '../referral/entities/referral.entity';
import { CompensationLog } from '../compensation/entities/compensation.entity';
import { GdprService } from './gdpr.service';
import { GdprController } from './gdpr.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Kyc,
      Wallet,
      Transaction,
      ContestMember,
      PointLog,
      Withdrawal,
      Referral,
      CompensationLog,
    ]),
    UsersModule,
  ],
  controllers: [GdprController],
  providers: [GdprService],
  exports: [GdprService],
})
export class GdprModule {}
