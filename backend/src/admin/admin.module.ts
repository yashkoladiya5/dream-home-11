import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../users/entities/user.entity';
import { Kyc } from '../kyc/entities/kyc.entity';
import { Contest } from '../contests/entities/contest.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Withdrawal } from '../withdrawals/entities/withdrawal.entity';
import { SupportTicket } from '../support/entities/support-ticket.entity';
import { SystemConfig } from '../config/entities/system-config.entity';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { CompensationModule } from '../compensation/compensation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Kyc, Contest, Transaction, Withdrawal, SupportTicket, SystemConfig]),
    forwardRef(() => UsersModule),
    forwardRef(() => AuthModule),
    CompensationModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
