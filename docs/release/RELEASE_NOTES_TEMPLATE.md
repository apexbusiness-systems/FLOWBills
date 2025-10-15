# Release Notes — v[VERSION]

**Release Date**: [YYYY-MM-DD]  
**Release SHA**: [git-sha]  
**Environment**: [production/staging]  
**Deployed By**: [engineer-name]

---

## Summary

Brief 1-2 sentence summary of the release.

---

## Changes

### Features
- [ ] Feature 1 description
- [ ] Feature 2 description

### Bug Fixes
- [ ] Fix 1 description
- [ ] Fix 2 description

### Database Migrations
- [ ] Migration 1: `20250115_add_support_tables.sql`
  - **Risk**: Low/Medium/High
  - **Reversible**: Yes/No
  - **Rollback Command**: `psql -f migrations/down/20250115_rollback.sql`

### Dependencies Updated
- [ ] Package 1: `v1.0.0` → `v1.1.0`
- [ ] Package 2: `v2.0.0` → `v2.1.0`

---

## Pre-Deployment Checklist

- [ ] All quality gates passed (CI/CD)
- [ ] SBOM generated and reviewed
- [ ] Database backup completed
- [ ] Rollback plan documented below
- [ ] Canary deployment configured (10% traffic)
- [ ] Monitoring alerts configured
- [ ] On-call engineer assigned

---

## Deployment Steps

1. **Pre-deployment checks**:
   ```bash
   curl -f https://api.flowbills.ca/healthz
   curl -f https://api.flowbills.ca/readyz
   ```

2. **Apply database migrations** (if any):
   ```bash
   psql $DATABASE_URL -f supabase/migrations/20250115_*.sql
   ```

3. **Deploy application**:
   ```bash
   git checkout [git-sha]
   npm run build
   npm run deploy
   ```

4. **Enable canary** (10% traffic for 15 minutes):
   ```bash
   # Monitor p95 latency and error rate
   # Auto-rollback if p95 > 800ms or error_ratio > 0.5%
   ```

5. **Verify deployment**:
   ```bash
   curl -f https://api.flowbills.ca/healthz
   curl -f https://api.flowbills.ca/metrics | grep 'http_request_duration_seconds'
   ```

---

## Rollback Plan

### Conditions for Rollback
- p95 latency > 800ms for 10 consecutive minutes
- Error rate > 0.5% for 10 consecutive minutes
- Critical bug discovered in production
- Database migration failure

### Rollback Steps

1. **Immediate rollback** (automated via canary):
   ```bash
   ./scripts/rollback.sh [previous-git-sha]
   ```

2. **Database rollback** (if migrations applied):
   ```bash
   psql $DATABASE_URL -f supabase/migrations/down/20250115_*.sql
   ```

3. **Verify rollback**:
   ```bash
   curl -f https://api.flowbills.ca/healthz
   curl -f https://api.flowbills.ca/readyz
   ```

4. **Notify stakeholders**:
   - Post in #engineering Slack
   - Update status page
   - Create incident postmortem

### Expected Rollback Duration
- **Target**: < 5 minutes
- **Maximum**: < 15 minutes

---

## Monitoring & Alerts

### Key Metrics to Watch (First 24h)
- **Availability**: Target ≥ 99.9%
- **p95 Latency**: Target < 500ms
- **Error Rate**: Target < 0.1%
- **STP Rate**: Target ≥ 95%
- **Invoice Volume**: Expected [X] invoices/day

### Alert Configuration
- Burn rate alert: 14x (5m window), 6x (30m), 3x (1h), 1x (6h)
- On-call: [engineer-name] via PagerDuty
- Escalation: [manager-name] after 30 minutes

---

## Post-Deployment Verification

- [ ] Smoke tests passed
- [ ] /healthz, /readyz, /metrics responding
- [ ] No spike in error rate
- [ ] p95 latency within budget
- [ ] Database queries performing as expected
- [ ] Canary promoted to 100% traffic

---

## Known Issues

- None

---

## Links

- **PR**: [Link to pull request]
- **JIRA**: [Link to ticket]
- **Grafana Dashboard**: [Link to monitoring]
- **Incident Channel**: #incident-[date]

---

**Sign-off**:
- [ ] Engineering Lead: [Name]
- [ ] Product Manager: [Name]
- [ ] On-call Engineer: [Name]
