# Post-Deployment Verification Checklist

> Run this checklist after every deployment to production.

---

## Immediate Health Checks

```bash
# 1. Basic health check
curl -f https://api.dreamhome11.com/health
# Expected: {"status":"ok","timestamp":"...","uptime":...}

# 2. Readiness check (DB + Redis)
curl -f https://api.dreamhome11.com/health/ready
# Expected: {"status":"ok","checks":[...]}

# 3. Liveness check
curl -f https://api.dreamhome11.com/health/live
# Expected: {"status":"ok","timestamp":"..."}

# 4. Metrics endpoint
curl -s https://api.dreamhome11.com/metrics | head -20
# Expected: Prometheus metrics output starting with # HELP

# 5. Check replicas are healthy
kubectl get pods -l app=api -o wide
# Expected: 3/3 pods in Running state, all READY 1/1
```

**Pass/Fail:** `___` / `___`

---

## Functional Checks

### Authentication
```bash
# 1. Mock login (if available in staging)
curl -s -X POST https://api.dreamhome11.com/api/v1/auth/mock-login \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+919999999999"}'
# Expected: 201 with accessToken and user

# 2. Request OTP
curl -s -X POST https://api.dreamhome11.com/api/v1/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+919999999999"}'
# Expected: 200 with success:true
```
**Pass/Fail:** `___` / `___`

### Contest Flow
```bash
# 1. List contests
curl -s https://api.dreamhome11.com/api/v1/contests?status=running\&page=1\&limit=5 \
  -H "Authorization: Bearer $TOKEN"
# Expected: 200 with paginated contest list

# 2. Get contest details
curl -s https://api.dreamhome11.com/api/v1/contests/$CONTEST_ID \
  -H "Authorization: Bearer $TOKEN"
# Expected: 200 with contest data
```
**Pass/Fail:** `___` / `___`

### Leaderboard
```bash
# 1. Global leaderboard
curl -s https://api.dreamhome11.com/api/v1/leaderboard?page=1\&limit=10 \
  -H "Authorization: Bearer $TOKEN"
# Expected: 200 with entries array and pagination

# 2. My rank
curl -s https://api.dreamhome11.com/api/v1/leaderboard/me \
  -H "Authorization: Bearer $TOKEN"
# Expected: 200 with rank, score, totalCount
```
**Pass/Fail:** `___` / `___`

### Wallet & Transactions
```bash
# 1. Check balance
curl -s https://api.dreamhome11.com/api/v1/transactions/balance \
  -H "Authorization: Bearer $TOKEN"
# Expected: 200 with balance data

# 2. Transaction history
curl -s https://api.dreamhome11.com/api/v1/transactions?page=1\&limit=10 \
  -H "Authorization: Bearer $TOKEN"
# Expected: 200 with transaction list
```
**Pass/Fail:** `___` / `___`

### Payment (Manual Test)
```bash
# 1. Initiate a test deposit (₹10)
# Use the app or API to create a ₹10 deposit

# 2. Verify webhook receipt
# Check payment gateway logs for webhook delivery

# 3. Confirm balance update
curl -s https://api.dreamhome11.com/api/v1/transactions/balance \
  -H "Authorization: Bearer $TOKEN"
# Verify balance increased by ₹10
```
**Pass/Fail:** `___` / `___`

---

## Performance Checks

```bash
# 1. Measure response times for critical endpoints
for endpoint in /health /health/ready /api/v1/contests; do
  start=$(date +%s%N)
  curl -so /dev/null -w "%{http_code}" "https://api.dreamhome11.com$endpoint"
  end=$(date +%s%N)
  duration=$(( (end - start) / 1000000 ))
  echo " $endpoint: ${duration}ms"
done

# 2. Check error rate in last 5 minutes
# (via Prometheus / metrics endpoint)
curl -s https://api.dreamhome11.com/metrics | grep "^http_requests_duration_seconds_count{.*status_code=\"5"

# 3. Check database connections
# (via pg_stat_activity or DB exporter)
# Expected: active connections < 50% of pool max

# 4. Check Redis memory
# (via Redis INFO or redis-exporter)
# Expected: used_memory < 60% of maxmemory
```

### Acceptance Criteria
| Metric | Target | Actual | Pass/Fail |
|--------|--------|--------|-----------|
| Avg response time | < 500ms | `___` | `___` |
| 5xx error rate (5m) | 0% | `___` | `___` |
| Database connections | < 50% pool | `___` | `___` |
| Redis memory | < 60% | `___` | `___` |

---

## Monitoring & Alerting Checks

```bash
# 1. Verify Prometheus targets are up
# Check http://prometheus:9090/targets

# 2. Verify Alertmanager is running
# Check http://alertmanager:9093/#/alerts

# 3. Verify Grafana dashboard loads
# Check http://grafana:3001/d/api-monitoring

# 4. Smoke test run (automated)
cd backend && ./test/smoke/run-smoke.sh --base-url https://api.dreamhome11.com
# Expected: All tests pass
```
**Pass/Fail:** `___` / `___`

---

## Rollback Decision

> If ANY of the following conditions are met, trigger an immediate rollback.

| Condition | Threshold | Current | Rollback? |
|-----------|-----------|---------|-----------|
| 5xx error rate | > 5% | `___` | `___` |
| p99 latency | > 3s | `___` | `___` |
| Critical alerts firing | Any | `___` | `___` |
| Health check failing | Yes/No | `___` | `___` |
| Payment flow broken | Yes/No | `___` | `___` |

### Rollback Procedure

```bash
# Option 1: Kubernetes rollback
kubectl rollout undo deployment/api

# Option 2: Revert Docker image
kubectl set image deployment/api api=dreamhome11/api:${PREVIOUS_TAG}

# Option 3: Database migration rollback (if needed)
npx typeorm migration:revert

# Verification after rollback
kubectl rollout status deployment/api
```

---

## Sign-off

| Check Area | Verified By | Status | Notes |
|------------|-------------|--------|-------|
| Health Checks | | ✅ / ❌ | |
| Functional Tests | | ✅ / ❌ | |
| Performance | | ✅ / ❌ | |
| Monitoring | | ✅ / ❌ | |
| Rollback Ready | | ✅ / ❌ | |

**Deployment Verdict:** `DEPLOYED` / `ROLLED BACK`
**Signed-off by:** `_____________`
**Date:** `_____________`
