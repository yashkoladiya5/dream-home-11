import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';
import { CACHE_TTL, CACHE_KEY_PREFIXES } from './cache-ttl.config';

export const DEFAULT_TTL = 300;
export const USER_TTL = 600;
export const CONTEST_TTL = 120;
export const LEADERBOARD_TTL = 60;
export const BANNER_TTL = 900;

export { CACHE_TTL, CACHE_KEY_PREFIXES };

@Injectable()
export class RedisCacheService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

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
    const serialized =
      typeof value === 'string' ? value : JSON.stringify(value);
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
      const result = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );
      cursor = result[0];
      const keys = result[1];
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } while (cursor !== '0');
  }

  async wrap<T>(
    key: string,
    ttlSeconds: number,
    fn: () => Promise<T>,
  ): Promise<T> {
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

  buildKey(prefix: string, ...parts: string[]): string {
    return [prefix, ...parts].join(':');
  }

  buildResponseKey(path: string, queryHash: string): string {
    return this.buildKey(CACHE_KEY_PREFIXES.RESPONSE, path, queryHash);
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (keys.length === 0) return [];
    const raw = await this.redis.mget(keys);
    return raw.map((r) => {
      if (r === null) return null;
      try {
        return JSON.parse(r) as T;
      } catch {
        return r as unknown as T;
      }
    });
  }

  async mset(
    items: { key: string; value: any; ttl?: number }[],
  ): Promise<void> {
    if (items.length === 0) return;
    const multi = this.redis.multi();
    for (const { key, value, ttl } of items) {
      const serialized =
        typeof value === 'string' ? value : JSON.stringify(value);
      if (ttl !== undefined && ttl > 0) {
        multi.setex(key, ttl, serialized);
      } else {
        multi.set(key, serialized);
      }
    }
    await multi.exec();
  }

  async ttl(key: string): Promise<number | null> {
    const remaining = await this.redis.ttl(key);
    return remaining >= 0 ? remaining : null;
  }

  async exists(key: string): Promise<boolean> {
    const count = await this.redis.exists(key);
    return count > 0;
  }

  async incr(key: string, ttlSeconds?: number): Promise<number> {
    const val = await this.redis.incr(key);
    if (ttlSeconds && ttlSeconds > 0) {
      await this.redis.expire(key, ttlSeconds);
    }
    return val;
  }
}
