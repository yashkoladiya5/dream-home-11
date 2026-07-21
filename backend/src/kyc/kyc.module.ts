import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Kyc } from './entities/kyc.entity';
import { KycService } from './kyc.service';
import { KycController } from './kyc.controller';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { ReferralModule } from '../referral/referral.module';
import { AuditModule } from '../audit/audit.module';
import { EncryptionModule } from '../common/encryption/encryption.module';
import { HttpModule } from '@nestjs/axios';
import { KycProviderService } from './kyc.provider.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Kyc, User]),
    UsersModule,
    ReferralModule,
    AuditModule,
    EncryptionModule,
    HttpModule,
  ],
  controllers: [KycController],
  providers: [KycService, KycProviderService],
  exports: [KycService, KycProviderService],
})
export class KycModule {}
