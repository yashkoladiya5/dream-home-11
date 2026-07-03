import { SetMetadata } from '@nestjs/common';

export const CACHE_TTL_KEY = 'cache_ttl';
export const NO_CACHE_KEY = 'no_cache';
export const INVALIDATE_CACHE_KEY = 'invalidate_cache';

export const CacheControl = (ttl: number) => SetMetadata(CACHE_TTL_KEY, ttl);
export const NoCache = () => SetMetadata(NO_CACHE_KEY, true);
export const InvalidateCache = (pattern: string) =>
  SetMetadata(INVALIDATE_CACHE_KEY, pattern);
