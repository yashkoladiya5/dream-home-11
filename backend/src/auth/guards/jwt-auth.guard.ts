import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UsersService } from '../../users/users.service';
import { User } from '../../users/entities/user.entity';

interface RequestWithUser extends Request {
  user?: User;
}

interface JwtPayload {
  sub: string;
  phoneNumber: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header. Expected: Bearer <token>',
      );
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('User no longer exists.');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('User account is suspended.');
      }

      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired session token.');
    }
  }
}
