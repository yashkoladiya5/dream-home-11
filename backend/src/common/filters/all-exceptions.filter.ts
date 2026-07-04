import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { PinoLoggerService } from '../logger/pino-logger.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly pinoLogger: PinoLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (response.headersSent) {
      return;
    }

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

    const isProduction = process.env.NODE_ENV === 'production';
    const requestId = (request as any).requestId || 'unknown';
    const correlationId = (request as any).correlationId || 'unknown';

    let respMessage = message;
    if (isProduction && status >= 500) {
      respMessage = 'Internal server error';
    }

    const errorResponse: Record<string, any> = {
      statusCode: status,
      message: respMessage,
      error: HttpStatus[status] || 'Error',
      requestId,
      correlationId,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (!isProduction) {
      errorResponse.stack =
        exception instanceof Error ? exception.stack : undefined;
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
      'AllExceptionsFilter',
    );

    response.status(status).json(errorResponse);
  }
}
