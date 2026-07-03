import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import compression from 'compression';

@Injectable()
export class CompressionMiddleware implements NestMiddleware {
  private middleware = compression({
    threshold: 1024,
    filter: (req: Request, res: Response) => {
      const contentType = res.getHeader('content-type') as string | undefined;
      if (contentType) {
        if (
          contentType.startsWith('image/') ||
          contentType.startsWith('video/')
        ) {
          return false;
        }
      }
      return true;
    },
  });

  use(req: Request, res: Response, next: NextFunction) {
    res.setHeader('Vary', 'Accept-Encoding');
    this.middleware(req, res, next);
  }
}
