import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { CacheInterceptor } from './cache.interceptor';
import { RedisCacheService } from '../../redis/redis-cache.service';

describe('CacheInterceptor', () => {
  let interceptor: CacheInterceptor;
  let mockRedisCacheService: jest.Mocked<RedisCacheService>;

  const createMockContext = (options: {
    method?: string;
    path?: string;
    headers?: Record<string, string>;
    query?: Record<string, string>;
    statusCode?: number;
  }) => {
    const {
      method = 'GET',
      path = '/api/v1/contests',
      headers = {},
      query = {},
      statusCode = 200,
    } = options;
    const setHeader = jest.fn();
    const mockResponse = { setHeader, statusCode };
    return {
      getHandler: jest.fn().mockReturnValue(() => {}),
      getClass: jest.fn().mockReturnValue(class MockController {}),
      switchToHttp: () => ({
        getRequest: () => ({
          method,
          path,
          originalUrl: path,
          query,
          headers,
        }),
        getResponse: () => mockResponse,
        getNext: jest.fn(),
      }),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn().mockReturnValue('http'),
    } as any;
  };

  beforeEach(async () => {
    mockRedisCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      wrap: jest.fn(),
      del: jest.fn(),
      delPattern: jest.fn(),
      invalidatePrefix: jest.fn(),
      healthCheck: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheInterceptor,
        {
          provide: RedisCacheService,
          useValue: mockRedisCacheService,
        },
        Reflector,
      ],
    }).compile();

    interceptor = module.get<CacheInterceptor>(CacheInterceptor);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('cache hit', () => {
    it('should return cached response and set X-Cache HIT header', async () => {
      const cachedData = { id: '1', name: 'Test' };
      mockRedisCacheService.get.mockResolvedValue(cachedData);

      const context = createMockContext({});
      const mockNext = { handle: jest.fn() };

      const result$ = await interceptor.intercept(context, mockNext);
      const emitted: any[] = [];
      result$.subscribe((v: any) => emitted.push(v));

      const response = context.switchToHttp().getResponse();
      expect(response.setHeader).toHaveBeenCalledWith('X-Cache', 'HIT');
      expect(mockNext.handle).not.toHaveBeenCalled();
      expect(emitted[0]).toEqual(cachedData);
    });
  });

  describe('cache miss', () => {
    it('should call handler and cache the result on 2xx', async () => {
      mockRedisCacheService.get.mockResolvedValue(null);

      const handlerData = { id: '2', name: 'New Data' };
      const context = createMockContext({});
      const mockNext = { handle: jest.fn().mockReturnValue(of(handlerData)) };

      const result$ = await interceptor.intercept(context, mockNext);
      const emitted: any[] = [];
      result$.subscribe((v: any) => emitted.push(v));

      expect(mockRedisCacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('cache:response:'),
        handlerData,
        expect.any(Number),
      );
      expect(emitted[0]).toEqual(handlerData);
    });

    it('should not cache non-2xx responses', async () => {
      mockRedisCacheService.get.mockResolvedValue(null);

      const handlerData = { message: 'Not Found' };
      const context = createMockContext({ statusCode: 404 });
      const mockNext = { handle: jest.fn().mockReturnValue(of(handlerData)) };

      const result$ = await interceptor.intercept(context, mockNext);
      result$.subscribe(() => {});

      expect(mockRedisCacheService.set).not.toHaveBeenCalled();
    });
  });

  describe('X-Cache headers', () => {
    it('should set MISS on cache miss', async () => {
      mockRedisCacheService.get.mockResolvedValue(null);

      const context = createMockContext({});
      const mockNext = { handle: jest.fn().mockReturnValue(of({})) };

      await interceptor.intercept(context, mockNext);
      const response = context.switchToHttp().getResponse();
      expect(response.setHeader).toHaveBeenCalledWith('X-Cache', 'MISS');
    });

    it('should set HIT on cache hit', async () => {
      mockRedisCacheService.get.mockResolvedValue({ cached: true });

      const context = createMockContext({});
      const mockNext = { handle: jest.fn() };

      await interceptor.intercept(context, mockNext);
      const response = context.switchToHttp().getResponse();
      expect(response.setHeader).toHaveBeenCalledWith('X-Cache', 'HIT');
    });
  });

  describe('mutation invalidation', () => {
    it('should invalidate cache pattern on POST', async () => {
      const context = createMockContext({
        method: 'POST',
        path: '/api/v1/contests',
      });
      const mockNext = { handle: jest.fn().mockReturnValue(of({})) };

      await interceptor.intercept(context, mockNext);

      expect(mockRedisCacheService.invalidatePrefix).toHaveBeenCalledWith(
        expect.stringContaining('cache:response:'),
      );
    });

    it('should invalidate cache pattern on PUT', async () => {
      const context = createMockContext({
        method: 'PUT',
        path: '/api/v1/contests/123',
      });
      const mockNext = { handle: jest.fn().mockReturnValue(of({})) };

      await interceptor.intercept(context, mockNext);

      expect(mockRedisCacheService.invalidatePrefix).toHaveBeenCalled();
    });

    it('should invalidate cache pattern on DELETE', async () => {
      const context = createMockContext({
        method: 'DELETE',
        path: '/api/v1/contests/456',
      });
      const mockNext = { handle: jest.fn().mockReturnValue(of({})) };

      await interceptor.intercept(context, mockNext);

      expect(mockRedisCacheService.invalidatePrefix).toHaveBeenCalled();
    });
  });

  describe('auth route exclusion', () => {
    it('should skip caching when Authorization header is present', async () => {
      const context = createMockContext({
        headers: { authorization: 'Bearer token123' },
      });
      const mockNext = { handle: jest.fn().mockReturnValue(of({})) };

      await interceptor.intercept(context, mockNext);

      expect(mockRedisCacheService.get).not.toHaveBeenCalled();
    });
  });

  describe('non-GET requests', () => {
    it('should forward POST requests without caching', async () => {
      const context = createMockContext({ method: 'POST' });
      const mockNext = { handle: jest.fn().mockReturnValue(of({})) };

      await interceptor.intercept(context, mockNext);

      expect(mockRedisCacheService.get).not.toHaveBeenCalled();
    });
  });
});
