import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { ApiKeyGuard } from '../guards/api-key.guard';

export const API_KEY_AUTH_KEY = 'api_key_auth';

export function ApiKeyAuth() {
  return applyDecorators(
    SetMetadata(API_KEY_AUTH_KEY, true),
    UseGuards(ApiKeyGuard),
  );
}
