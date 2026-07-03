import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

const SIZE_LIMITS: Record<string, number> = {
  api: parseInt(process.env.MAX_REQUEST_SIZE_API || '1048576', 10),
  kyc: parseInt(process.env.MAX_REQUEST_SIZE_KYC || '10485760', 10),
  feed: parseInt(process.env.MAX_REQUEST_SIZE_FEED || '5242880', 10),
  auth: parseInt(process.env.MAX_REQUEST_SIZE_AUTH || '10240', 10),
};

function getMaxSize(path: string): number {
  if (path.startsWith('/api/v1/kyc') || path.startsWith('/api/v1/admin/kyc')) {
    return SIZE_LIMITS.kyc;
  }
  if (path.startsWith('/api/v1/feed') || path.includes('/posts')) {
    return SIZE_LIMITS.feed;
  }
  if (path.startsWith('/api/v1/auth')) {
    return SIZE_LIMITS.auth;
  }
  return SIZE_LIMITS.api;
}

@Injectable()
export class RequestSizeLimiterMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength === 0) return next();

    const path = req.path || req.url || '';
    const maxSize = getMaxSize(path);

    if (contentLength > maxSize) {
      const maxMb = Math.round((maxSize / 1024 / 1024) * 100) / 100;
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
          message: `Request payload too large. Maximum allowed size is ${maxSize} bytes (${maxMb} MB).`,
          error: 'Payload Too Large',
          maxAllowed: maxSize,
        },
        HttpStatus.PAYLOAD_TOO_LARGE,
      );
    }

    next();
  }
}
