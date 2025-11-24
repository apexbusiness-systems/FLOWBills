# Production Deployment - Action Items Checklist
## FLOWBills.ca - January 14, 2025

---

## 🚨 CRITICAL - Must Complete Before Launch (5 minutes)

### 1. Enable Leaked Password Protection
**Priority: P0 (BLOCKER)**  
**Time Required: 5 minutes**  
**Risk if Skipped: Users can use compromised passwords**

**Steps:**
1. Navigate to: https://supabase.com/dashboard/project/ullqluvzkgnwwqijhvjr/auth/policies
2. Click "Password Security"
3. Enable "Leaked Password Protection" toggle
4. Set minimum password length: **12 characters**
5. Enable "Require Strong Password" toggle
6. Click "Save"

**Verification Test:**
```bash
# Try to create account with leaked password
# Should receive error: "Password found in breach database"
curl -X POST https://yvyjzlbosmtesldczhnm.supabase.co/auth/v1/signup \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Documentation:** https://supabase.com/docs/guides/auth/password-security

---

## ✅ PRE-DEPLOYMENT VERIFICATION (10 minutes)

### 2. Verify Environment Configuration
**Priority: P0**  
**Time Required: 5 minutes**

```bash
# Run CI/CD pipeline
npm run ci

# Expected output:
# ✓ ESLint checks pass (0 warnings)
# ✓ TypeScript type-check pass
# ✓ All unit tests pass
# ✓ Build completes successfully
```

**Verification Links:**
- [ ] Supabase secrets configured: https://supabase.com/dashboard/project/ullqluvzkgnwwqijhvjr/settings/functions
  - [ ] OPENAI_API_KEY ✓ (already set)
  - [ ] SUPABASE_SERVICE_ROLE_KEY ✓ (already set)
  - [ ] LOVABLE_API_KEY ✓ (already set)

### 3. Test Health Check Endpoint
**Priority: P0**  
**Time Required: 2 minutes**

```bash
# Test health endpoint in production
curl https://yvyjzlbosmtesldczhnm.supabase.co/functions/v1/health-check

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-01-14T...",
  "checks": {
    "database": "healthy",
    "supabase": "connected"
  }
}
```

**Dashboard:** https://supabase.com/dashboard/project/ullqluvzkgnwwqijhvjr/functions/health-check/logs

### 4. Verify Database Connectivity
**Priority: P0**  
**Time Required: 3 minutes**

```sql
-- Run in Supabase SQL Editor
-- https://supabase.com/dashboard/project/ullqluvzkgnwwqijhvjr/sql/new

-- Check RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false;

-- Expected: 0 rows (all tables have RLS enabled)

-- Check active connections
SELECT count(*) as connection_count 
FROM pg_stat_activity 
WHERE datname = current_database();

-- Expected: < 20 (within connection limit)
```

---

## 📊 POST-DEPLOYMENT MONITORING (First 48 Hours)

### 5. Set Up Monitoring Dashboard
**Priority: P1**  
**Time Required: 15 minutes**

**Key Metrics to Monitor:**

#### Performance Metrics
```
Dashboard: https://supabase.com/dashboard/project/ullqluvzkgnwwqijhvjr/logs/postgres-logs
```

Monitor for:
- [ ] API P95 latency < 500ms
- [ ] Error rate < 0.1%
- [ ] Database query time < 100ms average
- [ ] Connection pool utilization < 80%

#### Security Metrics
```
Dashboard: https://supabase.com/dashboard/project/ullqluvzkgnwwqijhvjr/logs/edge-logs
```

Monitor for:
- [ ] CSP violations (check /csp-monitoring page)
- [ ] Rate limit triggers (check rate_limits table)
- [ ] Failed authentication attempts
- [ ] Unusual traffic patterns

#### User Experience Metrics
- [ ] Page load time (First Contentful Paint < 1.2s)
- [ ] Time to Interactive < 2.5s
- [ ] Cumulative Layout Shift < 0.1
- [ ] Error boundaries triggered (should be 0)

### 6. Verify Critical User Flows
**Priority: P1**  
**Time Required: 20 minutes**

**Test these workflows in production:**

```
✅ Authentication Flow:
1. Sign up new user → Should create profile + assign viewer role
2. Log in → Should redirect to dashboard
3. Password reset → Should send email and allow reset

✅ Invoice Processing:
1. Upload invoice PDF → Should extract data with OCR
2. Review extraction → Should show confidence scores
3. Approve invoice → Should update status to "approved"

✅ AFE Management:
1. Create AFE → Should validate budget amount > 0
2. Add field ticket → Should link to AFE
3. Check budget alert → Should trigger when >80% spent

✅ Security:
1. Try accessing /dashboard without auth → Should redirect to /auth
2. Try accessing admin pages as viewer → Should show 403
3. Try SQL injection in forms → Should sanitize input
```

---

## 🔍 OPTIONAL ENHANCEMENTS (Next Sprint)

### 7. Add Monitoring Alerts
**Priority: P2**  
**Time Required: 30 minutes**

Set up alerts for:
- API latency exceeds 1000ms for 5 minutes
- Error rate exceeds 1% for 10 minutes
- Database connections exceed 18 (90% of limit)
- Rate limit violations exceed 100/hour
- CSP violations exceed 50/hour

**Tools:**
- Supabase built-in monitoring
- Or integrate with: Sentry, DataDog, New Relic

### 8. Run Security Scan
**Priority: P2**  
**Time Required: 10 minutes**

```bash
# Install and run dependency audit
npm audit --production

# Check for known vulnerabilities
# Fix high/critical issues immediately

# Run Snyk scan (optional)
npx snyk test

# Expected: 0 high/critical vulnerabilities
```

### 9. Performance Testing
**Priority: P2**  
**Time Required: 20 minutes**

```bash
# Run Lighthouse audit
npx lighthouse https://flowbills.ca --view

# Target scores:
# Performance: > 90
# Accessibility: > 95
# Best Practices: > 95
# SEO: > 90
```

---

## 📋 ROLLBACK PLAN

### If Issues Occur in Production

**Immediate Response (5 minutes):**
1. Check Supabase edge function logs: https://supabase.com/dashboard/project/ullqluvzkgnwwqijhvjr/logs/edge-logs
2. Check database logs: https://supabase.com/dashboard/project/ullqluvzkgnwwqijhvjr/logs/postgres-logs
3. Check error tracking in browser console (localStorage: 'global_errors')

**Rollback Procedure (if needed):**
```bash
# 1. Revert to previous deployment
git revert <commit-hash>
git push origin main

# 2. Verify health check
curl https://yvyjzlbosmtesldczhnm.supabase.co/functions/v1/health-check

# 3. Check database state (no rollback needed for schema)
# Supabase migrations are forward-only, schema is stable
```

**Emergency Contacts:**
- Technical Support: support@flowbills.ca
- Security Issues: security@flowbills.ca
- Critical Incidents: Page on-call engineer via PagerDuty

---

## 📝 COMPLETION CHECKLIST

### Before Launch (MUST COMPLETE)
- [ ] Leaked password protection enabled
- [ ] CI/CD pipeline passes (`npm run ci`)
- [ ] Health check endpoint verified
- [ ] Database connectivity tested
- [ ] All secrets verified in Supabase dashboard

### Within First Hour
- [ ] User signup flow tested
- [ ] Authentication flow verified
- [ ] Invoice upload tested
- [ ] No errors in edge function logs
- [ ] Performance metrics within targets

### Within First 24 Hours
- [ ] Monitor all KPIs (latency, errors, security)
- [ ] Review CSP violation logs
- [ ] Check rate limiting effectiveness
- [ ] Verify user activity is being logged
- [ ] Confirm backups are running

### Within First Week
- [ ] Conduct user feedback survey
- [ ] Review and optimize slow queries
- [ ] Analyze user behavior patterns
- [ ] Fine-tune monitoring alerts
- [ ] Update documentation based on production learnings

---

## 🎯 SUCCESS CRITERIA

**Launch is Successful If:**
1. ✅ Zero critical security vulnerabilities
2. ✅ API P95 latency < 500ms
3. ✅ Error rate < 0.1%
4. ✅ All RLS policies enforced
5. ✅ User authentication works flawlessly
6. ✅ No data breaches or unauthorized access
7. ✅ Performance metrics meet targets
8. ✅ User satisfaction score > 4/5

**If Any of These Fail:**
- Execute rollback plan immediately
- Investigate root cause
- Fix issues in staging environment
- Re-deploy after thorough testing

---

## 📞 SUPPORT & ESCALATION

### Issue Severity Levels

**P0 - Critical (Immediate Response Required):**
- Production down or inaccessible
- Data breach or security incident
- Mass user impact (>50% affected)
- Financial transaction errors

**P1 - High (1 Hour Response):**
- Feature completely broken
- Performance severely degraded
- Security vulnerability discovered
- Individual user data at risk

**P2 - Medium (4 Hour Response):**
- Feature partially working
- Minor performance issues
- UI/UX problems
- Non-critical bugs

**P3 - Low (Next Business Day):**
- Cosmetic issues
- Feature enhancement requests
- Documentation updates
- Minor improvements

---

**Document Version:** 1.0.0  
**Created:** January 14, 2025  
**Last Updated:** January 14, 2025  
**Review Frequency:** After each deployment
