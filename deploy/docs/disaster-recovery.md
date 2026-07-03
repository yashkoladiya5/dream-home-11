# Disaster Recovery Runbook

## Overview

| Metric | Target |
|--------|--------|
| Recovery Point Objective (RPO) | 1 hour |
| Recovery Time Objective (RTO) | 15 minutes |
| Backup Frequency | Every 6 hours (automated) |
| Retention Period | 30 days (local), 365 days (S3 Glacier) |

---

## Backup Strategy

### PostgreSQL

| Component | Detail |
|-----------|--------|
| Tool | `pg_dump` via `scripts/backup.sh` |
| Frequency | Every 6 hours (cron: `0 */6 * * *`) |
| Retention | 30 days local, 365 days in S3 Glacier |
| WAL Archiving | Continuous archiving to S3 via `archive_command` |
| Verification | Automated restore test every 24 hours in staging |
| Script | `./scripts/backup.sh --s3-bucket dreamhome11-backups` |

### Redis

| Component | Detail |
|-----------|--------|
| Persistence | AOF (Append-Only File) enabled |
| Snapshot | `save 300 100` (every 5 min if 100+ keys changed) |
| Retention | 7 days (local AOF history) |
| Recovery | Reload from AOF on restart (automatic) |

### Uploads

| Component | Detail |
|-----------|--------|
| Tool | `aws s3 sync` |
| Frequency | Every hour |
| Versioning | Enabled on the S3 bucket |
| Retention | Object version history (30 days for non-current) |

---

## Recovery Procedures

### Database Corruption

1. Stop the application to prevent further writes
2. Identify the latest uncorrupted backup from S3
3. Restore via `./scripts/restore.sh backup-file.sql.gz`
4. Verify row counts and key aggregates
5. Run application smoke tests
6. Resume traffic

### Complete Region Failure

1. Switch DNS to the secondary region (Route53 failover)
2. Restore the latest S3 backup to the standby RDS instance
3. Restore Redis from the latest snapshot
4. Re-sync uploads from S3 cross-region copy
5. Verify all health endpoints
6. Scale up the standby cluster and route traffic

### Accidental Data Deletion

1. Identify the time of deletion
2. Locate a backup taken before that point
3. Restore to a separate database instance
4. Export only the affected rows
5. Import into production with conflict resolution
6. Audit access logs for the deletion source

### Application Crash

1. Docker Compose auto-restarts `app` containers (policy: `restart: always`)
2. Health checks (`/health/ready`) trigger container replacement
3. If crashes persist, rollback to the previous Docker image
4. Check logs: `docker-compose -f deploy/docker-compose.prod.yml logs --tail=100 app`
5. If the issue is deployment-related, re-run the previous version:
   ```bash
   git revert HEAD
   ./deploy/deploy.sh
   ```

---

## Runbook Steps

### Step 1: Assess Damage

- Check health endpoints: `/health`, `/health/ready`, `/health/live`, `/health/detailed`
- Review monitoring dashboards (Datadog / Grafana)
- Check application logs for error spikes
- Determine scope: database, cache, application, or infrastructure

### Step 2: Stop Incoming Traffic

- Enable maintenance mode (if supported by the app config)
- Or redirect traffic to a static maintenance page via nginx
- Block write operations if database recovery is needed

### Step 3: Restore Database from Backup

```bash
cd backend
./scripts/restore.sh /path/to/backup-dream_home_11-20250101-120000.sql.gz
```

### Step 4: Verify Data Integrity

- Check row counts for critical tables (users, contests, transactions)
- Run application smoke tests
- Verify API responses match expected data

### Step 5: Restore Redis from Snapshot

- Redis will reload from AOF automatically upon restart
- For manual restore from a dump file, copy it to the Redis data directory
- Verify: `redis-cli PING` and `redis-cli DBSIZE`

### Step 6: Restore Uploads from S3

```bash
aws s3 sync s3://dreamhome11-backups/uploads/ /app/uploads/
```

### Step 7: Restart Services and Verify Health

```bash
cd deploy
docker-compose -f docker-compose.prod.yml restart
# Wait for all containers to become healthy
docker-compose -f docker-compose.prod.yml ps

# Verify health endpoints
curl -s http://localhost:3000/health | jq .
curl -s http://localhost:3000/health/ready | jq .
```

### Step 8: Resume Traffic and Monitor

- Disable maintenance mode
- Monitor error rates, latency, and throughput for 30 minutes
- Notify the team that recovery is complete

---

## Contact List

| Role | Name | Phone | Email |
|------|------|-------|-------|
| On-Call Engineer | TBD | TBD | TBD |
| Database Admin | TBD | TBD | TBD |
| DevOps Lead | TBD | TBD | TBD |
| Engineering Manager | TBD | TBD | TBD |
| Product Owner | TBD | TBD | TBD |

> **Note**: Update this contact list during onboarding and whenever team roles change.

---

## Post-Mortem Template

After every incident, create a post-mortem document following this template:

```markdown
# Post-Mortem: [Incident Title]

**Date**: YYYY-MM-DD
**Duration**: [start] - [end]
**Impact**: [users affected, revenue impact]

## Summary
[Brief description of what happened]

## Root Cause
[What caused the incident]

## Timeline
- HH:MM - Issue detected
- HH:MM - Investigation started
- HH:MM - Root cause identified
- HH:MM - Mitigation applied
- HH:MM - Service restored

## Actions Taken
- [Action 1]
- [Action 2]

## Prevention
- [ ] Add monitoring alert for [metric]
- [ ] Update runbook for [scenario]
- [ ] Schedule [improvement] as a P1 task

## Lessons Learned
- [Lesson 1]
- [Lesson 2]
```

Link: [Post-Mortem Template](./post-mortem-template.md)
