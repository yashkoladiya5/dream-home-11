import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Withdrawal } from './entities/withdrawal.entity';
import { WithdrawalsService } from './withdrawals.service';
import { WithdrawalsController } from './withdrawals.controller';
import { User } from '../users/entities/user.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Kyc } from '../kyc/entities/kyc.entity';
import { UsersModule } from '../users/users.module';
import { AuditModule } from '../audit/audit.module';
import { EncryptionModule } from '../common/encryption/encryption.module';
import { AppConfigModule } from '../config/config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Withdrawal, User, Transaction, Kyc]),
    UsersModule,
    AuditModule,
    EncryptionModule,
    AppConfigModule,
  ],
  controllers: [WithdrawalsController],
  providers: [WithdrawalsService],
  exports: [WithdrawalsService],
})
export class WithdrawalsModule {}
