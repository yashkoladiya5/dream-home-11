import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerBehindProxyGuard } from '../../src/common/guards/throttler-behind-proxy.guard';
import { UserRateLimitGuard } from '../../src/common/guards/user-rate-limit.guard';
import { AuditLogService } from '../../src/common/audit/audit-log.service';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, HttpException } from '@nestjs/common';
import { User } from '../../src/users/entities/user.entity';

function mockRequestContext(
  overrides: Record<string, any> = {},
): ExecutionContext {
  const req: any = {
    ip: '192.168.1.1',
    ips: [],
    headers: { 'x-forwarded-for': '10.0.0.1, 192.168.1.1' },
    url: '/api/v1/some-endpoint',
    method: 'GET',
    user: null,
    ...overrides,
  };
  const res: any = { header: jest.fn() };
  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
    }),
    getHandler: () => {},
    getClass: () => {},
  } as unknown as ExecutionContext;
}

describe('Security: Rate Limiting', () => {
  let throttlerGuard: ThrottlerBehindProxyGuard;
  let userRateLimitGuard: UserRateLimitGuard;
  let auditLogService: AuditLogService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ThrottlerBehindProxyGuard,
          useValue: {
            canActivate: jest.fn(),
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            log: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: 'IORedis',
          useValue: {
            incr: jest.fn(),
            pexpire: jest.fn(),
            pttl: jest.fn(),
          },
        },
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        UserRateLimitGuard,
      ],
    }).compile();

    throttlerGuard = module.get<ThrottlerBehindProxyGuard>(
      ThrottlerBehindProxyGuard,
    );
    userRateLimitGuard = module.get<UserRateLimitGuard>(UserRateLimitGuard);
    auditLogService = module.get<AuditLogService>(AuditLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('IP-Based Rate Limiting', () => {
    test('ThrottlerBehindProxyGuard uses correct IP from X-Forwarded-For', async () => {
      const guard = new ThrottlerBehindProxyGuard();
      const req = { ip: '192.168.1.1', ips: ['10.0.0.1', '203.0.113.5'] };
      const tracker = await (guard as any).getTracker(req);
      expect(tracker).toBe('10.0.0.1');
    });

    test('ThrottlerBehindProxyGuard falls back to req.ip when X-Forwarded-For is empty', async () => {
      const guard = new ThrottlerBehindProxyGuard();
      const req = { ip: '192.168.1.1', ips: [] };
      const tracker = await (guard as any).getTracker(req);
      expect(tracker).toBe('192.168.1.1');
    });

    test('ThrottlerBehindProxyGuard uses req.ip when ips array is undefined', async () => {
      const guard = new ThrottlerBehindProxyGuard();
      const req = { ip: '10.0.0.1' };
      const tracker = await (guard as any).getTracker(req);
      expect(tracker).toBe('10.0.0.1');
    });
  });

  describe('X-Forwarded-For Spoofing', () => {
    test('first IP in X-Forwarded-For is used (trusted proxy)', async () => {
      const guard = new ThrottlerBehindProxyGuard();
      const req = { ip: '127.0.0.1', ips: ['203.0.113.5', '192.168.1.1'] };
      const tracker = await (guard as any).getTracker(req);
      expect(tracker).toBe('203.0.113.5');
    });

    test('multiple X-Forwarded-For headers are not accepted as separate', async () => {
      const guard = new ThrottlerBehindProxyGuard();
      const req = { ip: '127.0.0.1', ips: ['10.0.0.1'] };
      const tracker = await (guard as any).getTracker(req);
      expect(tracker).toBe('10.0.0.1');
      expect(tracker).not.toBe('203.0.113.5');
    });
  });

  describe('User-Based Rate Limiting', () => {
    const mockUser: Partial<User> = { id: 'user-rate-test-1' };

    function setupUserRateLimitGroup(group: string, limit: number) {
      jest
        .spyOn(Reflector.prototype, 'getAllAndOverride')
        .mockReturnValue({ group, limit, ttl: 60000 });
    }

    test('rate limit not exceeded passes through', async () => {
      setupUserRateLimitGroup('api', 60);
      const redisMock = {
        incr: jest.fn().mockResolvedValue(1),
        pexpire: jest.fn().mockResolvedValue(1),
      };
      (userRateLimitGuard as any).redis = redisMock;
      const ctx = mockRequestContext({ user: mockUser });
      const result = await userRateLimitGuard.canActivate(ctx);
      expect(result).toBe(true);
    });

    test('rate limit exceeded returns 429', async () => {
      setupUserRateLimitGroup('auth', 5);
      const redisMock = {
        incr: jest.fn().mockResolvedValue(6),
        pexpire: jest.fn().mockResolvedValue(1),
        pttl: jest.fn().mockResolvedValue(30000),
      };
      (userRateLimitGuard as any).redis = redisMock;
      const ctx = mockRequestContext({ user: mockUser });
      await expect(userRateLimitGuard.canActivate(ctx)).rejects.toThrow(
        HttpException,
      );
    });

    test('unauthenticated users are rate limited by IP', async () => {
      setupUserRateLimitGroup('api', 60);
      const redisMock = {
        incr: jest.fn().mockResolvedValue(1),
        pexpire: jest.fn().mockResolvedValue(1),
      };
      (userRateLimitGuard as any).redis = redisMock;
      const ctx = mockRequestContext({ user: null });
      const result = await userRateLimitGuard.canActivate(ctx);
      expect(result).toBe(true);
    });

    test('rate limit headers are set when under limit', async () => {
      setupUserRateLimitGroup('api', 60);
      const redisMock = {
        incr: jest.fn().mockResolvedValue(1),
        pexpire: jest.fn().mockResolvedValue(1),
      };
      (userRateLimitGuard as any).redis = redisMock;
      const headerMock = jest.fn();
      const ctx = mockRequestContext({ user: mockUser });
      ctx.switchToHttp = () =>
        ({
          getRequest: () => ({
            ip: '192.168.1.1',
            url: '/api/v1/test',
            method: 'GET',
            user: mockUser,
            headers: {},
          }),
          getResponse: () => ({ header: headerMock }),
        }) as any;
      await userRateLimitGuard.canActivate(ctx);
      expect(headerMock).toHaveBeenCalledWith('X-RateLimit-Limit', '60');
      expect(headerMock).toHaveBeenCalledWith('X-RateLimit-Remaining', '59');
      expect(headerMock).toHaveBeenCalledWith(
        'X-RateLimit-Reset',
        expect.any(Number),
      );
    });
  });

  describe('Rate Limit Bypass Prevention', () => {
    test('health and metrics endpoints bypass rate limiting', async () => {
      jest
        .spyOn(Reflector.prototype, 'getAllAndOverride')
        .mockReturnValue(null);
      const ctx = mockRequestContext({ url: '/health' });
      const result = await userRateLimitGuard.canActivate(ctx);
      expect(result).toBe(true);
    });

    test('different IPs have separate rate limit counters', async () => {
      const guard = new ThrottlerBehindProxyGuard();
      const req1 = { ip: '10.0.0.1', ips: ['203.0.113.5'] };
      const req2 = { ip: '10.0.0.2', ips: ['198.51.100.7'] };
      const tracker1 = await (guard as any).getTracker(req1);
      const tracker2 = await (guard as any).getTracker(req2);
      expect(tracker1).not.toBe(tracker2);
    });
  });

  describe('Auth Endpoint Stricter Limits', () => {
    test('auth group has lower limit than api group', () => {
      const authLimit = parseInt(process.env.RATE_LIMIT_AUTH || '5', 10);
      const apiLimit = parseInt(process.env.RATE_LIMIT_API || '60', 10);
      expect(authLimit).toBeLessThan(apiLimit);
    });

    test('kyc group has lower limit than api group', () => {
      const kycLimit = parseInt(process.env.RATE_LIMIT_KYC || '5', 10);
      const apiLimit = parseInt(process.env.RATE_LIMIT_API || '60', 10);
      expect(kycLimit).toBeLessThan(apiLimit);
    });
  });

  describe('Rate Limit Violation Logging', () => {
    test('rate limit violations are logged for authenticated users', async () => {
      const mockUser: Partial<User> = { id: 'user-violation-1' };
      jest
        .spyOn(Reflector.prototype, 'getAllAndOverride')
        .mockReturnValue({ group: 'auth', limit: 5, ttl: 60000 });
      const auditLogSpy = jest
        .spyOn(auditLogService, 'log')
        .mockResolvedValue({} as any);
      const redisMock = {
        incr: jest.fn().mockResolvedValue(6),
        pexpire: jest.fn().mockResolvedValue(1),
        pttl: jest.fn().mockResolvedValue(30000),
      };
      (userRateLimitGuard as any).redis = redisMock;
      const ctx = mockRequestContext({ user: mockUser });
      try {
        await userRateLimitGuard.canActivate(ctx);
      } catch {}
      expect(auditLogSpy).toHaveBeenCalledWith(
        'rate_limit_exceeded',
        'rate_limit',
        'user-violation-1',
        'user-violation-1',
        expect.objectContaining({ group: 'auth' }),
        expect.any(String),
      );
    });
  });
});
