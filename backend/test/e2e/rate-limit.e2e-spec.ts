import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  HttpStatus,
  Controller,
  Get,
  Post,
  Module,
  HttpCode,
} from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ThrottlerModule, ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

describe('Rate Limiting E2E', () => {
  describe('Global throttle (30 req/min simulation)', () => {
    let app: INestApplication;

    @Controller('_rl_global')
    class RlGlobalController {
      @Get()
      get() {
        return { ok: true };
      }
    }

    @Module({
      imports: [
        ThrottlerModule.forRoot({
          throttlers: [{ ttl: 60000, limit: 5 }],
        }),
      ],
      controllers: [RlGlobalController],
      providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
    })
    class RlGlobalTestModule {}

    beforeAll(async () => {
      const moduleFixture = await Test.createTestingModule({
        imports: [RlGlobalTestModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('should allow requests under the limit and block exceeding it', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .get('/_rl_global')
          .expect(HttpStatus.OK);
      }

      await request(app.getHttpServer())
        .get('/_rl_global')
        .expect(HttpStatus.TOO_MANY_REQUESTS);
    });
  });

  describe('Rate limit headers', () => {
    let app: INestApplication;

    @Controller('_rl_headers')
    class RlHeadersController {
      @Get()
      get() {
        return { ok: true };
      }
    }

    @Module({
      imports: [
        ThrottlerModule.forRoot({
          throttlers: [{ ttl: 60000, limit: 10 }],
        }),
      ],
      controllers: [RlHeadersController],
      providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
    })
    class RlHeadersTestModule {}

    beforeAll(async () => {
      const moduleFixture = await Test.createTestingModule({
        imports: [RlHeadersTestModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('should include Retry-After header when rate limited', async () => {
      for (let i = 0; i < 10; i++) {
        await request(app.getHttpServer())
          .get('/_rl_headers')
          .expect(HttpStatus.OK);
      }

      const res = await request(app.getHttpServer())
        .get('/_rl_headers')
        .expect(HttpStatus.TOO_MANY_REQUESTS);

      expect(res.headers['retry-after']).toBeDefined();
    });
  });

  describe('Auth endpoint stricter limits', () => {
    let app: INestApplication;

    @Controller('_rl_auth')
    class RlAuthController {
      @Throttle({ default: { ttl: 60000, limit: 3 } })
      @HttpCode(HttpStatus.OK)
      @Post('request-otp')
      requestOtp() {
        return { success: true, message: 'OTP sent' };
      }
    }

    @Module({
      imports: [
        ThrottlerModule.forRoot({
          throttlers: [{ ttl: 60000, limit: 100 }],
        }),
      ],
      controllers: [RlAuthController],
      providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
    })
    class RlAuthTestModule {}

    beforeAll(async () => {
      const moduleFixture = await Test.createTestingModule({
        imports: [RlAuthTestModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('should block OTP endpoint after 3 requests with @Throttle override', async () => {
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post('/_rl_auth/request-otp')
          .expect(HttpStatus.OK);
      }

      await request(app.getHttpServer())
        .post('/_rl_auth/request-otp')
        .expect(HttpStatus.TOO_MANY_REQUESTS);
    });
  });

  describe('Per-user rate limits', () => {
    let app: INestApplication;

    @Controller('_rl_user')
    class RlUserController {
      @Get()
      get() {
        return { ok: true };
      }

      @Throttle({ default: { ttl: 60000, limit: 5 } })
      @HttpCode(HttpStatus.OK)
      @Post('sensitive')
      sensitive() {
        return { success: true };
      }
    }

    @Module({
      imports: [
        ThrottlerModule.forRoot({
          throttlers: [{ ttl: 60000, limit: 30 }],
        }),
      ],
      controllers: [RlUserController],
      providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
    })
    class RlUserTestModule {}

    beforeAll(async () => {
      const moduleFixture = await Test.createTestingModule({
        imports: [RlUserTestModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('should allow per-user limit to be lower than global', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/_rl_user/sensitive')
          .expect(HttpStatus.OK);
      }

      await request(app.getHttpServer())
        .post('/_rl_user/sensitive')
        .expect(HttpStatus.TOO_MANY_REQUESTS);
    });

    it('should still allow other endpoints after per-user limit is hit', async () => {
      await request(app.getHttpServer()).get('/_rl_user').expect(HttpStatus.OK);
    });
  });

  describe('Rate limit window reset', () => {
    let app: INestApplication;

    @Controller('_rl_reset')
    class RlResetController {
      @Get()
      get() {
        return { ok: true };
      }
    }

    @Module({
      imports: [
        ThrottlerModule.forRoot({
          throttlers: [{ ttl: 2000, limit: 2 }],
        }),
      ],
      controllers: [RlResetController],
      providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
    })
    class RlResetTestModule {}

    beforeAll(async () => {
      const moduleFixture = await Test.createTestingModule({
        imports: [RlResetTestModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('should reset rate limit after the TTL window', async () => {
      await request(app.getHttpServer())
        .get('/_rl_reset')
        .expect(HttpStatus.OK);

      await request(app.getHttpServer())
        .get('/_rl_reset')
        .expect(HttpStatus.OK);

      await request(app.getHttpServer())
        .get('/_rl_reset')
        .expect(HttpStatus.TOO_MANY_REQUESTS);

      await new Promise((resolve) => setTimeout(resolve, 2100));

      await request(app.getHttpServer())
        .get('/_rl_reset')
        .expect(HttpStatus.OK);
    }, 10000);
  });
});
