import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

export const DEFAULT_TTL = 300;
export const USER_TTL = 600;
export const CONTEST_TTL = 120;
export const LEADERBOARD_TTL = 60;
export const BANNER_TTL = 900;

@Injectable()
export class RedisCacheService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds !== undefined && ttlSeconds > 0) {
      await this.redis.setex(key, ttlSeconds, serialized);
    } else {
      await this.redis.set(key, serialized);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async delPattern(pattern: string): Promise<void> {
    let cursor = '0';
    do {
      const result = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = result[0];
      const keys = result[1];
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } while (cursor !== '0');
  }

  async wrap<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const result = await fn();
    await this.set(key, result, ttlSeconds);
    return result;
  }

  async invalidatePrefix(prefix: string): Promise<void> {
    await this.delPattern(`${prefix}*`);
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }
}
