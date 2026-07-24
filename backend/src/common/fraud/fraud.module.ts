import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FraudService } from './fraud.service';
import { Withdrawal } from '../../withdrawals/entities/withdrawal.entity';
import { User } from '../../users/entities/user.entity';
import { FraudAlert } from '../../admin/entities/fraud-alert.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Withdrawal, User, FraudAlert])],
  providers: [FraudService],
  exports: [FraudService],
})
export class FraudModule {}
