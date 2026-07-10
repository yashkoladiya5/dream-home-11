import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsentService } from './consent.service';
import { ConsentRecord } from '../entities/consent-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ConsentRecord])],
  providers: [ConsentService],
  exports: [ConsentService],
})
export class ConsentModule {}
