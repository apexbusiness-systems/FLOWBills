# FlowAi Release & Rollback Runbook

## Overview

This runbook provides step-by-step procedures for deploying FlowAi updates and handling rollbacks when issues occur. All deployments follow a controlled process with pre-flight checks, monitoring, and rollback procedures.

## Pre-Flight Checklist

### 1. CI/CD Validation
- [ ] All CI tests passing (typecheck, lint, unit tests)
- [ ] SBOM generated and no Critical vulnerabilities
- [ ] RLS policy tests passing
- [ ] Edge function Deno checks passing
- [ ] Code review approved by 2+ engineers

### 2. Database Migration Planning
- [ ] Database migrations tested in staging environment
- [ ] Migration rollback scripts prepared and tested
- [ ] Data backup completed (if schema changes)
- [ ] Migration execution time estimated
- [ ] Downtime window scheduled (if required)

### 3. Feature Flag Configuration
- [ ] New features behind feature flags
- [ ] Gradual rollout percentages defined
- [ ] Rollback toggles ready for immediate use
- [ ] A/B test configurations validated

### 4. Monitoring Preparation
- [ ] SLO dashboards reviewed and baselines established
- [ ] Alert thresholds validated
- [ ] On-call schedule confirmed
- [ ] Incident response team notified

## Deployment Procedure

### Phase 1: Infrastructure Preparation (T-30min)
1. **Notify stakeholders** of deployment window
2. **Enable maintenance mode** if required
3. **Scale up infrastructure** for deployment load
4. **Verify backup systems** are operational

### Phase 2: Database Migration (T-15min)
1. **Execute migrations** in production
   ```bash
   supabase db push
   ```
2. **Verify migration success** via health checks
3. **Test critical database operations**
4. **Confirm RLS policies** are functioning

### Phase 3: Application Deployment (T-0min)
1. **Deploy edge functions**
   ```bash
   supabase functions deploy
   ```
2. **Deploy frontend application** via Lovable
3. **Verify health endpoints** return 200 OK
4. **Run smoke tests** on critical paths

### Phase 4: Gradual Rollout (T+5min)
1. **Enable 10%** of traffic to new version
2. **Monitor SLO metrics** for 15 minutes
3. **Increase to 50%** if metrics stable
4. **Monitor for additional 15 minutes**
5. **Complete rollout to 100%**

### Phase 5: Post-Deployment Validation (T+30min)
1. **Execute end-to-end tests**
   - Invoice upload → OCR → validation → approval
   - User authentication and authorization
   - Critical business workflows
2. **Verify SLO compliance**
3. **Check error rates and latency**
4. **Validate security monitoring**

## Monitoring & Alerting

### Key Metrics to Watch
- **API Availability**: >99.9% success rate
- **Response Latency**: P95 <10s for invoice processing
- **Error Rate**: <1% across all endpoints
- **Database Performance**: P95 <500ms query time
- **Queue Depth**: HIL queue size trending

### Critical Alert Thresholds
- Error rate >5% for 5 minutes → **Immediate rollback**
- Latency P95 >20s for 10 minutes → **Investigate/rollback**
- Database connections >80% → **Scale database**
- Security events spike → **Security team escalation**

## Rollback Procedures

### Immediate Rollback (Emergency)
When **critical issues** are detected:

1. **Stop deployment** immediately
2. **Revert to previous application version**
   ```bash
   # Rollback frontend
   git revert <commit-hash>
   # Redeploy via Lovable
   ```
3. **Rollback edge functions**
   ```bash
   supabase functions deploy --no-verify-jwt <previous-version>
   ```
4. **Disable feature flags** for new features
5. **Verify system stability**

### Database Rollback
For **database migration issues**:

1. **Execute rollback migration**
   ```sql
   -- Pre-prepared rollback scripts
   \i rollback_migration_YYYYMMDD.sql
   ```
2. **Verify data integrity**
3. **Restart application services**
4. **Validate RLS policies**

### Gradual Rollback
For **performance degradation**:

1. **Reduce traffic** to new version (100% → 50% → 10%)
2. **Monitor metrics** at each reduction
3. **Complete rollback** if issues persist
4. **Investigate root cause** in development environment

## Post-Incident Review

### Within 24 Hours
1. **Document timeline** of events
2. **Identify root cause** and contributing factors
3. **List lessons learned** and process improvements
4. **Update runbook** with new procedures
5. **Schedule team retrospective**

### Within 1 Week
1. **Implement fixes** for identified issues
2. **Update monitoring** and alerting rules
3. **Enhance testing** to catch similar issues
4. **Review SLO targets** and error budgets
5. **Share learnings** with broader engineering team

## Communication Plan

### Internal Notifications
- **Slack channels**: #engineering, #ops, #incidents
- **Email lists**: engineering-team@flowai.ca
- **PagerDuty**: On-call escalation chain

### External Communications
- **Status page**: status.flowbills.ca updates
- **Customer notifications**: For user-facing issues
- **Partner notifications**: For integration impacts

## Tools & Resources

### Deployment Tools
- **Lovable**: Frontend deployment platform
- **Supabase CLI**: Database and function deployment
- **GitHub Actions**: CI/CD pipeline execution

### Monitoring Tools
- **Grafana**: SLO dashboards and metrics visualization
- **Prometheus**: Metrics collection and alerting
- **Supabase Logs**: Edge function and database monitoring

### Emergency Contacts
- **On-call Engineer**: Via PagerDuty rotation
- **Engineering Manager**: [Contact info]
- **CTO**: [Contact info]
- **Infrastructure Provider**: Supabase support

## Checklist Templates

### Pre-Deployment Checklist
```
[ ] CI tests passing
[ ] SBOM clean
[ ] Migrations tested
[ ] Feature flags configured
[ ] Monitoring ready
[ ] Team notified
```

### Post-Deployment Checklist
```
[ ] Health checks passing
[ ] SLO metrics stable
[ ] Error rates normal
[ ] Security monitoring active
[ ] Rollback procedures tested
[ ] Documentation updated
```

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-09-27 | Initial runbook creation |

## Related Documentation

- [SLO Documentation](../SLO.md)
- [Security Implementation](../SECURITY_IMPLEMENTATION.md)
- [RLS Policies](../security/RLS.md)
- [CI/CD Pipeline](.github/workflows/ci-enhanced.yml)

---

**Remember**: When in doubt, rollback first and investigate later. System stability is the top priority.