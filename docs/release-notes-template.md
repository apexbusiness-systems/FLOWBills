# Release Notes Template (P16 — Canary Release)

## Release Information

- **Version**: [e.g., v1.2.3]
- **Release Date**: [YYYY-MM-DD]
- **Release SHA**: [git commit SHA]
- **Release Manager**: [Name]
- **Environment**: [Production/Staging/Canary]

---

## Overview

Brief description of what's included in this release.

---

## Features & Enhancements

### New Features
- [Feature 1]: Description
- [Feature 2]: Description

### Enhancements
- [Enhancement 1]: Description
- [Enhancement 2]: Description

---

## Bug Fixes

- [BUG-123]: Description of bug fix
- [BUG-456]: Description of bug fix

---

## Database Changes

### Migrations
```sql
-- List any database migrations included in this release
-- Migration file: 20250101_example.sql
```

**Migration Impact**:
- Estimated duration: [X minutes]
- Downtime required: [Yes/No]
- Rollback safe: [Yes/No]

### Schema Changes
- Table: `table_name`
  - Added columns: `column1`, `column2`
  - Removed columns: None
  - Index changes: Added index on `column1`

---

## Breaking Changes

⚠️ **ATTENTION**: This release contains breaking changes

1. **API Endpoint Changes**:
   - Endpoint `/old-path` deprecated, use `/new-path`
   - Parameter `oldParam` renamed to `newParam`

2. **Configuration Changes**:
   - Environment variable `OLD_VAR` replaced by `NEW_VAR`

---

## Deployment Plan

### Pre-Deployment Checklist
- [ ] Database backup completed
- [ ] Rollback plan reviewed
- [ ] Health check endpoints verified
- [ ] Monitoring dashboards prepared
- [ ] On-call team notified

### Deployment Steps
1. **Pre-deployment** (T-30 min):
   - Verify all health checks pass
   - Create database backup
   - Tag release in Git

2. **Canary deployment** (T+0):
   - Deploy to 10% of traffic
   - Monitor for 10 minutes
   - Check SLO metrics: p95 latency, error rate

3. **Full deployment** (T+15 min):
   - If canary metrics acceptable, deploy to 100%
   - Continue monitoring for 30 minutes

4. **Post-deployment** (T+45 min):
   - Verify all critical paths
   - Run smoke tests
   - Update status page

### Rollback Plan

**Rollback Trigger Conditions**:
- p95 latency > 800ms for 10 minutes
- Error ratio > 0.5% for 10 minutes
- Critical health check failures
- Critical bug discovered

**Rollback Steps**:
```bash
# 1. Execute rollback script
./scripts/rollback.sh [previous-release-sha]

# 2. If migrations were applied, revert them
supabase db push --revert

# 3. Verify rollback success
curl https://yvyjzlbosmtesldczhnm.supabase.co/functions/v1/health-check
curl https://yvyjzlbosmtesldczhnm.supabase.co/functions/v1/metrics

# 4. Monitor for 15 minutes after rollback
```

**Estimated Rollback Time**: < 15 minutes

---

## Testing

### Test Coverage
- Unit tests: [Pass rate]
- Integration tests: [Pass rate]
- E2E tests: [Pass rate]
- Performance tests: [Results]

### Manual Testing Completed
- [ ] Invoice upload flow
- [ ] OCR extraction
- [ ] Approval workflow
- [ ] E-invoicing send/receive
- [ ] User authentication
- [ ] Dashboard analytics

---

## Performance Impact

### Benchmarks
- Page load time: [Before] → [After]
- API response time (p95): [Before] → [After]
- Bundle size: [Before] → [After]
- Database query performance: [Before] → [After]

### Expected Impact
- CPU usage: [Increase/Decrease/Neutral]
- Memory usage: [Increase/Decrease/Neutral]
- Network bandwidth: [Increase/Decrease/Neutral]

---

## Monitoring

### Key Metrics to Watch
1. **Availability**: Target ≥ 99.5%
2. **Latency (p95)**: Target ≤ 800ms
3. **Error Rate**: Target ≤ 0.5%
4. **STP Rate**: Target ≥ 85%

### Dashboards
- [Grafana Dashboard: Production Overview](link)
- [Grafana Dashboard: Application Metrics](link)
- [Supabase Analytics](https://supabase.com/dashboard/project/yvyjzlbosmtesldczhnm/logs/edge-functions)

### Alerts
- Burn rate alerts configured for multi-window detection
- PagerDuty escalation policy active

---

## Dependencies

### Updated Dependencies
- `package-name`: v1.0.0 → v1.1.0 (security patch)
- `another-package`: v2.0.0 → v3.0.0 (breaking changes)

### Security Vulnerabilities Fixed
- [CVE-2024-XXXX]: Description
- [CVE-2024-YYYY]: Description

---

## Documentation

### Updated Documentation
- [API Documentation](link)
- [User Guide](link)
- [Developer Guide](link)

### New Documentation
- [Feature Guide: New Feature](link)

---

## Communication

### Internal Notifications
- [ ] Engineering team notified via Slack (#engineering)
- [ ] Support team briefed (#support)
- [ ] Stakeholders updated via email

### External Communication
- [ ] Status page updated (if customer-facing changes)
- [ ] Customer notification sent (if breaking changes)
- [ ] Release notes published on website

---

## Post-Release Actions

### Week 1 Monitoring
- [ ] Daily metrics review at 09:00 America/Edmonton
- [ ] Customer feedback monitoring
- [ ] Support ticket trending analysis

### Follow-up Tasks
- [ ] Document lessons learned
- [ ] Update runbooks if needed
- [ ] Schedule retrospective (if major release)

---

## Sign-off

- **QA Approval**: [Name] - [Date]
- **Engineering Lead**: [Name] - [Date]
- **Product Owner**: [Name] - [Date]
- **Release Manager**: [Name] - [Date]

---

## Notes

[Any additional notes, known issues, or important information]

---

**Release Artifacts**:
- Git tag: `v1.2.3`
- Docker image: `flowbills:v1.2.3`
- Backup snapshot: `backup-20250114-120000.sql.gz`
- SBOM: `sbom-v1.2.3.json`
