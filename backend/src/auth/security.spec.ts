import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Reflector } from '@nestjs/core';

describe('Security Integration', () => {
  describe('JwtAuthGuard', () => {
    it('should be defined and implement CanActivate', () => {
      expect(JwtAuthGuard).toBeDefined();
      const prototype = Object.getOwnPropertyNames(JwtAuthGuard.prototype);
      expect(prototype).toContain('canActivate');
    });
  });

  describe('RolesGuard', () => {
    let guard: RolesGuard;
    let mockReflector: jest.Mocked<Reflector>;

    beforeEach(() => {
      mockReflector = {
        getAllAndOverride: jest.fn(),
      } as any;
      guard = new RolesGuard(mockReflector);
    });

    it('should be defined and implement CanActivate', () => {
      expect(RolesGuard).toBeDefined();
      const prototype = Object.getOwnPropertyNames(RolesGuard.prototype);
      expect(prototype).toContain('canActivate');
    });

    const createMockCtx = (user: any) =>
      ({
        switchToHttp: () => ({
          getRequest: () => ({ user }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      }) as any;

    it('should allow access when no roles required', () => {
      mockReflector.getAllAndOverride.mockReturnValue(null);
      expect(guard.canActivate(createMockCtx({ role: 'user' }))).toBe(true);
    });

    it('should deny access when user does not have required role', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['admin']);
      expect(() => guard.canActivate(createMockCtx({ role: 'user' }))).toThrow(
        'Insufficient permissions',
      );
    });

    it('should allow access when user has required role', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['admin']);
      expect(guard.canActivate(createMockCtx({ role: 'admin' }))).toBe(true);
    });

    it('should deny access when user object is missing', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['admin']);
      expect(() => guard.canActivate(createMockCtx(undefined))).toThrow(
        'Access denied',
      );
    });
  });
});
