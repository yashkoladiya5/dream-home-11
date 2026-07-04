import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { UserRateLimitGuard } from '../guards/user-rate-limit.guard';

export const RATE_LIMIT_KEY = 'user_rate_limit';

export function UserRateLimit(group: string, limit?: number, ttl?: number) {
  return applyDecorators(
    SetMetadata(RATE_LIMIT_KEY, { group, limit, ttl }),
    UseGuards(UserRateLimitGuard),
  );
}
