# 🚀 Pre-Production Security Checklist

**Project:** FlowBills.ca E-Invoicing Platform  
**Date:** 2025-10-06  
**Status:** ⚠️ Pending Production Approval

---

## ⚠️ CRITICAL BLOCKERS (Must Complete Before Launch)

### 1. Enable Leaked Password Protection ⚠️ REQUIRED

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

**Guide:** `docs/security/LEAKED_PASSWORD_PROTECTION_SETUP.md`

**Quick Steps:**
1. Go to: https://supabase.com/dashboard/project/yvyjzlbosmtesldczhnm/auth/providers
2. Find "Email" provider → "Password requirements"
3. Enable "Leaked password protection" toggle
4. Set minimum length to 12 characters
5. Set minimum strength to "Strong"
6. Click Save

**Verification:**
```bash
# Test with weak password (should fail)
curl -X POST 'https://yvyjzlbosmtesldczhnm.supabase.co/auth/v1/signup' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Expected: {"error": "Password has been found in a data breach"}
```

**Time Required:** 5 minutes  
**Risk if Skipped:** HIGH - Users can set compromised passwords

---

### 2. Verify RLS Policies ✅ Complete

**Status:** ✅ All PII tables have RLS enabled

**Verified Tables:**
- ✅ `consent_logs` - Admin-only PII access
- ✅ `user_sessions` - Token protected via safe view
- ✅ `vendors` - Admin/operator only
- ✅ `leads` - Admin/operator only
- ✅ `user_roles` - User can view own, admin can manage
- ✅ `audit_logs` - Admin view, system insert
- ✅ `security_events` - Admin view, system insert

**Command:**
```bash
npm run db:lint
```

**Expected Result:** 0 critical issues (may have 1 WARN about leaked password protection until Step 1 complete)

---

### 3. Test Role-Based Access Control ⬜ TODO

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

**Test Scenarios:**

#### A. Create Test Users
```sql
-- Run in Supabase SQL Editor
-- Create test users with different roles
INSERT INTO user_roles (user_id, role) VALUES
  ('00000000-0000-0000-0000-000000000001'::uuid, 'admin'),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'approver'),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'viewer');
```

#### B. Test Approvals Page Access
1. Login as **viewer** role
   - ✅ Can view approvals list
   - ✅ "Approve" button is disabled
   - ✅ See warning: "You have view-only access"

2. Login as **approver** role
   - ✅ Can view approvals list
   - ✅ "Approve" button is enabled
   - ✅ Can approve invoices

3. Login as **admin** role
   - ✅ Can view approvals list
   - ✅ Can approve invoices
   - ✅ Can access all admin features

#### C. Test E-Invoicing Page
1. Unauthenticated user
   - ✅ Redirected to login page

2. Authenticated user (any role)
   - ✅ Can upload/validate XML
   - ✅ Can send validated invoices

**Time Required:** 15 minutes  
**Risk if Skipped:** MEDIUM - Unauthorized users may approve invoices

---

### 4. Configure Production Environment Variables ⬜ TODO

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

**Required Variables:**

Create `.env.production` with:
```bash
# Supabase (Already configured via integration)
VITE_SUPABASE_URL=https://yvyjzlbosmtesldczhnm.supabase.co
VITE_SUPABASE_ANON_KEY=<from_supabase_dashboard>

# E-Invoicing
PEPPOL_WEBHOOK_SECRET=<generate_secure_secret>
PEPPOL_AP_URL=<your_peppol_access_point_url>
PEPPOL_AP_TOKEN=<your_peppol_ap_token>

# HIL Configuration
HIL_LOW_THRESHOLD=75
HIL_HIGH_SAMPLE_PCT=5
HIL_CONFIDENCE_THRESHOLD=70

# Production Settings
NODE_ENV=production
```

**Generate Secrets:**
```bash
# Generate PEPPOL_WEBHOOK_SECRET
openssl rand -hex 32

# Store in Supabase Edge Functions secrets
supabase secrets set PEPPOL_WEBHOOK_SECRET=<generated_secret>
```

**Time Required:** 10 minutes  
**Risk if Skipped:** HIGH - Webhooks unprotected, missing configuration

---

### 5. Test E2E Flows ⬜ TODO

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

**Test Cases:**

#### A. E-Invoice Validation Flow
```bash
# 1. Run E2E test
npm run test:e2e

# 2. Manual test
curl -X POST 'https://yvyjzlbosmtesldczhnm.supabase.co/functions/v1/einvoice_validate' \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d @fixtures/bis3.xml

# Expected: Validation passed with confidence > 90%
```

#### B. Metrics Endpoint
```bash
# Test Prometheus metrics
curl 'https://yvyjzlbosmtesldczhnm.supabase.co/functions/v1/metrics?format=prometheus'

# Expected: Text format with counters
# einvoice_validated_total 0
# peppol_send_fail_total 0
# ...
```

#### C. Approval Workflow
1. Upload test invoice
2. Validate invoice
3. Check appears in approvals list
4. Approve as approver role
5. Verify status changes to 'sent'

**Time Required:** 20 minutes  
**Risk if Skipped:** HIGH - Critical flows may be broken

---

### 6. Set Up Monitoring & Alerts ⬜ TODO

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

**Required Setup:**

#### A. Prometheus/Grafana Dashboard
- Import dashboard from `docs/grafana-dashboard.json` (TODO: create)
- Configure data source: `/functions/v1/metrics`
- Set refresh interval: 30s

#### B. Alert Rules
```yaml
# Error rate alert
- alert: HighErrorRate
  expr: rate(peppol_send_fail_total[5m]) > 0.05
  for: 5m
  annotations:
    summary: "Peppol send error rate > 5%"

# Burn rate alert (fast burn)
- alert: FastBurnRate
  expr: |
    (1 - rate(http_requests_total{status="200"}[1h]))
    / (1 - 0.999) > 2.0
  for: 5m
  annotations:
    summary: "SLO burn rate critical (1h window)"

# HIL queue size
- alert: HILQueueBacklog
  expr: hil_queue_size > 100
  for: 10m
  annotations:
    summary: "HIL review queue has {{$value}} items"
```

**Time Required:** 30 minutes  
**Risk if Skipped:** HIGH - No visibility into production issues

---

### 7. Database Backups & Recovery ⬜ TODO

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

**Supabase Automatic Backups:**
- ✅ Daily backups enabled (automatic on paid plans)
- ⬜ Point-in-time recovery tested
- ⬜ Backup retention: 7 days minimum

**Manual Backup Test:**
```bash
# Test backup creation
supabase db dump --file backup-test.sql

# Test restore to staging
supabase db reset --db-url $STAGING_DB_URL
psql $STAGING_DB_URL < backup-test.sql
```

**Recovery Runbook:** `docs/DISASTER_RECOVERY.md` (TODO: create)

**Time Required:** 15 minutes  
**Risk if Skipped:** CRITICAL - No recovery plan in case of data loss

---

### 8. SSL/TLS Configuration ✅ Complete

**Status:** ✅ Supabase handles SSL automatically

**Verified:**
- ✅ All endpoints use HTTPS
- ✅ TLS 1.2+ enforced
- ✅ Valid SSL certificates
- ✅ HSTS headers enabled

---

### 9. Legal & Compliance ⬜ TODO

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

**Required Documents:**
- ⬜ Privacy Policy updated with:
  - PIPEDA/PIPA compliance statements
  - Data retention policies (7 years for financial records)
  - User rights (access, deletion, portability)
  
- ⬜ Terms of Service updated with:
  - CASL compliance for email communications
  - Limitation of liability
  - Service level commitments
  
- ⬜ Cookie Policy (if using analytics)

**Review by:** Legal counsel (recommended)

**Time Required:** 2-4 hours (with legal review)  
**Risk if Skipped:** LEGAL - Non-compliance with Canadian privacy laws

---

### 10. User Documentation ⬜ TODO

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

**Required Pages:**
- ⬜ Getting Started Guide
- ⬜ E-Invoicing Tutorial
- ⬜ Approval Workflow Guide
- ⬜ Troubleshooting FAQ
- ⬜ Security Best Practices

**Location:** `docs/user-guides/` or Help Center

**Time Required:** 4-8 hours  
**Risk if Skipped:** MEDIUM - User confusion, support burden

---

## 📊 COMPLETION SUMMARY

| Category | Status | Items | Complete |
|----------|--------|-------|----------|
| **Critical Security** | ⚠️ | 3 | 1/3 |
| **Configuration** | ⚠️ | 2 | 0/2 |
| **Testing** | ⚠️ | 2 | 0/2 |
| **Operations** | ⚠️ | 2 | 1/2 |
| **Compliance** | ⚠️ | 1 | 0/1 |
| **TOTAL** | **⚠️** | **10** | **2/10** |

---

## 🚦 GO/NO-GO CRITERIA

### ✅ REQUIRED FOR LAUNCH (Must be 100% complete)
- [ ] Leaked Password Protection enabled
- [ ] RLS policies verified
- [ ] Role-based access tested
- [ ] Production environment configured
- [ ] E2E tests passing
- [ ] Monitoring set up

### ⚠️ STRONGLY RECOMMENDED (Should be 80%+ complete)
- [ ] Database backups tested
- [ ] Legal documents reviewed
- [ ] User documentation published
- [ ] Runbooks created

### 📈 NICE TO HAVE (Can be completed post-launch)
- Advanced analytics dashboards
- Additional test coverage
- Performance optimization
- Feature tutorials

---

## 📅 TIMELINE

**Target Launch Date:** TBD  
**Days Remaining:** TBD

**Recommended Schedule:**
- Day 1-2: Complete all critical security items
- Day 3-4: Configuration and testing
- Day 5-6: Operations and monitoring setup
- Day 7: Final review and sign-off

---

## ✍️ SIGN-OFF

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Engineering Lead | __________ | __________ | __________ |
| Security Officer | __________ | __________ | __________ |
| Legal Counsel | __________ | __________ | __________ |
| Product Manager | __________ | __________ | __________ |

---

**Next Review:** Weekly until 100% complete  
**Contact:** security@flowbills.ca (TODO: set up)
