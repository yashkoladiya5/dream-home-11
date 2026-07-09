import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  SetMetadata,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';

export const CACHE_CONTROL_KEY = 'cache_control';

export const CacheControl = (maxAge: number, sMaxAge?: number) =>
  SetMetadata(CACHE_CONTROL_KEY, { maxAge, sMaxAge });

@Injectable()
export class CacheControlInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const cacheMeta = this.reflector.getAllAndOverride(CACHE_CONTROL_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const response = context.switchToHttp().getResponse<Response>();
    const request = context.switchToHttp().getRequest<Request>();

    if (request.method !== 'GET' || !cacheMeta) {
      response.setHeader('Cache-Control', 'no-store');
      return next.handle();
    }

    const { maxAge, sMaxAge } = cacheMeta;
    const cacheControl = `public, max-age=${maxAge}, s-maxage=${sMaxAge ?? maxAge}`;
    response.setHeader('Cache-Control', cacheControl);
    response.setHeader('Surrogate-Control', cacheControl);
    response.setHeader('CDN-Cache-Control', cacheControl);

    return next.handle();
  }
}
