import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import * as Sentry from '@sentry/node';
import { PinoLoggerService } from '../logger/pino-logger.service';

const STATUS_TEXT: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
};

interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string | string[];
  error: string;
  requestId: string;
  correlationId?: string;
  timestamp: string;
  path: string;
  stack?: string;
}

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  constructor(private readonly pinoLogger: PinoLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (response.headersSent) {
      return;
    }

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, any>;
        message = resp.message ?? resp.error ?? exceptionResponse;
      }
    }

    const requestId = (request as any).requestId || 'unknown';
    const correlationId = (request as any).correlationId || 'unknown';
    const isProduction = process.env.NODE_ENV === 'production';

    let respMessage = message;
    if (isProduction && status >= 500) {
      respMessage = 'Internal server error';
    }

    if (status >= 500) {
      Sentry.withScope((scope) => {
        scope.setTag('endpoint', `${request.method} ${request.url}`);
        scope.setTag('status_code', status.toString());
        scope.setExtra('method', request.method);
        scope.setExtra('url', request.url);
        const user = (request as any).user;
        if (user?.id) {
          scope.setUser({ id: user.id });
        }
        Sentry.captureException(exception);
      });
    }

    this.pinoLogger.error(
      {
        statusCode: status,
        method: request.method,
        url: request.url,
        requestId,
        correlationId,
        error: exception instanceof Error ? exception.message : 'Unknown error',
      },
      'AppExceptionFilter',
    );

    const errorResponse: ErrorResponse = {
      success: false,
      statusCode: status,
      message: respMessage,
      error: STATUS_TEXT[status] || 'Error',
      requestId,
      correlationId,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (!isProduction) {
      errorResponse.stack =
        exception instanceof Error ? exception.stack : undefined;
    }

    response.status(status).json(errorResponse);
  }
}
