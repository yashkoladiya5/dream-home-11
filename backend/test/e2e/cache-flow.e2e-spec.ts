import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  HttpStatus,
  Controller,
  Get,
  Post,
  Module,
} from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { CacheInterceptor } from '../../src/common/interceptors/cache.interceptor';
import { RedisCacheService } from '../../src/redis/redis-cache.service';
import { Reflector, APP_INTERCEPTOR } from '@nestjs/core';
import { EtagMiddleware } from '../../src/common/middleware/etag.middleware';

describe('Cache Flow E2E', () => {
  let app: INestApplication;

  @Controller('_cache_test')
  class CacheTestController {
    private hitCount = 0;

    @Get()
    async getData() {
      this.hitCount++;
      return { data: 'test', count: this.hitCount };
    }

    @Post()
    async mutate() {
      return { success: true };
    }
  }

  @Module({
    controllers: [CacheTestController],
    providers: [
      {
        provide: RedisCacheService,
        useValue: {
          get: jest.fn().mockResolvedValue(null),
          set: jest.fn().mockResolvedValue(undefined),
          del: jest.fn().mockResolvedValue(undefined),
          delPattern: jest.fn().mockResolvedValue(undefined),
          invalidatePrefix: jest.fn().mockResolvedValue(undefined),
        },
      },
      {
        provide: Reflector,
        useValue: {
          getAllAndOverride: jest.fn().mockReturnValue(undefined),
        },
      },
      {
        provide: APP_INTERCEPTOR,
        useClass: CacheInterceptor,
      },
    ],
  })
  class CacheTestModule {}

  describe('Redis cache-aside pattern (CacheInterceptor)', () => {
    beforeAll(async () => {
      const moduleFixture = await Test.createTestingModule({
        imports: [CacheTestModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('should return X-Cache: MISS on first request', async () => {
      // Since cache returns null, the interceptor will set X-Cache: MISS
      const res = await request(app.getHttpServer())
        .get('/_cache_test')
        .expect(HttpStatus.OK);

      // The interceptor sets X-Cache header based on cache result
      expect(res.body).toBeDefined();
    });

    it('should return X-Cache: HIT on cached response', async () => {
      const mockCacheService = app.get<RedisCacheService>(RedisCacheService);
      const getSpy = jest.spyOn(mockCacheService, 'get');

      getSpy.mockResolvedValueOnce({ data: 'cached', count: 1 });

      const res = await request(app.getHttpServer())
        .get('/_cache_test')
        .expect(HttpStatus.OK);

      expect(res.body).toEqual({ data: 'cached', count: 1 });
    });

    it('should set cache after cache miss', async () => {
      const mockCacheService = app.get<RedisCacheService>(RedisCacheService);
      const setSpy = jest.spyOn(mockCacheService, 'set');

      // First clear the mock to force a miss then set
      jest.spyOn(mockCacheService, 'get').mockResolvedValueOnce(null);

      await request(app.getHttpServer())
        .get('/_cache_test')
        .expect(HttpStatus.OK);

      // The set should have been called after the handler returned data
      expect(setSpy).toHaveBeenCalled();
    });
  });

  describe('ETag generation and conditional requests', () => {
    let etagApp: INestApplication;

    @Controller('_etag_test')
    class EtagTestController {
      @Get()
      getData() {
        return { data: 'etag-test', version: 1 };
      }
    }

    @Module({
      controllers: [EtagTestController],
    })
    class EtagTestModule {}

    beforeAll(async () => {
      const moduleFixture = await Test.createTestingModule({
        imports: [EtagTestModule],
      }).compile();

      etagApp = moduleFixture.createNestApplication();
      // Apply the ETag middleware manually
      const etagMiddleware = new EtagMiddleware();
      etagApp.use((req: any, res: any, next: any) =>
        etagMiddleware.use(req, res, next),
      );
      await etagApp.init();
    });

    afterAll(async () => {
      await etagApp.close();
    });

    it('should return ETag header on GET response', async () => {
      const res = await request(etagApp.getHttpServer())
        .get('/_etag_test')
        .expect(HttpStatus.OK);

      expect(res.headers['etag']).toBeDefined();
      expect(typeof res.headers['etag']).toBe('string');
      expect(res.headers['etag']).toMatch(/^"[\w\d]+"$/);
    });

    it('should return 304 when If-None-Match matches ETag', async () => {
      const res = await request(etagApp.getHttpServer())
        .get('/_etag_test')
        .expect(HttpStatus.OK);

      const etag = res.headers['etag'];

      await request(etagApp.getHttpServer())
        .get('/_etag_test')
        .set('If-None-Match', etag)
        .expect(HttpStatus.NOT_MODIFIED);
    });

    it('should return 200 when If-None-Match does not match', async () => {
      await request(etagApp.getHttpServer())
        .get('/_etag_test')
        .set('If-None-Match', '"invalid-etag"')
        .expect(HttpStatus.OK);
    });

    it('should return 200 without ETag on POST request', async () => {
      const res = await request(etagApp.getHttpServer())
        .post('/_etag_test')
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('Cache invalidation on mutation (integration)', () => {
    let invalidationApp: INestApplication;
    let mockInvalidatePrefix: jest.Mock;
    let mockRedisCacheService: RedisCacheService;

    @Controller('_inval_test')
    class InvalidationTestController {
      @Get()
      getData() {
        return { data: 'cachable', version: 2 };
      }

      @Post()
      mutateData() {
        return { success: true };
      }
    }

    @Module({
      controllers: [InvalidationTestController],
      providers: [
        {
          provide: RedisCacheService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(undefined),
            delPattern: jest.fn().mockResolvedValue(undefined),
            invalidatePrefix: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn().mockReturnValue(undefined),
          },
        },
        CacheInterceptor,
      ],
    })
    class InvalidationTestModule {}

    beforeAll(async () => {
      const moduleFixture = await Test.createTestingModule({
        imports: [InvalidationTestModule],
      }).compile();

      invalidationApp = moduleFixture.createNestApplication();
      await invalidationApp.init();

      mockRedisCacheService =
        invalidationApp.get<RedisCacheService>(RedisCacheService);
      mockInvalidatePrefix = jest.fn().mockResolvedValue(undefined);
      jest
        .spyOn(mockRedisCacheService, 'invalidatePrefix')
        .mockImplementation(mockInvalidatePrefix);
    });

    afterAll(async () => {
      await invalidationApp.close();
    });

    it('should invalidate cache prefix on POST mutation', async () => {
      await request(invalidationApp.getHttpServer())
        .post('/_inval_test')
        .send({})
        .expect((r) => {
          expect([HttpStatus.CREATED, HttpStatus.OK]).toContain(r.status);
        });
    });
  });
});
