import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../../users/entities/user.entity';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let mockReflector: jest.Mocked<Reflector>;
  let mockContext: any;

  beforeEach(() => {
    mockReflector = {
      getAllAndOverride: jest.fn(),
    } as any;
    guard = new RolesGuard(mockReflector);
  });

  const createMockContext = (user: any) =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
        getResponse: jest.fn(),
        getNext: jest.fn(),
      }),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn().mockReturnValue('http'),
    }) as any;

  describe('when no roles are required', () => {
    it('should return true', () => {
      mockReflector.getAllAndOverride.mockReturnValue(null);
      expect(guard.canActivate(createMockContext({}))).toBe(true);
    });

    it('should return true when roles array is empty', () => {
      mockReflector.getAllAndOverride.mockReturnValue([]);
      expect(guard.canActivate(createMockContext({}))).toBe(true);
    });
  });

  describe('when admin role is required', () => {
    it('should allow admin users', () => {
      mockReflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      const result = guard.canActivate(
        createMockContext({ role: UserRole.ADMIN }),
      );
      expect(result).toBe(true);
    });

    it('should deny regular users with ForbiddenException', () => {
      mockReflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      expect(() =>
        guard.canActivate(createMockContext({ role: UserRole.USER })),
      ).toThrow(ForbiddenException);
    });

    it('should deny unauthenticated requests', () => {
      mockReflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      expect(() => guard.canActivate(createMockContext(null))).toThrow(
        ForbiddenException,
      );
    });
  });

  describe('when multiple roles are required', () => {
    it('should allow users with any matching role', () => {
      mockReflector.getAllAndOverride.mockReturnValue([
        UserRole.ADMIN,
        UserRole.MODERATOR,
      ]);
      expect(
        guard.canActivate(createMockContext({ role: UserRole.MODERATOR })),
      ).toBe(true);
    });

    it('should deny users with no matching role', () => {
      mockReflector.getAllAndOverride.mockReturnValue([
        UserRole.ADMIN,
        UserRole.MODERATOR,
      ]);
      expect(() =>
        guard.canActivate(createMockContext({ role: UserRole.USER })),
      ).toThrow(ForbiddenException);
    });
  });
});
