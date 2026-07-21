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
import { Banner } from '../banners/entities/banner.entity';
import { PrizeHome } from '../prize-homes/entities/prize-home.entity';
import { Warning } from './entities/warning.entity';
import { FraudAlert } from './entities/fraud-alert.entity';
import { Reward } from '../rewards/entities/reward.entity';
import { Poll } from '../polls/entities/poll.entity';
import { Referral } from '../referral/entities/referral.entity';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { CompensationModule } from '../compensation/compensation.module';
import { ConsentModule } from '../common/consent/consent.module';
import { GdprModule } from '../gdpr/gdpr.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SmsModule } from '../sms/sms.module';
import { AuditModule } from '../audit/audit.module';

import { PenaltyExpiryCronService } from './penalty-expiry.cron';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Kyc,
      Contest,
      Transaction,
      Withdrawal,
      SupportTicket,
      SystemConfig,
      Banner,
      PrizeHome,
      Warning,
      FraudAlert,
      Reward,
      Poll,
      Referral,
    ]),
    forwardRef(() => UsersModule),
    forwardRef(() => AuthModule),
    CompensationModule,
    ConsentModule,
    GdprModule,
    AuditModule,
    NotificationsModule,
    SmsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, PenaltyExpiryCronService],
  exports: [AdminService],
})
export class AdminModule {}
