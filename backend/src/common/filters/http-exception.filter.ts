import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response, Request } from 'express';

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
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message || exceptionResponse;
    }

    if (status === HttpStatus.TOO_MANY_REQUESTS) {
      this.logger.warn(`Rate limit exceeded: ${request.ip} - ${request.method} ${request.url}`);
    }

    this.logger.error(`${request.method} ${request.url} - ${status}`);

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
}
