# Dream Home 11 — Release Process

> **Version:** 1.0
> **Last Updated:** $(date +%Y-%m-%d)

---

## Version Numbering Scheme

Dream Home 11 follows **Semantic Versioning (SemVer 2.0.0)**:

```
MAJOR.MINOR.PATCH
```

| Component | Increment When | Example |
|-----------|---------------|---------|
| **MAJOR** | Breaking API changes, incompatible database migrations, major UI overhaul | `1.0.0` → `2.0.0` |
| **MINOR** | New features, new API endpoints, non-breaking additions | `1.0.0` → `1.1.0` |
| **PATCH** | Bug fixes, security patches, performance improvements | `1.0.0` → `1.0.1` |

**Build metadata**: Appended after `+` for internal tracking (e.g., `1.0.0+42`).

### Where versions are defined

| File | Field |
|------|-------|
| `pubspec.yaml` | `version: 1.0.0+1` |
| `backend/package.json` | `"version": "1.0.0"` |
| Git tags | `v1.0.0` |

---

## Release Branches Strategy

```
main ────────●────────────●─────────────●──────────────
              \          / \           /
               \── v1   /   \── v1.1  /
                      v1.0.0     v1.1.0
```

### Branch Naming

| Branch Pattern | Purpose |
|----------------|---------|
| `main` | Stable production code. Always deployable. |
| `develop` | Integration branch for ongoing work. |
| `release/vX.Y.Z` | Release candidate branch. Cut from `develop`, merged to `main` and back. |
| `hotfix/vX.Y.Z` | Urgent production fixes. Cut from `main`, merged to `main` and `develop`. |
| `feature/*` | Feature branches cut from `develop`. |

### Release Workflow

1. **Feature Freeze**: All feature PRs merged to `develop`
2. **Release Branch**: `git checkout -b release/v1.0.0 develop`
3. **Version Bump**: Update versions in `pubspec.yaml` and `backend/package.json`
4. **Final Testing**: Run full test suite, QA verification, regression tests
5. **Build Artifacts**: Run `./scripts/release.sh` to build and tag
6. **Merge to main**: `git checkout main && git merge release/v1.0.0`
7. **Tag**: `git tag v1.0.0`
8. **Deploy**: Deploy backend, submit app to stores
9. **Merge back**: `git checkout develop && git merge release/v1.0.0`
10. **Cleanup**: Delete release branch

---

## Hotfix Process

For urgent production issues that cannot wait for the next release.

### Flow

```
main ─────●───────────●─────────
           \         /
hotfix/v1.0.1 ──────●
```

### Steps

1. **Branch**: `git checkout -b hotfix/v1.0.1 main`
2. **Fix**: Apply the fix, bump PATCH version
3. **Test**: Run full test suite + targeted tests for the fix
4. **Build**: Build release artifacts
5. **Merge to main**: `git checkout main && git merge hotfix/v1.0.1`
6. **Tag**: `git tag v1.0.1`
7. **Deploy**: Deploy the hotfix to production
8. **Merge to develop**: `git checkout develop && git merge hotfix/v1.0.1`
9. **Cleanup**: Delete hotfix branch

### Hotfix Criteria

- Critical security vulnerability
- Payment processing bug
- User cannot login or complete core flow
- Data loss or corruption
- App crashes on startup

---

## Release Approval Checklist

### Pre-Release (α — Development Complete)

- [ ] All feature branches merged to `develop`
- [ ] No P1 or P2 bugs open
- [ ] All unit tests passing (Flutter + Backend)
- [ ] Integration/E2E tests passing
- [ ] API documentation updated (OpenAPI/Swagger)
- [ ] Changelog entries written

### Release Candidate (β — QA Verification)

- [ ] Release branch cut from `develop`
- [ ] Version bumped in all files
- [ ] Regression test suite executed
- [ ] Smoke tests on real devices (iOS + Android)
- [ ] Performance benchmarks within thresholds
- [ ] Security scan completed (SAST/DAST if applicable)
- [ ] Sentry source maps uploaded for the build
- [ ] Localization strings verified

### Pre-Production (γ — Launch Ready)

- [ ] Staging deployment green-lit
- [ ] Database migrations tested and reversible
- [ ] Payment gateway tested (sandbox + test transaction)
- [ ] Push notifications delivered (iOS + Android)
- [ ] Deep links verified (Universal links + App Links)
- [ ] CDN cache purged and assets verified
- [ ] Monitoring dashboards confirmed operational
- [ ] Alert rules configured and tested
- [ ] Rollback procedure confirmed
- [ ] Store listing submitted and approved

### Launch (🚀)

- [ ] Production deployment completed
- [ ] Health checks passing on production
- [ ] Staged rollout initiated (1%)
- [ ] On-call engineer briefed
- [ ] Launch communication sent (internal team)

---

## Post-Release Monitoring

### First Hour (Critical)

| Metric | Alert Threshold |
|--------|----------------|
| Error rate (5xx) | > 1% of requests |
| P95 latency | > 2 seconds |
| Crash-free rate | < 99.5% |
| User registration rate | Monitor for anomalies |

### First 24 Hours

- Review Sentry for new error groups
- Monitor database connection pool usage
- Check payment success rates
- Track contest join rates
- Verify leaderboard accuracy

### First Week

- Review support ticket volume and categories
- Monitor user retention (D1, D7)
- Analyze app store ratings and reviews
- Review infrastructure costs
- Plan v1.0.1 patch based on feedback

---

## Artifact Checklist

| Artifact | Location | Verified |
|----------|----------|----------|
| Android APK | `build/app/outputs/flutter-apk/app-release.apk` | ☐ |
| Android AAB | `build/app/outputs/bundle/release/app-release.aab` | ☐ |
| iOS Archive | Xcode Organizer / Transporter | ☐ |
| Debug Symbols | `build/debug-info/android/` | ☐ |
| Backend Docker Image | `dreamhome11/backend:<version>` | ☐ |
| Sentry Source Maps | Uploaded to Sentry via `sentry-cli` | ☐ |
| Git Tag | `v<version>` | ☐ |
| Changelog Entry | `CHANGELOG.md` | ☐ |

---

## Rollback Decision Matrix

| Condition | Action |
|-----------|--------|
| Error rate > 5% for 5 minutes | Immediate rollback |
| Payment failures > 2% for 15 minutes | Immediate rollback |
| Crash-free rate < 99% | Immediate rollback |
| p99 latency > 5s for 10 minutes | Investigate, consider rollback |
| Database connection pool > 85% for 10 minutes | Scale up, investigate |
| Minor bug, no revenue impact | Patch in next release |

See `deploy/docs/deployment-runbook.md` for detailed rollback commands.

---

*This document is maintained by the development team and should be updated when processes change.*
