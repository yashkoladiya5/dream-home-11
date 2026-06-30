import { Injectable, Inject } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Injectable()
export class RedisThrottlerStorageService implements ThrottlerStorage {
  private fallbackStore = new Map<string, { count: number; expiresAt: number; blockedUntil?: number }>();

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<{ totalHits: number; timeToExpire: number; isBlocked: boolean; timeToBlockExpire: number }> {
    // Graceful fallback if Redis is not connected or ready
    if (this.redis.status !== 'ready') {
      return this.fallbackIncrement(key, ttl, limit, blockDuration, throttlerName);
    }

    try {
      const redisKey = `throttler:${throttlerName}:${key}`;
      const blockKey = `throttler:block:${throttlerName}:${key}`;

      // 1. Check if blocked
      const isBlockedVal = await this.redis.get(blockKey);
      if (isBlockedVal) {
        const ttlRemaining = await this.redis.ttl(blockKey);
        const blockTtlMs = ttlRemaining > 0 ? ttlRemaining * 1000 : blockDuration;
        return {
          totalHits: limit + 1,
          timeToExpire: blockTtlMs,
          isBlocked: true,
          timeToBlockExpire: blockTtlMs,
        };
      }

      // 2. Increment count atomically
      const multi = this.redis.multi();
      multi.incr(redisKey);
      multi.pttl(redisKey);
      const results = await multi.exec();

      if (!results || results.length < 2) {
        throw new Error('Redis exec failed');
      }

      const incrResult = results[0];
      const pttlResult = results[1];

      const count = Number(Array.isArray(incrResult) ? incrResult[1] : incrResult);
      let pttl = Number(Array.isArray(pttlResult) ? pttlResult[1] : pttlResult);

      if (pttl < 0) {
        await this.redis.pexpire(redisKey, ttl);
        pttl = ttl;
      }

      // 3. If limit exceeded, set block key
      if (count > limit) {
        await this.redis.set(blockKey, '1', 'PX', blockDuration);
        return {
          totalHits: count,
          timeToExpire: blockDuration,
          isBlocked: true,
          timeToBlockExpire: blockDuration,
        };
      }

      return {
        totalHits: count,
        timeToExpire: pttl,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    } catch (_) {
      // Fallback on any runtime Redis error
      return this.fallbackIncrement(key, ttl, limit, blockDuration, throttlerName);
    }
  }

  private fallbackIncrement(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): { totalHits: number; timeToExpire: number; isBlocked: boolean; timeToBlockExpire: number } {
    const now = Date.now();
    const mapKey = `throttler:${throttlerName}:${key}`;
    const record = this.fallbackStore.get(mapKey);

    if (record && record.blockedUntil && record.blockedUntil > now) {
      const blockTtlMs = record.blockedUntil - now;
      return {
        totalHits: limit + 1,
        timeToExpire: blockTtlMs,
        isBlocked: true,
        timeToBlockExpire: blockTtlMs,
      };
    }

    if (!record || record.expiresAt < now) {
      const newRecord = { count: 1, expiresAt: now + ttl };
      this.fallbackStore.set(mapKey, newRecord);
      return {
        totalHits: 1,
        timeToExpire: ttl,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }

    record.count += 1;
    if (record.count > limit) {
      record.blockedUntil = now + blockDuration;
      return {
        totalHits: record.count,
        timeToExpire: blockDuration,
        isBlocked: true,
        timeToBlockExpire: blockDuration,
      };
    }

    return {
      totalHits: record.count,
      timeToExpire: record.expiresAt - now,
      isBlocked: false,
      timeToBlockExpire: 0,
    };
  }
}
