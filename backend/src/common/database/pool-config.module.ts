import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PoolConfigService } from './pool-config.service';

@Module({
  imports: [ConfigModule],
  providers: [PoolConfigService],
  exports: [PoolConfigService],
})
export class PoolConfigModule {}
