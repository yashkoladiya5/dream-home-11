import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Kyc } from '../kyc/entities/kyc.entity';
import { ContestMember } from '../contests/entities/contest-member.entity';
import { Contest } from '../contests/entities/contest.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { CompensationLog } from '../compensation/entities/compensation.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { EncryptionModule } from '../common/encryption/encryption.module';
import { ConsentModule } from '../common/consent/consent.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Kyc,
      ContestMember,
      Contest,
      Transaction,
      CompensationLog,
    ]),
    EncryptionModule,
    ConsentModule,
    forwardRef(() => WalletModule),
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [TypeOrmModule, UsersService],
})
export class UsersModule {}
