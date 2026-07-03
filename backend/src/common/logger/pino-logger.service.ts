import { LoggerService } from '@nestjs/common';
import pino from 'pino';
import * as os from 'os';
import { requestContext } from '../middleware/request-id.middleware';

export class PinoLoggerService implements LoggerService {
  private logger: pino.Logger;

  constructor() {
    const isProd = process.env.NODE_ENV === 'production';
    const level = process.env.LOG_LEVEL || (isProd ? 'info' : 'debug');

    const transport = isProd
      ? undefined
      : {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        };

    this.logger = pino({
      level,
      transport,
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'password',
          'token',
          'secret',
          'authorization',
        ],
        censor: '[REDACTED]',
      },
      base: {
        pid: process.pid,
        hostname: os.hostname(),
        env: process.env.NODE_ENV || 'development',
      },
    });
  }

  private getRequestId(): string {
    const store = requestContext.getStore();
    return store?.get('requestId') || 'unknown';
  }

  log(message: any, ...optionalParams: any[]) {
    this.logger.info(
      { requestId: this.getRequestId(), context: optionalParams[0] },
      message,
    );
  }

  error(message: any, ...optionalParams: any[]) {
    const trace = optionalParams[0];
    const context = optionalParams[1];
    this.logger.error(
      { requestId: this.getRequestId(), trace, context },
      typeof message === 'string' ? message : 'Error',
    );
  }

  warn(message: any, ...optionalParams: any[]) {
    this.logger.warn(
      { requestId: this.getRequestId(), context: optionalParams[0] },
      message,
    );
  }

  debug(message: any, ...optionalParams: any[]) {
    this.logger.debug(
      { requestId: this.getRequestId(), context: optionalParams[0] },
      message,
    );
  }

  verbose(message: any, ...optionalParams: any[]) {
    this.logger.trace(
      { requestId: this.getRequestId(), context: optionalParams[0] },
      message,
    );
  }
}
