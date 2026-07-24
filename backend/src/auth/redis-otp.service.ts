import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RedisCacheService } from '../redis/redis-cache.service';

const OTP_PREFIX = 'otp:';
const OTP_TTL = 300;
const MAX_ATTEMPTS = 3;
const RATE_LIMIT_PREFIX = 'otp:rate:';
const RATE_LIMIT_TTL = 60;
const RATE_LIMIT_MAX = 5;

@Injectable()
export class RedisOtpService {
  constructor(private readonly redisCache: RedisCacheService) {}

  async storeOtp(phoneNumber: string, code: string): Promise<void> {
    const key = `${OTP_PREFIX}${phoneNumber}`;
    await this.redisCache.set(key, { code, attempts: 0 }, OTP_TTL);
  }

  async verifyOtp(phoneNumber: string, code: string): Promise<boolean> {
    const key = `${OTP_PREFIX}${phoneNumber}`;
    const stored = await this.redisCache.get<{
      code: string;
      attempts: number;
    }>(key);

    if (!stored) {
      throw new UnauthorizedException('OTP not found or expired');
    }

    if (stored.attempts >= MAX_ATTEMPTS) {
      await this.redisCache.del(key);
      throw new UnauthorizedException(
        'Too many failed attempts. Please request a new OTP.',
      );
    }

    if (stored.code !== code) {
      await this.redisCache.set(
        key,
        { ...stored, attempts: stored.attempts + 1 },
        OTP_TTL,
      );
      throw new UnauthorizedException('Invalid OTP code');
    }

    await this.redisCache.del(key);
    return true;
  }

  async checkRateLimit(phoneNumber: string): Promise<boolean> {
    const key = `${RATE_LIMIT_PREFIX}${phoneNumber}`;
    const count = await this.redisCache.incr(key, RATE_LIMIT_TTL);
    return count <= RATE_LIMIT_MAX;
  }

  async getRemainingAttempts(phoneNumber: string): Promise<number> {
    const key = `${OTP_PREFIX}${phoneNumber}`;
    const stored = await this.redisCache.get<{
      code: string;
      attempts: number;
    }>(key);
    if (!stored) return 0;
    return Math.max(0, MAX_ATTEMPTS - stored.attempts);
  }
}
