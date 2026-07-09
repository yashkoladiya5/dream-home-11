import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsersService } from '../../users/users.service';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockUsersService: jest.Mocked<UsersService>;

  const createMockContext = (authHeader?: string) =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: authHeader,
          },
        }),
        getResponse: jest.fn(),
        getNext: jest.fn(),
      }),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn().mockReturnValue('http'),
    }) as any;

  beforeEach(() => {
    mockJwtService = {
      verify: jest.fn(),
    } as any;
    mockUsersService = {
      findById: jest.fn(),
    } as any;
    guard = new JwtAuthGuard(mockJwtService, mockUsersService, { getAllAndOverride: jest.fn().mockReturnValue(false) } as any);
  });

  describe('valid token', () => {
    it('should allow access when token is valid and user is active', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-1',
        phoneNumber: '+919999999999',
      });
      mockUsersService.findById.mockResolvedValue({
        id: 'user-1',
        isActive: true,
      } as any);

      await expect(
        guard.canActivate(createMockContext('Bearer valid-token')),
      ).resolves.toBe(true);
    });
  });

  describe('missing auth header', () => {
    it('should throw 401 when auth header is missing', async () => {
      await expect(guard.canActivate(createMockContext())).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw 401 for non-Bearer header', async () => {
      await expect(
        guard.canActivate(createMockContext('Basic dXNlcjpwYXNz')),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('invalid token', () => {
    it('should throw 401 when JWT verification fails', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt malformed');
      });

      await expect(
        guard.canActivate(createMockContext('Bearer bad-token')),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('inactive user', () => {
    it('should throw 401 when user account is suspended', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-1',
        phoneNumber: '+919999999999',
      });
      mockUsersService.findById.mockResolvedValue({
        id: 'user-1',
        isActive: false,
      } as any);

      await expect(
        guard.canActivate(createMockContext('Bearer valid-token')),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('non-existent user', () => {
    it('should throw 401 when user no longer exists', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'deleted-user',
        phoneNumber: '+919999999999',
      });
      mockUsersService.findById.mockResolvedValue(null);

      await expect(
        guard.canActivate(createMockContext('Bearer valid-token')),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
