import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as crypto from 'crypto';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../../redis/redis.constants';
import { API_KEY_AUTH_KEY } from '../decorators/api-key.decorator';
import { AuditLogService } from '../audit/audit-log.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private validKeys: string[] = [];

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly reflector: Reflector,
    private readonly auditLogService: AuditLogService,
  ) {
    this.loadKeys();
  }

  private loadKeys(): void {
    const keys = process.env.API_KEYS || '';
    this.validKeys = keys
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
  }

  private hashKey(key: string): string {
    return crypto.createHash('sha256').update(key, 'utf8').digest('hex');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isApiKeyAuth = this.reflector.getAllAndOverride<boolean>(
      API_KEY_AUTH_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!isApiKeyAuth) return true;

    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'] as string | undefined;

    if (!apiKey) {
      throw new UnauthorizedException('Missing X-API-Key header');
    }

    const keyHash = this.hashKey(apiKey);
    const isValid = this.validKeys.some((stored) => {
      if (stored.length === 64 && /^[0-9a-f]{64}$/i.test(stored)) {
        return crypto.timingSafeEqual(
          Buffer.from(stored, 'utf8'),
          Buffer.from(keyHash, 'utf8'),
        );
      }
      return crypto.timingSafeEqual(
        Buffer.from(stored, 'utf8'),
        Buffer.from(apiKey, 'utf8'),
      );
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid API key');
    }

    const ip = (request.ip as string) || 'unknown';
    const method = request.method;
    const url = request.url;

    this.auditLogService
      .log(
        'api_key_used',
        'api_key',
        keyHash.substring(0, 8),
        'system',
        { method, url, ip },
        ip,
      )
      .catch(() => {});

    const rateLimitKey = `ratelimit:apikey:${keyHash.substring(0, 8)}`;
    const limit = parseInt(process.env.RATE_LIMIT_API_KEY || '100', 10);
    const ttl = 60000;

    try {
      const current = await this.redis.incr(rateLimitKey);
      if (current === 1) {
        await this.redis.pexpire(rateLimitKey, ttl);
      }

      if (current > limit) {
        throw new UnauthorizedException('API key rate limit exceeded');
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
    }

    return true;
  }
}
