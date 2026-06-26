import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisLogger } from './redis-logger';
import { REDIS_CLIENT } from './redis.constants';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('REDIS_HOST', 'localhost');
        const port = config.get<number>('REDIS_PORT', 6379);
        const client = new Redis({
          host,
          port,
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => {
            if (times > 5) return null;
            return Math.min(times * 200, 3000);
          },
          lazyConnect: true,
        });
        client.on('error', () => {});
        return client;
      },
    },
    RedisLogger,
  ],
  exports: [REDIS_CLIENT, RedisLogger],
})
export class RedisModule {}
