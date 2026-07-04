import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { PinoLoggerService } from '../logger/pino-logger.service';

@Catch()
export class WsExceptionFilter implements ExceptionFilter {
  constructor(private readonly pinoLogger: PinoLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType() !== 'ws') {
      return;
    }

    const ctx = host.switchToWs();
    const client = ctx.getClient();
    const data = ctx.getData();
    const error = exception as any;
    const message = error.message || 'Internal server error';
    const code = error.code || error.status || 500;

    const isProd = process.env.NODE_ENV === 'production';
    const response: Record<string, any> = {
      code,
      message,
    };

    if (!isProd && error.stack) {
      response.stack = error.stack;
    }

    if (typeof client.emit === 'function') {
      client.emit('exception', response);
    }

    this.pinoLogger.error(
      {
        event: 'ws_exception',
        message,
        code,
        data: data ? JSON.stringify(data).slice(0, 500) : undefined,
      },
      'WsExceptionFilter',
    );
  }
}
