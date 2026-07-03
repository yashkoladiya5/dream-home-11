# API Versioning Strategy

## Approach: URL-based Versioning

All API endpoints are versioned via the URL path prefix:

```
/api/v1/resource
/api/v2/resource
```

### Why URL-based?

- **Explicit**: Clients know exactly which version they are calling
- **Cacheable**: Different versions have different cache keys
- **Simple**: Easy to route, test, and document
- **Nginx-friendly**: Can be routed to different upstreams if needed

---

## Version Lifecycle

```
                 6 months                   3 months
ACTIVE ─────────────────────► DEPRECATED ──────────► REMOVED
  (fully supported)          (warning headers)      (410 Gone)
```

### Active
- Current major version, receives all updates and bug fixes
- Default version for new integrations
- Fully documented and tested

### Deprecated
- Still functional but will be removed on a scheduled date
- Every response includes:
  - `Deprecation: true`
  - `Sunset: Sat, 01 Jan 2027 00:00:00 GMT`
- Six-month migration window from the deprecation announcement
- No new features added, only critical security patches

### Removed
- Returns `410 Gone` with a JSON body linking to the migration guide
- No longer routed to application logic
- Nginx catches these and returns the 410 response directly

---

## Response Headers

All API responses include:

| Header | Description | Example |
|--------|-------------|---------|
| `X-API-Version` | Current version of the API | `1` |
| `Deprecation` | Whether this version is deprecated | `true` |
| `Sunset` | When support ends (RFC 1123 format) | `Sat, 01 Jan 2027 00:00:00 GMT` |

### Example Headers (v1 Active)

```
HTTP/1.1 200 OK
X-API-Version: 1
```

### Example Headers (v1 Deprecated)

```
HTTP/1.1 200 OK
X-API-Version: 1
Deprecation: true
Sunset: Sat, 01 Jan 2027 00:00:00 GMT
```

### Example Response (v1 Removed)

```
HTTP/1.1 410 Gone
Content-Type: application/json

{
  "error": "gone",
  "message": "API version 1 is no longer supported",
  "migration_guide": "https://docs.dreamhome11.com/api/v1-to-v2-migration",
  "current_version": "2"
}
```

---

## Changelog Template

### Version X.Y.Z (YYYY-MM-DD)

```markdown
## Version X.Y.Z (YYYY-MM-DD)

### Added
- New endpoint: `POST /api/v{X}/resource`
- New field on response: `example_field`

### Changed
- `GET /api/v{X}/resource` now returns pagination metadata by default

### Deprecated
- `GET /api/v{X}/old-endpoint` — use `GET /api/v{X}/new-endpoint` instead
- Sunset date: YYYY-MM-DD

### Removed
- `POST /api/v{X}/deprecated-endpoint` — returns 410 Gone

### Fixed
- Fixed race condition in resource creation
```

---

## Migration Guide Template

### v1 → v2 Migration Guide

#### Breaking Changes

| v1 | v2 | Notes |
|----|----|-------|
| `/api/v1/users` | `/api/v2/users` | Base URL changed |
| `POST /api/v1/users/login` | `POST /api/v2/auth/login` | Auth moved to `/auth/` |
| Response: `{ "data": [...] }` | Response: `{ "items": [...], "total": N }` | Pagination wrapper added |
| `snake_case` fields | `camelCase` fields | Consistent casing |
| No rate limit headers | `X-RateLimit-*` headers added | See docs |

#### New Features in v2

- Webhook support for real-time events
- Bulk operations on contest entries
- Enhanced filtering and sorting

#### How to Migrate

1. Update all API base URLs from `/api/v1/` to `/api/v2/`
2. Update response parsing for paginated endpoints
3. Replace `snake_case` field references with `camelCase`
4. Add handling for `X-RateLimit-*` response headers
5. Test against the staging environment before production

---

## Current Versions

| Version | Status | Release Date | Sunset Date |
|---------|--------|-------------|-------------|
| v1 | Active | 2025-01-01 | — |
| v2 | In Development | TBD | — |

---

## Configuration

### Nginx Routing

```nginx
# API v1
location /api/v1/ {
    proxy_pass http://app_backend;
}

# API v2
location /api/v2/ {
    proxy_pass http://app_backend;
}

# Deprecated versions
location /api/v0/ {
    return 410 '{"error":"gone","message":"API version 0 is no longer supported","current_version":"1"}';
    add_header Content-Type application/json;
}
```

### Application-Level Version

The current API version is returned in the `X-API-Version` response header via a NestJS interceptor.

```typescript
// api-version.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ApiVersionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse();
    const request = context.switchToHttp().getRequest();
    const version = request.url.match(/\/api\/v(\d+)\//)?.[1] || '1';

    return next.handle().pipe(
      map((data) => {
        response.header('X-API-Version', version);
        return data;
      }),
    );
  }
}
```
