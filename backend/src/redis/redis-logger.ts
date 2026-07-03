import {
  Inject,
  Injectable,
  OnModuleInit,
  Logger,
  Optional,
} from '@nestjs/common';
import { REDIS_CLIENT } from './redis.constants';
import Redis from 'ioredis';

@Injectable()
export class RedisLogger implements OnModuleInit {
  private readonly logger = new Logger(RedisLogger.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onModuleInit() {
    try {
      await this.redis.connect();
      this.logger.log('Redis client connected successfully');
      await this.redis.ping();
      this.logger.log('Redis ping successful');
    } catch (err) {
      this.logger.warn(
        `Redis connection failed: ${(err as Error).message}. Leaderboard features will be degraded.`,
      );
    }
  }
}
