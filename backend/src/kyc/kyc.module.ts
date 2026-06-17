import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Kyc } from './entities/kyc.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Kyc])],
  exports: [TypeOrmModule],
})
export class KycModule {}
