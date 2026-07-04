import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../../redis/redis.constants';
import { RATE_LIMIT_KEY } from '../decorators/rate-limit.decorator';
import { AuditLogService } from '../audit/audit-log.service';

const LIMIT_CONFIGS: Record<string, { limit: number; ttl: number }> = {
  auth: { limit: parseInt(process.env.RATE_LIMIT_AUTH || '5', 10), ttl: 60000 },
  'contest-join': {
    limit: parseInt(process.env.RATE_LIMIT_CONTEST_JOIN || '10', 10),
    ttl: 60000,
  },
  wallet: {
    limit: parseInt(process.env.RATE_LIMIT_WALLET || '10', 10),
    ttl: 60000,
  },
  kyc: { limit: parseInt(process.env.RATE_LIMIT_KYC || '5', 10), ttl: 60000 },
  api: { limit: parseInt(process.env.RATE_LIMIT_API || '60', 10), ttl: 60000 },
};

@Injectable()
export class UserRateLimitGuard implements CanActivate {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly reflector: Reflector,
    private readonly auditLogService: AuditLogService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const url: string = request.url || '';
    const method: string = request.method || '';

    if (url.startsWith('/health') || url.startsWith('/metrics')) return true;

    const rateLimitMeta = this.reflector.getAllAndOverride<{
      group: string;
      limit?: number;
      ttl?: number;
    }>(RATE_LIMIT_KEY, [context.getHandler(), context.getClass()]);

    if (!rateLimitMeta) return true;

    const group = rateLimitMeta.group;
    const config = LIMIT_CONFIGS[group];
    if (!config) return true;

    const limit = rateLimitMeta.limit ?? config.limit;
    const ttl = rateLimitMeta.ttl ?? config.ttl;
    const userId = request.user?.id as string | undefined;
    const ip = (request.ip as string) || 'unknown';

    const identifier = userId || ip;
    const key = `ratelimit:user:${userId ? userId : `ip:${ip}`}:${group}`;

    try {
      const current = await this.redis.incr(key);
      if (current === 1) {
        await this.redis.pexpire(key, ttl);
      }

      if (current > limit) {
        const ttlRemaining = await this.redis.pttl(key);
        const retryAfter =
          ttlRemaining > 0 ? Math.ceil(ttlRemaining / 1000) : 1;

        if (userId) {
          this.auditLogService
            .log(
              'rate_limit_exceeded',
              'rate_limit',
              userId,
              userId,
              { group, limit, current, url, method, ip },
              ip,
            )
            .catch(() => {});
        }

        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: `Too many requests. Try again in ${retryAfter} seconds.`,
            error: 'Too Many Requests',
            retryAfter,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      const response = context.switchToHttp().getResponse();
      const remaining = limit - current;
      response.header('X-RateLimit-Limit', limit.toString());
      response.header(
        'X-RateLimit-Remaining',
        Math.max(0, remaining).toString(),
      );
      response.header(
        'X-RateLimit-Reset',
        Math.ceil((Date.now() + ttl) / 1000).toString(),
      );

      return true;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      return true;
    }
  }
}
