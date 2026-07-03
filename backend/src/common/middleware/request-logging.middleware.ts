import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CorrelationIdMiddleware } from './correlation-id.middleware';
import { PinoLoggerService } from '../logger/pino-logger.service';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: PinoLoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, originalUrl } = req;
    const correlationId = CorrelationIdMiddleware.getCorrelationId();
    const userAgent = req.headers['user-agent'] || 'unknown';
    const contentLength = req.headers['content-length'] || '0';

    res.on('finish', () => {
      const duration = Date.now() - start;
      const statusCode = res.statusCode;
      const slowMs = parseInt(process.env.SLOW_REQUEST_MS || '1000', 10);
      const isProd = process.env.NODE_ENV === 'production';
      const isSlow = duration > slowMs;

      const logData = {
        method,
        url: originalUrl,
        statusCode,
        duration: `${duration}ms`,
        correlationId,
        userAgent,
        contentLength,
      };

      if (!isProd) {
        this.logger.log(logData, 'HTTP Request');
      } else if (statusCode >= 500) {
        this.logger.error(logData, 'HTTP Request');
      } else if (statusCode >= 400) {
        this.logger.warn(logData, 'HTTP Request');
      } else if (isSlow) {
        this.logger.warn({ ...logData, slow: true }, 'HTTP Request');
      } else if (Math.random() < 0.2) {
        this.logger.debug(logData, 'HTTP Request');
      }
    });

    next();
  }
}
