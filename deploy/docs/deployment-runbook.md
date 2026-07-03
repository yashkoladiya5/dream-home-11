# Deployment Runbook — Dream Home 11

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Docker | 24+ | Container runtime |
| Docker Compose | 2.20+ | Multi-container orchestration |
| kubectl | 1.28+ | Kubernetes control (optional) |
| AWS CLI | 2.x | S3 backups, ECR (optional) |
| Node.js | 20 LTS | NestJS runtime |
| Flutter | 3.10+ | Mobile app builds |
| PostgreSQL | 16 | Primary database |
| Redis | 7 | Cache, session, leaderboards |

---

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Runtime environment | `production` |
| `PORT` | Application listen port | `3000` |
| `DB_HOST` | PostgreSQL hostname | `pgbouncer` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USERNAME` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | (set via secret) |
| `DB_DATABASE` | Database name | `dream_home_11` |
| `JWT_SECRET` | JWT signing secret | (256-bit random) |
| `REDIS_HOST` | Redis hostname | `redis` |
| `REDIS_PORT` | Redis port | `6379` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to Firebase service account JSON | `./firebase-service-account.json` |
| `ENABLE_MOCK_AUTH` | Allow mock auth in dev | `true` |
| `SENTRY_DSN` | Sentry error tracking DSN | (none) |
| `SENTRY_TRACES_SAMPLE_RATE` | Sentry trace sample rate | `0.2` |
| `HEALTH_SECRET` | Secret for detailed health endpoint | (none) |
| `RAZORPAY_KEY_ID` | Razorpay API key | (none) |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret | (none) |
| `DB_POOL_SIZE` | PostgreSQL pool size | `50` |
| `JWT_EXPIRATION` | JWT token expiry | `7d` |
| `AWS_REGION` | AWS region (Fluentd) | `us-east-1` |
| `LOKI_URL` | Grafana Loki endpoint | (none) |

---

## Docker Deployment

### Build the Backend Image

```bash
# From the project root
docker build -t dreamhome11/backend:latest ./backend

# With a specific version tag
docker build -t dreamhome11/backend:1.0.0 ./backend
```

### Run with Docker Compose (Production)

```bash
# Start all services (app, db, redis, nginx, pgbouncer, certbot, fluentd)
docker-compose -f deploy/docker-compose.prod.yml up -d

# Check service status
docker-compose -f deploy/docker-compose.prod.yml ps
```

### Scale the App Service

```bash
# Scale to 5 replicas
docker-compose -f deploy/docker-compose.prod.yml up -d --scale app=5

# Scale down to 3
docker-compose -f deploy/docker-compose.prod.yml up -d --scale app=3
```

### Health Check

```bash
# Simple health check
curl http://localhost/health

# Readiness check (verifies DB + Redis)
curl http://localhost/health/ready

# Detailed health (requires HEALTH_SECRET if configured)
curl -H "X-Health-Key: your-secret" http://localhost/health/detailed
```

### View Logs

```bash
# All services
docker-compose -f deploy/docker-compose.prod.yml logs -f

# Single service (app, nginx, etc.)
docker-compose -f deploy/docker-compose.prod.yml logs -f app

# Last 100 lines
docker-compose -f deploy/docker-compose.prod.yml logs --tail=100 app
```

### Update

```bash
# Pull latest images and restart
docker-compose -f deploy/docker-compose.prod.yml pull
docker-compose -f deploy/docker-compose.prod.yml up -d

# Zero-downtime approach (rolling update with scale)
docker-compose -f deploy/docker-compose.prod.yml up -d --scale app=5 --no-recreate
# Then remove old containers one by one
```

---

## Kubernetes Deployment

### Prerequisites

- kubectl configured with the target cluster context
- [optional] Helm 3+

### Deploy

```bash
# Apply the production overlay
kubectl apply -k deploy/k8s/overlays/production

# Or with explicit namespace
kubectl apply -k deploy/k8s/overlays/production -n dream-home-11
```

### Verify

```bash
# Check pods
kubectl -n dream-home-11 get pods

# Check deployments
kubectl -n dream-home-11 get deployments

# Check services
kubectl -n dream-home-11 get svc

# View logs
kubectl -n dream-home-11 logs -l app=dream-home-11 --tail=100

# Port forward (for debugging)
kubectl -n dream-home-11 port-forward svc/dream-home-11 3000:3000
```

### Rollback

```bash
# Rollback to previous revision
kubectl rollout undo deployment/dream-home-11 -n dream-home-11

# Rollback to specific revision
kubectl rollout undo deployment/dream-home-11 -n dream-home-11 --to-revision=3

# Check rollout status
kubectl rollout status deployment/dream-home-11 -n dream-home-11

# View rollout history
kubectl rollout history deployment/dream-home-11 -n dream-home-11
```

### Scaling (K8s)

```bash
# Manual scale
kubectl scale deployment/dream-home-11 -n dream-home-11 --replicas=5

# Autoscale (if metrics server is installed)
kubectl autoscale deployment/dream-home-11 -n dream-home-11 --min=3 --max=10 --cpu-percent=70
```

---

## Database Migrations

### Development

```bash
cd backend

# Generate migration from entity changes
npm run migration:generate -- src/migrations/MigrationName

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show
```

### Production (Docker)

```bash
# Run migrations using the production image
docker-compose -f deploy/docker-compose.prod.yml run --rm app npm run migration:run

# Or using a one-off container
docker run --rm \
  --network dream_network \
  --env-file backend/.env.production \
  dreamhome11/backend:latest \
  npx typeorm migration:run -d dist/config/typeorm.config.js
```

---

## Database Backup & Restore

### Automated Backup

```bash
# Run the backup script
./backend/scripts/backup.sh --s3-bucket dreamhome11-backups

# Options
./backend/scripts/backup.sh \
  --s3-bucket dreamhome11-backups \
  --db-host localhost \
  --db-name dream_home_11 \
  --db-user postgres \
  --encrypt-key (optional GPG key)
```

### Manual Backup

```bash
# Direct pg_dump
pg_dump -h localhost -U postgres -d dream_home_11 -F c -f backup_$(date +%Y%m%d_%H%M%S).dump

# With compression
pg_dump -h localhost -U postgres -d dream_home_11 | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore

```bash
# Restore from compressed backup
./backend/scripts/restore.sh backup-file.sql.gz

# Options
./backend/scripts/restore.sh \
  backup-file.sql.gz \
  --db-host localhost \
  --db-name dream_home_11 \
  --db-user postgres
```

### S3 Lifecycle

Backup retention is managed via S3 lifecycle policy (see `backend/scripts/s3-lifecycle.json`):
- Daily backups: retained for 30 days
- Weekly backups: retained for 3 months
- Monthly backups: retained for 1 year

---

## Rollback Procedure

### Application Rollback (Docker)

1. **Identify the issue**: Check logs and Sentry for errors
   ```bash
   docker-compose -f deploy/docker-compose.prod.yml logs --tail=200 app
   ```

2. **Rollback to previous image**:
   ```bash
   # Tag the previous known-good image
   docker tag dreamhome11/backend:1.0.0 dreamhome11/backend:latest

   # Redeploy
   docker-compose -f deploy/docker-compose.prod.yml up -d
   ```

3. **Verify**:
   ```bash
   curl http://localhost/health/ready
   ```

4. **If DB migration was applied**:
   - Revert the migration:
   ```bash
   docker-compose -f deploy/docker-compose.prod.yml run --rm app npm run migration:revert
   ```

### Application Rollback (Kubernetes)

1. **Rollback deployment**:
   ```bash
   kubectl rollout undo deployment/dream-home-11 -n dream-home-11
   ```

2. **Monitor**:
   ```bash
   kubectl rollout status deployment/dream-home-11 -n dream-home-11
   ```

3. **Verify**:
   ```bash
   kubectl -n dream-home-11 get pods
   curl http://$(kubectl -n dream-home-11 get svc dream-home-11 -o jsonpath='{.status.loadBalancer.ingress[0].ip}')/health
   ```

### Database Rollback

1. **Stop the application** (to prevent writes):
   ```bash
   docker-compose -f deploy/docker-compose.prod.yml stop app
   ```

2. **Restore from backup**:
   ```bash
   ./backend/scripts/restore.sh backup_before_deploy.sql.gz
   ```

3. **Restart the application**:
   ```bash
   docker-compose -f deploy/docker-compose.prod.yml start app
   ```

4. **Verify data integrity**:
   ```bash
   curl http://localhost/health/detailed
   ```

---

## Monitoring

### Prometheus Metrics

Metrics are exposed at the `/metrics` endpoint (Prometheus text format):

```yaml
# prometheus.yml scrape config
scrape_configs:
  - job_name: 'dream-home-11'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

Key metrics:
- `http_requests_total` — Request count by method, path, status
- `http_request_duration_seconds` — Request latency histogram
- `db_query_duration_seconds` — Database query latency
- `redis_operations_total` — Redis operation count
- `active_connections` — Active WebSocket connections

### Grafana

- Local: `http://localhost:3001`
- Default dashboards:
  - **API Overview**: Request rate, error rate, p50/p95/p99 latency
  - **Database**: Connection pool, query performance, slow queries
  - **Redis**: Cache hit rate, memory usage, command rate
  - **Business**: User registrations, contest joins, payment volume
  - **Infrastructure**: CPU, memory, disk, network

### Sentry

- Dashboard: Sentry project dashboard for error tracking
- Captures:
  - Unhandled exceptions
  - 5xx server errors
  - Performance traces (configurable sample rate)
  - Custom breadcrumbs for critical operations

### Log Aggregation (Fluentd)

- Logs are collected by Fluentd and forwarded to:
  - AWS S3 (long-term archive)
  - Grafana Loki (real-time search)
  - CloudWatch (AWS environment)
- Log format: JSON structured logging via Pino

### Alerts to Configure

| Alert | Condition | Channel |
|-------|-----------|---------|
| HTTP 5xx rate | > 1% in 5 minutes | PagerDuty, Slack |
| Health check failure | /health/ready returns degraded | PagerDuty |
| High latency | p99 > 2s in 5 minutes | Slack |
| Low disk space | < 10% remaining | PagerDuty |
| Payment failure rate | > 5% in 15 minutes | Slack, Email |
| DB connection pool exhaustion | > 80% pool utilization | PagerDuty |

---

## Emergency Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Lead Developer | — | — | dev@dreamhome11.com |
| DevOps Engineer | — | — | devops@dreamhome11.com |
| Database Admin | — | — | dba@dreamhome11.com |
| Security Lead | — | — | security@dreamhome11.com |
| Product Manager | — | — | product@dreamhome11.com |
| On-call Rotation | — | — | oncall@dreamhome11.com |

---

## Quick Reference Commands

```bash
# === BACKEND ===
npm run start:dev        # Development server with hot reload
npm run build            # Production build
npm run test             # Unit tests
npm run test:e2e         # End-to-end tests
npm run migration:run    # Run database migrations

# === DOCKER ===
docker-compose -f deploy/docker-compose.prod.yml up -d          # Start all services
docker-compose -f deploy/docker-compose.prod.yml down            # Stop all services
docker-compose -f deploy/docker-compose.prod.yml logs -f app    # Follow app logs
docker-compose -f deploy/docker-compose.prod.yml restart app    # Restart app service

# === FLUTTER ===
flutter run              # Run on connected device/emulator
flutter build apk        # Build Android APK
flutter build ios        # Build iOS archive
flutter test             # Run Flutter tests

# === DATABASE ===
./backend/scripts/backup.sh --s3-bucket dreamhome11-backups    # Backup
./backend/scripts/restore.sh backup.sql.gz                      # Restore

# === KUBERNETES ===
kubectl -n dream-home-11 get pods                               # List pods
kubectl -n dream-home-11 logs -l app=dream-home-11             # View logs
kubectl rollout undo deployment/dream-home-11 -n dream-home-11 # Rollback
```
