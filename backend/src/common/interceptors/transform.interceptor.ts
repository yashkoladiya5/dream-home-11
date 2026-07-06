import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { SKIP_ENVELOPE_KEY } from '../decorators/skip-envelope.decorator';

export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
  requestId?: string;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
  requestId?: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T> | PaginatedResponse<T>>
{
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T> | PaginatedResponse<T>> {
    const skipEnvelope =
      this.reflector.getAllAndOverride<boolean>(SKIP_ENVELOPE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

    if (skipEnvelope) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const requestId = request.requestId;

    return next.handle().pipe(
      map((response) => {
        if (response === null || response === undefined) {
          return {
            success: true as const,
            data: null,
            timestamp: new Date().toISOString(),
            requestId,
          };
        }

        if (this.isPaginated(response)) {
          const { data, ...pagination } = response;
          return {
            success: true as const,
            data,
            pagination: {
              total: pagination.total,
              page: pagination.page,
              limit: pagination.limit,
              totalPages: Math.ceil(pagination.total / pagination.limit),
            },
            timestamp: new Date().toISOString(),
            requestId,
          };
        }

        if (response?.success && response?.data !== undefined) {
          return {
            ...response,
            timestamp: response.timestamp || new Date().toISOString(),
            requestId: response.requestId || requestId,
          };
        }

        return {
          success: true as const,
          data: response,
          timestamp: new Date().toISOString(),
          requestId,
        };
      }),
    );
  }

  private isPaginated(
    value: any,
  ): value is { data: any[]; total: number; page: number; limit: number } {
    return (
      value &&
      Array.isArray(value.data) &&
      typeof value.total === 'number' &&
      typeof value.page === 'number' &&
      typeof value.limit === 'number'
    );
  }
}
