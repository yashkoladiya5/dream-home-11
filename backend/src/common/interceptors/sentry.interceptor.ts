import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as Sentry from '@sentry/node';
import { Request } from 'express';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const controller = context.getClass()?.name || 'UnknownController';
    const handlerName = context.getHandler()?.name || 'UnknownHandler';
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - start;
          Sentry.withScope((scope) => {
            scope.setTag('controller', controller);
            scope.setTag('handler', handlerName);
            scope.addBreadcrumb({
              message: `${request.method} ${request.url} -> 200`,
              category: 'http',
              level: 'info',
              data: { duration_ms: duration },
            });
          });
        },
        error: (err) => {
          const status = err?.status || 500;
          Sentry.withScope((scope) => {
            scope.setTag('controller', controller);
            scope.setTag('handler', handlerName);
            scope.setTag('status_code', String(status));
            scope.addBreadcrumb({
              message: `${request.method} ${request.url} -> ${status}`,
              category: 'http',
              level: 'error',
              data: { error: err?.message },
            });
          });
        },
      }),
    );
  }
}
