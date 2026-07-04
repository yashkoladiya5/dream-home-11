import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';
import * as crypto from 'crypto';
import { RedisCacheService } from '../../redis/redis-cache.service';
import {
  CACHE_TTL_KEY,
  NO_CACHE_KEY,
  INVALIDATE_CACHE_KEY,
} from '../decorators/cache.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly defaultTtl = 60;
  private readonly referenceDataTtl = 300;
  private readonly authSensitiveRoutes = ['/users/me', '/auth/me', '/profile'];

  constructor(
    private readonly redisCacheService: RedisCacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      await this.handleMutationInvalidation(request, context);
      return next.handle();
    }

    if (request.method !== 'GET') {
      return next.handle();
    }

    const noCache = this.reflector.getAllAndOverride<boolean>(NO_CACHE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (noCache || this.shouldSkipCache(request)) {
      return next.handle();
    }

    const cacheKey = this.buildCacheKey(request);
    const cached = await this.redisCacheService.get<any>(cacheKey);
    if (cached !== null) {
      response.setHeader('X-Cache', 'HIT');
      return of(cached);
    }

    response.setHeader('X-Cache', 'MISS');
    const ttl = this.resolveTtl(context, request);
    return next.handle().pipe(
      map((data) => {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          this.redisCacheService.set(cacheKey, data, ttl);
        }
        return data;
      }),
    );
  }

  private buildCacheKey(req: Request): string {
    const queryHash = crypto
      .createHash('md5')
      .update(JSON.stringify(req.query))
      .digest('hex')
      .slice(0, 8);
    return `cache:response:${req.path}:${queryHash}`;
  }

  private resolveTtl(context: ExecutionContext, req: Request): number {
    const ttl = this.reflector.getAllAndOverride<number>(CACHE_TTL_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (ttl) return ttl;
    if (this.isReferenceData(req.path)) return this.referenceDataTtl;
    return this.defaultTtl;
  }

  private isReferenceData(path: string): boolean {
    const refPatterns = ['/banners', '/config', '/prize-homes'];
    return refPatterns.some((p) => path.includes(p));
  }

  private shouldSkipCache(req: Request): boolean {
    if (req.headers.authorization) return true;
    return this.authSensitiveRoutes.some((route) => req.path.includes(route));
  }

  private async handleMutationInvalidation(
    req: Request,
    context: ExecutionContext,
  ): Promise<void> {
    const invalidatePattern = this.reflector.getAllAndOverride<string>(
      INVALIDATE_CACHE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (invalidatePattern) {
      await this.redisCacheService.invalidatePrefix(
        `cache:response:${invalidatePattern}`,
      );
      return;
    }
    const basePattern = this.getBaseRoutePattern(req.path);
    if (basePattern) {
      await this.redisCacheService.invalidatePrefix(
        `cache:response:${basePattern}`,
      );
    }
  }

  private getBaseRoutePattern(path: string): string | null {
    const segments = path.replace(/^\/+/, '').split('/');
    const last = segments[segments.length - 1];
    if (
      last &&
      (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        last,
      ) ||
        /^\d+$/.test(last))
    ) {
      segments.pop();
    }
    return segments.length > 0 ? segments.join('/') : null;
  }
}
