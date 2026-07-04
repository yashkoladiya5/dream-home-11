# Dream Home 11 - Monitoring Setup Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Monitoring Architecture                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────────┐    ┌────────────────────┐    │
│  │ Flutter  │───▶│   Sentry     │───▶│  Sentry Dashboard  │    │
│  │  App     │    │  (Crashes)   │    │                    │    │
│  └──────────┘    └──────────────┘    └────────────────────┘    │
│       │                                                        │
│       │ HTTP                                                    │
│       ▼                                                        │
│  ┌──────────┐    ┌──────────────┐    ┌────────────────────┐    │
│  │ Backend  │───▶│  Prometheus  │───▶│  Grafana           │    │
│  │ NestJS   │    │  (Metrics)   │    │  (Dashboards)      │    │
│  └──────────┘    └──────────────┘    └────────────────────┘    │
│       │                    │                   │                │
│       │                    │                   │                │
│       ▼                    ▼                   ▼                │
│  ┌──────────┐    ┌──────────────┐    ┌────────────────────┐    │
│  │ Sentry   │    │  Alertmanager│───▶│  Slack / Email      │    │
│  │ (Errors) │    │  (Alerts)    │    │  (Notifications)    │    │
│  └──────────┘    └──────────────┘    └────────────────────┘    │
│                                                                 │
│  ┌──────────┐    ┌──────────────┐    ┌────────────────────┐    │
│  │ Checkly  │───▶│  Health      │───▶│  Status Page       │    │
│  │ (Uptime) │    │  Checks      │    │                    │    │
│  └──────────┘    └──────────────┘    └────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

- Docker & Docker Compose
- kubectl (for Kubernetes deployments)
- Cloud provider credentials (AWS/GCP/Azure)
- Grafana Cloud account (optional, for managed hosting)

## 1. Backend Error Tracking Service

### Setup

The error tracking service is already integrated into the codebase at `backend/src/common/monitoring/error-tracking.service.ts`.

**Usage in any NestJS module:**

```typescript
import { ErrorTrackingService } from '../common/monitoring/error-tracking.service';

@Injectable()
export class SomeService {
  constructor(private readonly errorTracking: ErrorTrackingService) {}

  async riskyOperation() {
    try {
      await this.doSomething();
    } catch (error) {
      this.errorTracking.captureError(error, {
        userId: '123',
        endpoint: '/api/contests',
        method: 'POST',
        statusCode: 500,
        extra: { contestId: '456' },
      });
      throw error;
    }
  }
}
```

### Integration with ErrorTrackingService

- Wraps `Sentry.captureException`
- Automatically captures context (userId, requestId, endpoint, method)
- Tracks error rates per endpoint via Prometheus
- Adds breadcrumbs for debugging

### Sentry DSN Configuration

Set in `.env`:

```env
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_TRACES_SAMPLE_RATE=0.2
NODE_ENV=production
```

## 2. Health Metrics Service

### Setup

The health metrics service runs at `backend/src/common/monitoring/health-metrics.service.ts` and automatically:

- Checks system health every 30 seconds
- Monitors CPU, memory, Redis, and database pool
- Exposes metrics to Prometheus
- Logs warnings when thresholds are exceeded

### Thresholds Configuration

Set in `.env`:

```env
HEALTH_CPU_THRESHOLD=85
HEALTH_MEMORY_THRESHOLD=85
HEALTH_REDIS_MEMORY_THRESHOLD=80
HEALTH_DB_POOL_THRESHOLD=80
HEALTH_CHECK_INTERVAL_MS=30000
```

### Metrics Exposed

| Metric | Description |
|--------|-------------|
| `health_cpu_usage_percent` | Current CPU usage % |
| `health_memory_usage_percent` | Current memory usage % |
| `health_memory_total_bytes` | Total system memory |
| `health_redis_memory_usage_percent` | Redis memory usage % |
| `health_db_pool_usage_percent` | DB connection pool usage % |
| `health_db_pool_active_connections` | Active DB connections |
| `health_db_pool_idle_connections` | Idle DB connections |
| `health_check_status` | Component status (1=healthy, 0.5=degraded, 0=unhealthy) |
| `app_uptime_seconds` | Application uptime |

## 3. Grafana Dashboards

### Import Dashboards

1. Open Grafana → Dashboards → Import
2. Upload JSON files from `backend/deploy/monitoring/`:

| File | Dashboard | UID |
|------|-----------|-----|
| `grafana-dashboard-api.json` | API Monitoring | `dreamhome11-api` |
| `grafana-dashboard-business.json` | Business KPIs | `dreamhome11-business` |
| `grafana-dashboard-errors.json` | Error Tracking | `dreamhome11-errors` |
| `grafana-dashboard-flutter.json` | Flutter App | `dreamhome11-flutter` |

### Error Tracking Dashboard Panels

- **Sentry Error Count** - Total Sentry events in selected range
- **Error Rate by Endpoint** - Top 10 error-producing endpoints
- **Error Rate by Status Code** - Pie chart of error distribution
- **Top 10 Error Messages** - Most frequent error messages
- **Errors by Type** - Distribution by error class
- **Error Rate Trend (7-Day)** - Daily error rate with moving average
- **Response Time Distribution** - P50/P95 for success vs 5xx errors
- **5xx Error Rate** - Gauge showing current 5xx percentage
- **Error Rate by Severity** - Breakdown by Sentry severity
- **Endpoint Error Heatmap** - Heatmap of errors per endpoint

### Flutter Dashboard Panels

- **App Crash Rate** - Crash percentage per session
- **App Startup Time** - P50/P95/P99 cold start metrics
- **API Response Time from Flutter** - Client-measured API latency
- **Network Errors** - Network-related failures by type
- **User Sessions** - Active sessions by platform
- **App Version Distribution** - Users per app version
- **Crash Types** - Top crash types from Sentry
- **Platform Distribution** - Android vs iOS split
- **Sentry Flutter Error Count** - Daily Flutter errors
- **Flutter Memory Usage** - Client-reported memory metrics

## 4. Prometheus Alerts

### Import Alerts

```bash
# Import error-specific alerts
curl -X POST \
  -H "Content-Type: application/json" \
  -d @deploy/monitoring/error-alerts.json \
  http://localhost:9090/api/v1/rules

# Or via Grafana API
curl -X POST \
  -H "Content-Type: application/json" \
  -d @deploy/monitoring/error-alerts.json \
  http://localhost:3000/api/v1/provisioning/alert-rules
```

### Alert Rules

| Alert | Condition | Severity | Repeat |
|-------|-----------|----------|--------|
| High 5xx Error Rate | >5% for 5min | Critical | 15min |
| Error Rate Spike | >10% increase in 5min | Critical | 15min |
| New Error Type | New type in last 5min | Warning | 15min |
| Above Baseline | >2x 7-day average for 10min | Warning | 15min |

### Notification Routing

- **Critical alerts** → Slack `#alerts-errors` (immediate)
- **Warning alerts** → Slack `#alerts-errors` (15min repeat)
- **All critical** → Email `dev@dreamhome11.com` (24h repeat)

## 5. Checkly Uptime Monitoring

### Configuration

Edit `deploy/monitoring/checkly/checkly.config.ts`:

```typescript
export const config = {
  apiKey: process.env.CHECKLY_API_KEY,
  accountId: process.env.CHECKLY_ACCOUNT_ID,
  baseUrl: 'https://api.checklyhq.com',
};
```

### Available Checks

- `health-check.check.ts` - API health endpoint
- `api-contest-list.check.ts` - Contest listing API

### Run Checks Locally

```bash
cd deploy/monitoring/checkly
npx checkly test
```

## 6. Sentry for Flutter

### Setup

The Flutter Sentry config is at `lib/core/analytics/sentry_config.dart`.

**Build with Sentry:**

```bash
# Android
flutter run --dart-define=SENTRY_DSN=https://your-dsn@sentry.io/id \
           --dart-define=APP_ENV=production \
           --dart-define=APP_VERSION=1.0.0

# iOS
flutter run --dart-define=SENTRY_DSN=https://your-dsn@sentry.io/id \
           --dart-define=APP_ENV=production \
           --dart-define=APP_VERSION=1.0.0
```

### Features Enabled

- Screenshot attachment on crash
- View hierarchy attachment
- PII scrubbing (email, IP redacted)
- Automatic breadcrumbs for HTTP requests
- Query parameter sanitization

## 7. Docker Compose Setup

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./deploy/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
      - ./backend/deploy/monitoring:/var/lib/grafana/dashboards
    ports:
      - "3000:3000"

  alertmanager:
    image: prom/alertmanager:latest
    volumes:
      - ./deploy/monitoring/alertmanager.yml:/etc/alertmanager/alertmanager.yml
    ports:
      - "9093:9093"

volumes:
  grafana-data:
```

### Start Monitoring Stack

```bash
docker compose -f docker-compose.monitoring.yml up -d
```

## 8. Troubleshooting

### Common Issues

**Prometheus not scraping metrics:**
- Check `prometheus.yml` targets
- Verify `/metrics` endpoint returns data: `curl http://localhost:3000/metrics`
- Check Prometheus targets page: `http://localhost:9090/targets`

**Grafana dashboard shows "No data":**
- Verify Prometheus datasource is configured
- Check datasource UID matches dashboard panels (`PBFA97CFB590B2093`)
- Ensure metric names match (check Prometheus query page)

**Sentry not capturing errors:**
- Verify `SENTRY_DSN` environment variable is set
- Check Sentry project settings for data scrubbing rules
- Test with: `Sentry.captureMessage('test')` in a controller

**Health metrics not updating:**
- Check `HealthMetricsService` is injected in the module
- Verify Redis/PostgreSQL connection strings in env
- Check logs for connection timeout errors

**Alerts not firing:**
- Verify Alertmanager is running and reachable
- Check Grafana alert provisioning logs
- Test with: `curl -X POST http://localhost:9093/api/v1/alerts`

### Useful Commands

```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Query Prometheus
curl 'http://localhost:9090/api/v1/query?query=app_errors_total'

# Check Grafana datasources
curl http://localhost:3000/api/datasources

# List Grafana dashboards
curl http://localhost:3000/api/search

# Test alertmanager webhook
curl -X POST http://localhost:9093/api/v1/alerts \
  -H 'Content-Type: application/json' \
  -d '[{"labels":{"alertname":"test","severity":"warning"}}]'
```

## 9. Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `SENTRY_DSN` | Sentry DSN URL | (none) |
| `SENTRY_TRACES_SAMPLE_RATE` | Sentry traces sample rate | `0.2` |
| `HEALTH_CPU_THRESHOLD` | CPU warning threshold % | `85` |
| `HEALTH_MEMORY_THRESHOLD` | Memory warning threshold % | `85` |
| `HEALTH_REDIS_MEMORY_THRESHOLD` | Redis memory threshold % | `80` |
| `HEALTH_DB_POOL_THRESHOLD` | DB pool threshold % | `80` |
| `HEALTH_CHECK_INTERVAL_MS` | Health check interval | `30000` |
| `SLACK_WEBHOOK_URL` | Slack webhook for alerts | (none) |
| `CHECKLY_API_KEY` | Checkly API key | (none) |
| `CHECKLY_ACCOUNT_ID` | Checkly account ID | (none) |
