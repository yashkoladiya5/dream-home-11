import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { BatchController } from './batch.controller';

@Module({
  imports: [AuditModule],
  controllers: [BatchController],
})
export class BatchModule {}
