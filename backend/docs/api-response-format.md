# API Response Format

## Success Response

All successful API responses follow a consistent structure:

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": { ... },
  "meta": { ... }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `statusCode` | number | HTTP status code (200, 201, etc.) |
| `message` | string | Human-readable success message |
| `data` | object/array | The response payload |
| `meta` | object | Pagination metadata (included for paginated responses) |

### Success — List Response (Paginated)

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": [
    { "id": "uuid-1", ... },
    { "id": "uuid-2", ... }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Success — Single Object

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": "uuid-1",
    "name": "Example",
    ...
  }
}
```

### Success — Action Confirmation

```json
{
  "statusCode": 200,
  "message": "Post created successfully",
  "data": {
    "post": { ... }
  }
}
```

---

## Error Response

All errors follow a consistent structure:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "requestId": "req-abc123-def456",
  "timestamp": "2026-07-03T12:00:00.000Z",
  "path": "/api/v1/contests/:id/join"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `statusCode` | number | HTTP status code |
| `message` | string | Human-readable error message |
| `error` | string | Error type/category |
| `requestId` | string | Unique request identifier for tracing |
| `timestamp` | string | ISO 8601 timestamp of when the error occurred |
| `path` | string | The request path that generated the error |

### Validation Error

```json
{
  "statusCode": 400,
  "message": [
    "phoneNumber must be a valid phone number",
    "deviceId should not be empty"
  ],
  "error": "Bad Request",
  "requestId": "req-abc123",
  "timestamp": "2026-07-03T12:00:00.000Z",
  "path": "/api/v1/auth/verify-otp"
}
```

### Authentication Error

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized",
  "requestId": "req-abc123",
  "timestamp": "2026-07-03T12:00:00.000Z",
  "path": "/api/v1/users/profile"
}
```

### Rate Limit Error

```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests",
  "error": "Too Many Requests",
  "requestId": "req-abc123",
  "timestamp": "2026-07-03T12:00:00.000Z",
  "path": "/api/v1/contests/:id/join"
}
```

### Not Found Error

```json
{
  "statusCode": 404,
  "message": "Contest not found",
  "error": "Not Found",
  "requestId": "req-abc123",
  "timestamp": "2026-07-03T12:00:00.000Z",
  "path": "/api/v1/contests/999"
}
```

### Forbidden Error

```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden",
  "requestId": "req-abc123",
  "timestamp": "2026-07-03T12:00:00.000Z",
  "path": "/api/v1/admin/dashboard"
}
```

---

## Pagination Meta Object

| Field | Type | Description |
|-------|------|-------------|
| `page` | number | Current page number (1-indexed) |
| `limit` | number | Items per page |
| `total` | number | Total items across all pages |
| `totalPages` | number | Total number of pages |
| `hasNext` | boolean | Whether a next page exists |
| `hasPrev` | boolean | Whether a previous page exists |

Some endpoints use an alternative pagination format with `hasMore` instead of the full meta object:

```json
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}
```

---

## Standard Error Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid input, validation failure, missing required fields |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Insufficient permissions (non-admin accessing admin routes) |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Duplicate entry, state conflict (e.g., already joined contest) |
| 422 | Unprocessable Entity | Business logic error (e.g., insufficient balance) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |
| 502 | Bad Gateway | Upstream service failure |
| 503 | Service Unavailable | Maintenance mode or temporary outage |

---

## HTTP Status Codes Used

| Method | Success | Error |
|--------|---------|-------|
| `GET` | 200 OK | 400, 401, 403, 404, 429, 500 |
| `POST` | 200 OK, 201 Created | 400, 401, 403, 404, 409, 422, 429, 500 |
| `PATCH` | 200 OK | 400, 401, 403, 404, 409, 429, 500 |
| `DELETE` | 200 OK | 401, 403, 404, 429, 500 |

---

## Request ID Header

Every request can include an `X-Request-Id` header for distributed tracing:

- **Client-provided**: If the client sends an `X-Request-Id` header, it is used as-is
- **Auto-generated**: If omitted, the server generates a UUID (format: `req-<uuid>`)
- **Response**: The same `X-Request-Id` is returned in the response headers
- **Logging**: All request logs include the request ID for correlation

### Header format

```
X-Request-Id: req-a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

## Response Headers

Every API response includes:

| Header | Description | Example |
|--------|-------------|---------|
| `X-Request-Id` | Unique request identifier | `req-abc123-def456` |
| `X-Response-Time` | Server processing time in ms | `42` |
| `X-API-Version` | Current API version | `1` |
| `X-RateLimit-Limit` | Rate limit quota | `30` |
| `X-RateLimit-Remaining` | Remaining requests in window | `28` |
| `X-RateLimit-Reset` | Unix timestamp when limit resets | `1719986400` |
| `Deprecation` | Whether this API version is deprecated | `true` |
| `Sunset` | When deprecated version will be removed | `Sat, 01 Jan 2027 00:00:00 GMT` |
