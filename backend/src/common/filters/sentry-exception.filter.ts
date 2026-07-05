import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import * as Sentry from '@sentry/node';

const statusText: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
};

@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SentryExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || exceptionResponse;
    }

    if (status >= 500) {
      Sentry.withScope((scope) => {
        scope.setTag('endpoint', `${request.method} ${request.url}`);
        scope.setTag('status_code', status.toString());
        scope.setExtra('method', request.method);
        scope.setExtra('url', request.url);
        scope.setExtra('headers', this.sanitizeHeaders(request.headers));
        scope.setExtra('ip', request.ip);
        scope.setExtra(
          'user_agent',
          request.headers['user-agent'] || 'unknown',
        );
        const user = (request as any).user;
        if (user?.id) {
          scope.setUser({ id: user.id });
        }
        Sentry.captureException(exception);
      });
    }

    if (status === HttpStatus.TOO_MANY_REQUESTS) {
      this.logger.warn(
        `Rate limit exceeded: ${request.ip} - ${request.method} ${request.url}`,
      );
    }

    this.logger.error(
      `${request.method} ${request.url} - ${status}`,
      exception instanceof Error ? exception.stack : exception,
    );

    const error = statusText[status] || 'Error';
    const requestId = (request as any).requestId || 'unknown';
    const isProduction = process.env.NODE_ENV === 'production';

    let respMessage = message;
    if (isProduction && status >= 500) {
      respMessage = 'Internal server error';
    }

    response.status(status).json({
      statusCode: status,
      message: respMessage,
      error,
      requestId,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
    const sanitized = { ...headers };
    const sensitiveFields = ['authorization', 'cookie', 'x-api-key', 'token'];
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    return sanitized;
  }
}
