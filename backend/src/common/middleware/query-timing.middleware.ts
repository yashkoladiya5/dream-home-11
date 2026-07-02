import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class QueryTimingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('QueryTiming');

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, originalUrl } = req;

    res.on('finish', () => {
      const duration = Date.now() - start;
      if (duration > 1000) {
        this.logger.warn(`SLOW: ${method} ${originalUrl} - ${duration}ms`);
      } else if (duration > 500) {
        this.logger.log(`MEDIUM: ${method} ${originalUrl} - ${duration}ms`);
      }
    });

    next();
  }
}
