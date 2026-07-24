import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    console.log('[RolesGuard] Authorizing request:', {
      requiredRoles,
      userId: user?.id,
      userPhone: user?.phoneNumber,
      userRole: user?.role,
    });
    if (!user) {
      throw new ForbiddenException('Access denied.');
    }
    const hasRole = requiredRoles.some((role) => user.role === role);
    if (!hasRole) {
      console.log(
        `[RolesGuard] Forbidden: User role is ${user.role}, but required roles are: ${requiredRoles.join(', ')}`,
      );
      throw new ForbiddenException(
        'Insufficient permissions. Admin access required.',
      );
    }
    return true;
  }
}
