# Dream Home 11 - Operations Runbook

## On-Call Rotation

| Week | Primary Engineer | Secondary Engineer |
|------|-----------------|-------------------|
| Week 1 | TBD | TBD |
| Week 2 | TBD | TBD |
| Week 3 | TBD | TBD |
| Week 4 | TBD | TBD |

## Escalation Matrix

| Level | Role | Response Time | Contact |
|-------|------|---------------|---------|
| L1 | On-call engineer | < 15 min | PagerDuty / Phone |
| L2 | Senior engineer | < 30 min | Slack / Phone |
| L3 | Engineering manager | < 1 hour | Phone / Email |

## Daily Checks

### 1. Grafana Dashboard Review (5 min)

1. Open the API Monitoring dashboard: `https://grafana.dreamhome11.com/d/dreamhome11-api`
2. Open the Business KPIs dashboard: `https://grafana.dreamhome11.com/d/dreamhome11-business`
3. Verify:
   - No anomalous spikes in error rate (> 5% threshold)
   - P99 latency < 3s
   - Active connections within normal range
   - Contest join rates consistent with daily patterns
   - Revenue/withdrawal metrics trending normally

### 2. Error Rate Check in Sentry (2 min)

1. Open Sentry: `https://sentry.dreamhome11.com/organizations/dream-home-11/issues/`
2. Check for new issues in the last 24h
3. Verify no unhandled exceptions in production
4. Check error frequency trends

### 3. Database Size Monitoring (1 min)

```sql
SELECT pg_database_size('dream_home_11') / (1024*1024*1024) AS size_gb;
```

- Alert if growth exceeds 500 MB/day
- Expected size: < 50 GB

## Weekly Tasks

### 1. Review Slow Query Log (5 min)

```sql
SELECT query, calls, total_time / calls AS avg_time_ms
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 20;
```

- Flag any query averaging > 100ms
- Add missing indexes if repetitive pattern found
- Log findings in the operations tracker

### 2. Check Backup Integrity (3 min)

1. Verify last RDS snapshot completed successfully (AWS Console)
2. Test restore from latest backup in staging:
```bash
pg_restore --dry-run latest_backup.dump
```
3. Confirm WAL archiving is active:
```sql
SELECT * FROM pg_stat_archiver;
```

### 3. Review Failed Login Attempts (2 min)

```sql
SELECT COUNT(*) FROM user_login_attempts
WHERE success = false AND attempted_at > NOW() - INTERVAL '7 days';
```

- Investigate clusters of failed attempts from same IP
- Rate-limit if > 100 failures per IP per hour

### 4. Certificate Expiry Check (1 min)

```bash
openssl s_client -connect api.dreamhome11.com:443 -servername api.dreamhome11.com </dev/null 2>/dev/null \
  | openssl x509 -noout -dates
```

- Renew if < 30 days remaining
- Check certbot auto-renewal logs: `docker logs dream_home_11_certbot --tail 20`

### 5. Dependency Vulnerability Scan (5 min)

```bash
# Backend
cd backend && npm audit

# Flutter
cd .. && flutter pub outdated
```

- Patch critical vulnerabilities immediately
- Schedule high-severity fixes within sprint

## Monthly Tasks

### 1. Full Security Review (30 min)

- Review IAM roles and permissions in AWS Console
- Audit API keys and secrets rotation
- Verify WAF rules are up to date
- Check VPC flow logs for unusual traffic patterns
- Review CloudTrail for unauthorized API calls
- Run `npx snyk test --all-projects` for supply chain audit

### 2. Capacity Planning Review (15 min)

- Review last 30 days of CPU/memory trends in CloudWatch
- Project growth rate for next 30 days
- Check RDS storage auto-scaling thresholds
- Verify Redis memory headroom (> 20% free)
- Review CDN bandwidth usage and costs

### 3. Log Rotation Verification (5 min)

```bash
# Check Fluentd log sizes
docker exec dream_home_11_fluentd du -sh /var/log/fluentd-buffers

# Verify log shipping to Loki/CloudWatch
docker logs dream_home_11_fluentd --tail 50 | grep -i error
```

### 4. User Data Cleanup (10 min)

```sql
-- Identify soft-deleted accounts older than 90 days
SELECT COUNT(*) FROM users WHERE deleted_at < NOW() - INTERVAL '90 days';

-- Clean up expired OTP records
DELETE FROM otp_codes WHERE expires_at < NOW() - INTERVAL '24 hours';

-- Archive old point logs
-- (Run only after verifying archive procedure)
```

## Incident Response

### Severity Definitions

| Severity | Description | Alert Method | Response Time |
|----------|-------------|--------------|---------------|
| **S1 - Critical** | App down, data loss, payment issues | PagerDuty / Phone call | < 15 min |
| **S2 - High** | High error rate, slow responses, feature broken | Slack / Email | < 30 min |
| **S3 - Medium** | Non-critical bug, minor UI issue | Email / Ticket | < 4 hours |
| **S4 - Low** | Cosmetic issue, enhancement request | Ticket | Next sprint |

### S1 Incident Response Steps

1. **Verify alert** - Confirm the alert is not a false positive by checking multiple sources (Grafana, Sentry, logs)
2. **Check health endpoints**:
   ```bash
   curl -f https://api.dreamhome11.com/health
   curl -f https://api.dreamhome11.com/health/ready
   ```
3. **Check application logs**:
   ```bash
   docker logs dream_home_11_app --tail 100
   ```
4. **Check database connectivity**:
   ```bash
   docker exec dream_home_11_pgbouncer psql -U postgres -d dream_home_11 -c "SELECT 1"
   ```
5. **Scale up if needed**:
   ```bash
   docker-compose -f deploy/docker-compose.prod.yml up -d --scale app=5
   ```
6. **Rollback if needed**: Revert to previous stable deployment
   ```bash
   docker-compose -f deploy/docker-compose.prod.yml down app
   docker-compose -f deploy/docker-compose.prod.yml run --rm app <previous-tag>
   ```

### S2 Incident Response Steps

1. Check error rate in Grafana and Sentry
2. Identify affected endpoints and users
3. Review recent deployments for breaking changes
4. Apply hotfix or feature flag toggle
5. Monitor for 15 minutes after fix

### S3/S4 Incident Response Steps

1. Create a ticket in the issue tracker
2. Assign to appropriate team member
3. Schedule for the next sprint
4. Update status in weekly sync

## Communication Templates

### Incident Notification (Slack)

```
:red_circle: *INCIDENT - {SEVERITY}*
*Service*: {service_name}
*Summary*: {brief_description}
*Started*: {timestamp}
*Affected*: {users_impacted}
*Action*: {current_status}
*Responder*: @{engineer}
*Link*: {dashboard_url}
```

### Status Page Update

```
Title: {service_name} - {incident_type}
Status: Investigating / Identified / Monitoring / Resolved
Description:
{detailed_description}
Affected Components:
- {component_1}
- {component_2}
Started: {timestamp}
Estimated Resolution: {eta}
Updates will be posted every 30 minutes.
```

### Post-Mortem Template

```markdown
## Post-Mortem: {incident_title}

### Summary
- **Date**: {date}
- **Duration**: {duration}
- **Severity**: {severity}
- **Impact**: {users_affected}, {revenue_lost}

### Timeline
| Time (UTC) | Event |
|------------|-------|
| {time} | {event} |
| {time} | {event} |

### Root Cause
{detailed_root_cause_analysis}

### Resolution Steps
1. {step_1}
2. {step_2}

### Action Items
| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| {action} | @{owner} | {date} | Open |

### Lessons Learned
- {lesson_1}
- {lesson_2}
```

## Related Resources

- [Grafana API Dashboard](https://grafana.dreamhome11.com/d/dreamhome11-api)
- [Grafana Business Dashboard](https://grafana.dreamhome11.com/d/dreamhome11-business)
- [Sentry Error Tracking](https://sentry.dreamhome11.com/organizations/dream-home-11/)
- [AWS CloudWatch Dashboard](https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=DreamHome11-production)
- [PagerDuty Schedule](https://dreamhome11.pagerduty.com/schedules)
- [Deployment Runbook](./deployment-runbook.md)
- [Disaster Recovery Plan](./disaster-recovery.md)
