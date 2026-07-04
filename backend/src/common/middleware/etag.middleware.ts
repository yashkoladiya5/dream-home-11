import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class EtagMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.method !== 'GET') {
      return next();
    }

    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    res.json = function (body: any): Response {
      return setETag(this, req, res, body, originalJson);
    } as typeof res.json;

    res.send = function (body: any): Response {
      return setETag(this, req, res, body, originalSend);
    } as typeof res.send;

    next();
  }
}

function setETag(
  ctx: Response,
  req: Request,
  res: Response,
  body: any,
  original: Function,
): Response {
  if (res.headersSent) {
    return original.call(ctx, body);
  }

  const rawBody = typeof body === 'string' ? body : JSON.stringify(body);
  const hash = crypto.createHash('md5').update(rawBody).digest('hex');
  const etag = `"${hash}"`;

  res.setHeader('ETag', etag);

  const ifNoneMatch = req.headers['if-none-match'];
  if (ifNoneMatch === etag) {
    res.status(304).end();
    return ctx;
  }

  return original.call(ctx, body);
}
