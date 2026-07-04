import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/auth/guards/roles.guard';
import { ApiKeyGuard } from '../../src/common/guards/api-key.guard';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { UsersService } from '../../src/users/users.service';
import { User, UserRole } from '../../src/users/entities/user.entity';
import { AuditLogService } from '../../src/common/audit/audit-log.service';

function mockExecutionContext(headers: Record<string, string>, user?: Partial<User>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers,
        user: user || null,
        ip: '127.0.0.1',
        method: 'GET',
        url: '/api/v1/admin/users',
      }),
      getResponse: () => ({
        header: () => {},
      }),
    }),
    getHandler: () => {},
    getClass: () => {},
  } as unknown as ExecutionContext;
}

describe('Security: Authentication', () => {
  let jwtGuard: JwtAuthGuard;
  let rolesGuard: RolesGuard;
  let apiKeyGuard: ApiKeyGuard;
  let jwtService: JwtService;
  let usersService: UsersService;

  const mockUser: User = {
    id: 'user-1',
    role: UserRole.USER,
    phoneNumber: '+919999999999',
    isActive: true,
  } as User;

  const mockAdmin: User = {
    id: 'admin-1',
    role: UserRole.ADMIN,
    phoneNumber: '+918888888888',
    isActive: true,
  } as User;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        RolesGuard,
        Reflector,
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: ApiKeyGuard,
          useValue: {
            canActivate: jest.fn(),
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            log: jest.fn().mockResolvedValue({}),
            logLogin: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    jwtGuard = module.get<JwtAuthGuard>(JwtAuthGuard);
    rolesGuard = module.get<RolesGuard>(RolesGuard);
    apiKeyGuard = module.get<ApiKeyGuard>(ApiKeyGuard);
    jwtService = module.get<JwtService>(JwtService);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('JWT Authentication', () => {
    test('missing Authorization header returns 401', async () => {
      const ctx = mockExecutionContext({});
      await expect(jwtGuard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });

    test('non-Bearer Authorization header returns 401', async () => {
      const ctx = mockExecutionContext({ authorization: 'Basic dXNlcjpwYXNz' });
      await expect(jwtGuard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });

    test('expired JWT returns 401', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('jwt expired');
      });
      const ctx = mockExecutionContext({ authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyLTEiLCJleHAiOjE1MDAwMDAwMDB9.invalid' });
      await expect(jwtGuard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });

    test('tampered JWT signature returns 401', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('invalid signature');
      });
      const ctx = mockExecutionContext({ authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyLTEifQ.tampered' });
      await expect(jwtGuard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });

    test('malformed JWT returns 401', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('jwt malformed');
      });
      const ctx = mockExecutionContext({ authorization: 'Bearer not-a-jwt' });
      await expect(jwtGuard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });

    test('valid JWT with non-existent user returns 401', async () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 'nonexistent', phoneNumber: '+911111111111' });
      jest.spyOn(usersService, 'findById').mockResolvedValue(null);
      const ctx = mockExecutionContext({ authorization: 'Bearer valid.jwt.token' });
      await expect(jwtGuard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });

    test('valid JWT with suspended user returns 401', async () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 'user-1', phoneNumber: '+919999999999' });
      jest.spyOn(usersService, 'findById').mockResolvedValue({ ...mockUser, isActive: false });
      const ctx = mockExecutionContext({ authorization: 'Bearer valid.jwt.token' });
      await expect(jwtGuard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });

    test('valid JWT with active user returns true', async () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 'user-1', phoneNumber: '+919999999999' });
      jest.spyOn(usersService, 'findById').mockResolvedValue(mockUser);
      const ctx = mockExecutionContext({ authorization: 'Bearer valid.jwt.token' });
      await expect(jwtGuard.canActivate(ctx)).resolves.toBe(true);
    });

    test('empty Bearer token returns 401', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('jwt malformed');
      });
      const ctx = mockExecutionContext({ authorization: 'Bearer ' });
      await expect(jwtGuard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });

    test('multiple Authorization headers are not accepted', async () => {
      const ctx = mockExecutionContext({
        authorization: 'Bearer valid.token.here',
        'x-forwarded-for': '127.0.0.1',
      });
      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 'user-1', phoneNumber: '+919999999999' });
      jest.spyOn(usersService, 'findById').mockResolvedValue(mockUser);
      await expect(jwtGuard.canActivate(ctx)).resolves.toBe(true);
    });
  });

  describe('Role-Based Access Control', () => {
    test('user without role accessing admin endpoint returns 403', () => {
      const ctx = mockExecutionContext({ authorization: 'Bearer token' }, { role: UserRole.USER });
      const reflector = new Reflector();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
      const guard = new RolesGuard(reflector);
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    test('admin accessing admin endpoint returns true', () => {
      const ctx = mockExecutionContext({ authorization: 'Bearer token' }, { role: UserRole.ADMIN });
      const reflector = new Reflector();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
      const guard = new RolesGuard(reflector);
      expect(guard.canActivate(ctx)).toBe(true);
    });

    test('moderator accessing admin-only endpoint returns 403', () => {
      const ctx = mockExecutionContext({ authorization: 'Bearer token' }, { role: UserRole.MODERATOR });
      const reflector = new Reflector();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
      const guard = new RolesGuard(reflector);
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    test('unauthenticated request to admin endpoint returns 403', () => {
      const ctx = mockExecutionContext({ authorization: 'Bearer token' }, null);
      const reflector = new Reflector();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
      const guard = new RolesGuard(reflector);
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    test('endpoint without role metadata allows all authenticated users', () => {
      const ctx = mockExecutionContext({ authorization: 'Bearer token' }, { role: UserRole.USER });
      const reflector = new Reflector();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
      const guard = new RolesGuard(reflector);
      expect(guard.canActivate(ctx)).toBe(true);
    });

    test('moderator can access moderator endpoints', () => {
      const ctx = mockExecutionContext({ authorization: 'Bearer token' }, { role: UserRole.MODERATOR });
      const reflector = new Reflector();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN, UserRole.MODERATOR]);
      const guard = new RolesGuard(reflector);
      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('API Key Authentication', () => {
    const VALID_API_KEY = 'test-api-key-1234567890';
    const VALID_API_KEY_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

    beforeAll(() => {
      process.env.API_KEYS = `${VALID_API_KEY},${VALID_API_KEY_HASH}`;
    });

    afterAll(() => {
      delete process.env.API_KEYS;
      delete process.env.RATE_LIMIT_API_KEY;
    });

    test('missing X-API-Key header returns 401', async () => {
      const ctx = mockExecutionContext({});
      const reflector = new Reflector();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      const auditLog = new AuditLogService(null as any);
      const redisMock = { incr: jest.fn().mockResolvedValue(1), pexpire: jest.fn().mockResolvedValue(1) };
      const guard = new ApiKeyGuard(redisMock as any, reflector, auditLog);
      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });

    test('invalid API key returns 401', async () => {
      const ctx = mockExecutionContext({ 'x-api-key': 'invalid-key' });
      const reflector = new Reflector();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      const auditLog = new AuditLogService(null as any);
      const redisMock = { incr: jest.fn().mockResolvedValue(1), pexpire: jest.fn().mockResolvedValue(1) };
      const guard = new ApiKeyGuard(redisMock as any, reflector, auditLog);
      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });

    test('valid API key returns true', async () => {
      const ctx = mockExecutionContext({ 'x-api-key': VALID_API_KEY });
      const reflector = new Reflector();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      const auditLog = new AuditLogService(null as any);
      const redisMock = { incr: jest.fn().mockResolvedValue(1), pexpire: jest.fn().mockResolvedValue(1) };
      const guard = new ApiKeyGuard(redisMock as any, reflector, auditLog);
      await expect(guard.canActivate(ctx)).resolves.toBe(true);
    });

    test('API key rate limit exceeded returns 401', async () => {
      const reflector = new Reflector();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      const auditLog = new AuditLogService(null as any);
      process.env.RATE_LIMIT_API_KEY = '2';
      const redisMock = {
        incr: jest.fn()
          .mockResolvedValueOnce(1)
          .mockResolvedValueOnce(2)
          .mockResolvedValueOnce(3),
        pexpire: jest.fn().mockResolvedValue(1),
      };
      const guard = new ApiKeyGuard(redisMock as any, reflector, auditLog);
      const ctx1 = mockExecutionContext({ 'x-api-key': VALID_API_KEY });
      await expect(guard.canActivate(ctx1)).resolves.toBe(true);
      const ctx2 = mockExecutionContext({ 'x-api-key': VALID_API_KEY });
      await expect(guard.canActivate(ctx2)).resolves.toBe(true);
      const ctx3 = mockExecutionContext({ 'x-api-key': VALID_API_KEY });
      await expect(guard.canActivate(ctx3)).rejects.toThrow(UnauthorizedException);
    });

    test('empty API key returns 401', async () => {
      const ctx = mockExecutionContext({ 'x-api-key': '' });
      const reflector = new Reflector();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      const auditLog = new AuditLogService(null as any);
      const redisMock = { incr: jest.fn().mockResolvedValue(1), pexpire: jest.fn().mockResolvedValue(1) };
      const guard = new ApiKeyGuard(redisMock as any, reflector, auditLog);
      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Auth Header Injection', () => {
    test('newline injection in Authorization header is rejected', async () => {
      const ctx = mockExecutionContext({ authorization: 'Bearer valid\r\nX-Injected: true' });
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('jwt malformed');
      });
      await expect(jwtGuard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });

    test('null byte in Authorization header is rejected', async () => {
      const ctx = mockExecutionContext({ authorization: 'Bearer valid\x00token' });
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('jwt malformed');
      });
      await expect(jwtGuard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });
  });
});
