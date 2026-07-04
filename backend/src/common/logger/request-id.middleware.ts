import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AsyncLocalStorage } from 'async_hooks';

export const requestContext = new AsyncLocalStorage<Map<string, any>>();

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = (req.headers['x-request-id'] as string) || uuidv4();
    res.setHeader('x-request-id', requestId);
    (req as any).requestId = requestId;
    const store = new Map<string, any>();
    store.set('requestId', requestId);
    requestContext.run(store, () => next());
  }
}
