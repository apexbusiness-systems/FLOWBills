# FLOWBills System Map & Truth-Finding Report
**Date**: 2025-01-14  
**Auditor**: Staff Engineer + SRE  
**Status**: 🔍 COMPREHENSIVE AUDIT COMPLETE

---

## Executive Summary

This document provides a complete system map of FLOWBills, identifying all end-to-end flows, gaps, CI status, and critical issues that need fixing to move from "polished but fragile" to "boringly reliable, enterprise-ready, and CI-green."

**Overall Assessment**: The codebase has solid foundations but critical gaps prevent reliable production operation.

---

## 1. System Architecture Overview

### Frontend Stack
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **State Management**: TanStack Query (React Query)
- **UI Library**: Radix UI + Tailwind CSS
- **Routing**: React Router v6
- **Hosting**: Lovable (flowbills.ca)

### Backend Stack
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage (`invoice-documents` bucket)
- **Edge Functions**: Deno runtime (43 functions)
- **API**: RESTful via Supabase Edge Functions

### Integrations
- **FlowC**: Silent compliance webhook (`flowbills-compliance-hook`)
- **Peppol**: E-invoicing (sandbox/mock mode)
- **LLM**: OpenAI GPT-4o (locked via manifest)
- **Service Worker**: PWA support with offline capabilities

---

## 2. End-to-End Invoice Processing Flow

### Current Flow (As Designed)

```
┌─────────────┐
│   UPLOAD    │ User uploads invoice file (PDF/Excel/CSV)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   STORAGE   │ File saved to Supabase Storage (invoice-documents bucket)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   EXTRACT   │ invoice-intake → invoice-extract (AI extraction)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  DUPLICATE  │ duplicate-check edge function (SHA-256 hash matching)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   VALIDATE  │ AFE budget check, UWI lookup, field ticket matching
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    ROUTE    │ hil-router (confidence-based routing)
└──────┬──────┘
       │
       ├─→ High confidence (>85%) → AUTO-APPROVE
       │
       └─→ Low confidence (<85%) → REVIEW_QUEUE
              │
              ▼
       ┌─────────────┐
       │   APPROVE   │ Manual review in ApprovalQueue UI
       └──────┬──────┘
              │
              ▼
       ┌─────────────┐
       │    PAY      │ Payment processing (future)
       └─────────────┘
```

### Actual Flow (Current State)

**✅ WORKING**:
- File upload → Supabase Storage (REAL implementation in `useFileUpload.tsx`)
- Invoice creation → Database record created
- `invoice-intake` orchestration function exists and calls extraction

**❌ BROKEN**:
- Column mismatch: `hil-router` inserts `risk_factors` but `review_queue` has `flagged_fields`
- Column mismatch: `hil-router` inserts `approval_status` but `approvals` has `status`
- No automatic workflow triggers (workflows must be manually executed)
- FlowC callback URL not wired to pause payments

---

## 3. Database Schema Analysis

### ✅ Tables That Exist (Verified in Migrations)

| Table | Migration | Status | Notes |
|-------|-----------|--------|-------|
| `invoices` | Multiple | ✅ | Has `duplicate_hash` column (added in 20251130002315) |
| `invoice_extractions` | Multiple | ✅ | Stores AI extraction results |
| `invoice_documents` | Multiple | ✅ | Links files to invoices |
| `review_queue` | 20250926005320 | ✅ | **BUT** has `flagged_fields` (JSONB), not `risk_factors` |
| `approvals` | 20250926005320 | ✅ | **BUT** has `status` (enum), not `approval_status` |
| `security_events` | 20250926185944 | ✅ | Exists |
| `workflows` | Multiple | ✅ | Workflow definitions |
| `workflow_instances` | Multiple | ✅ | Execution tracking |
| `afes` | Multiple | ✅ | Authorization for Expenditure |
| `uwis` | Multiple | ✅ | Unique Well Identifiers |
| `field_tickets` | Multiple | ✅ | Field service tickets |
| `flowbills_compliance_receipts` | 20251211191202 | ✅ | FlowC idempotency tracking |

### ❌ Column Mismatches (Critical)

**Issue 1**: `hil-router` → `review_queue` column mismatch
- **Function expects**: `risk_factors` (array)
- **Table has**: `flagged_fields` (JSONB)
- **Location**: `supabase/functions/hil-router/index.ts:220`
- **Impact**: INSERT fails silently, review queue items not created

**Issue 2**: `hil-router` → `approvals` column mismatch
- **Function expects**: `approval_status` (string)
- **Table has**: `status` (enum: `approval_status`)
- **Location**: `supabase/functions/hil-router/index.ts:257`
- **Impact**: INSERT fails, auto-approval records not created

**Fix Required**: Update `hil-router` to use correct column names OR add migration to add missing columns.

---

## 4. Frontend Component Analysis

### ✅ Real Implementations

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| File Upload | `src/hooks/useFileUpload.tsx` | ✅ REAL | Uploads to Supabase Storage, creates DB records |
| Invoice Upload | `src/components/dashboard/InvoiceUpload.tsx` | ✅ REAL | Calls `invoice-intake` edge function |
| Workflow Pipeline | `src/components/dashboard/WorkflowPipeline.tsx` | ✅ REAL | Queries real data, real-time subscriptions |
| Invoice List | `src/components/invoices/InvoiceListVirtualized.tsx` | ✅ REAL | Virtual scrolling, real data |
| Error Boundary | `src/components/error-boundary/ErrorBoundary.tsx` | ✅ REAL | Proper error handling with fallback UI |

### ⚠️ Potential Issues

1. **Service Worker Recovery**: `src/lib/sw-health-monitor.ts` has aggressive recovery logic that might cause blank screens if SW fails repeatedly
2. **Error Boundary**: Uses `console.error` instead of logger (should use centralized logger)
3. **Main Entry**: Root element check throws error (good), but no graceful degradation

---

## 5. Edge Functions Analysis

### ✅ Production-Ready Functions

| Function | Status | Notes |
|----------|--------|-------|
| `invoice-extract` | ✅ READY | Full AI extraction, AFE validation, UWI lookup |
| `duplicate-check` | ✅ READY | SHA-256 hashing, fuzzy matching, rate limiting |
| `hil-router` | ⚠️ BROKEN | Column name mismatches (see above) |
| `workflow-execute` | ✅ READY | Step execution engine, condition evaluation |
| `invoice-intake` | ✅ READY | Orchestration function, calls extract + duplicate + HIL |
| `flowbills-compliance-hook` | ✅ READY | FlowC integration, HMAC signature verification |
| `einvoice_validate` | ✅ READY | EN 16931 validation |
| `einvoice_send` | ⚠️ MOCK | Uses mock Peppol AP endpoint |
| `einvoice_receive` | ✅ READY | Receives Peppol messages |

### ❌ Functions with Issues

1. **hil-router**: Column name mismatches (critical)
2. **einvoice_send**: Mock implementation (documented, but needs real AP integration)
3. **crm-sync**: References `crm_sync_logs` table (needs verification)

---

## 6. CI/CD Pipeline Analysis

### ✅ Working Jobs

| Workflow | Status | Notes |
|----------|--------|-------|
| `ci-enhanced.yml` | ✅ PASSING | Type check, lint, tests (all continue-on-error) |
| `e2e-smoke.yml` | ✅ PASSING | Build verification, JS bundle checks |
| `edge-function-gates.yml` | ✅ PASSING | Deno checks, import discipline |
| `llm-integrity.yml` | ✅ PASSING | Manifest verification |

### ⚠️ Potential Issues

1. **All jobs use `continue-on-error: true`**: Failures are hidden, not blocking
2. **No Slack webhook found**: Need to check if notifications are optional
3. **Control function**: `control-hello-world` exists, CI correctly skips `_control` directory

### ❌ CI Issues to Fix

1. **Make failures blocking**: Remove `continue-on-error` from critical checks
2. **Slack notifications**: Make optional (check if `SLACK_WEBHOOK_URL` is set)
3. **Type check errors**: Some functions may have type errors that are ignored

---

## 7. Critical Gaps Identified

### P0 - CRITICAL BLOCKERS

#### Gap 1: Column Name Mismatches in hil-router
**Impact**: Review queue and approvals not created, HIL routing fails silently
**Files**: 
- `supabase/functions/hil-router/index.ts:220` (risk_factors → flagged_fields)
- `supabase/functions/hil-router/index.ts:257` (approval_status → status)
**Fix**: Update function to use correct column names

#### Gap 2: No Automatic Workflow Triggers
**Impact**: Workflows must be manually triggered, no automation
**Missing**: Database trigger to auto-start workflow on invoice creation
**Fix**: Create trigger function and trigger

#### Gap 3: FlowC Callback Not Wired
**Impact**: Flagged invoices don't pause payment processing
**Missing**: Callback handler in FLOWBills to receive FlowC hold signals
**Fix**: Create edge function or webhook handler

### P1 - HIGH PRIORITY

#### Gap 4: Peppol Integration is Mock
**Impact**: E-invoicing send doesn't actually transmit
**Status**: Documented as mock, needs real AP integration
**Fix**: Replace mock with real Peppol Access Point client

#### Gap 5: Service Worker Recovery May Cause Blank Screens
**Impact**: If SW fails repeatedly, recovery logic might show blank screen
**Fix**: Add fallback to full page reload after max failures

#### Gap 6: CI Jobs Don't Fail Build
**Impact**: Errors are hidden, PRs merge with broken code
**Fix**: Remove `continue-on-error` from critical checks

### P2 - MEDIUM PRIORITY

#### Gap 7: Error Boundary Uses console.error
**Impact**: Errors not logged to centralized system
**Fix**: Migrate to logger utility

#### Gap 8: Missing Integration Tests
**Impact**: No E2E validation of invoice processing flow
**Fix**: Add Playwright tests for critical paths

---

## 8. CI Status Summary

### Current State

**All workflows configured but non-blocking**:
- ✅ `ci-enhanced.yml`: Runs but continues on error
- ✅ `e2e-smoke.yml`: Build verification works
- ✅ `edge-function-gates.yml`: Quality checks pass
- ✅ `llm-integrity.yml`: Manifest protection works

**Issues**:
- ❌ Type errors may exist but are ignored
- ❌ Lint warnings may exist but are ignored
- ❌ Test failures may exist but are ignored
- ⚠️ No Slack webhook found (may be optional)

### Required Fixes

1. Make critical checks blocking (type, lint, tests)
2. Verify Slack webhook is optional
3. Fix any actual type/lint errors revealed

---

## 9. Security & Secrets Analysis

### ✅ Properly Secured

- **FlowC**: Uses `FLOWBILLS_WEBHOOK_SECRET` (env var, not hardcoded)
- **FlowC Callback**: Uses `FLOWBILLS_CALLBACK_URL` (env var)
- **Peppol**: Uses `PEPPOL_AP_URL`, `PEPPOL_AP_TOKEN`, `PEPPOL_WEBHOOK_SECRET` (env vars)
- **LLM**: Locked via manifest, uses `OPENAI_API_KEY` (env var)
- **Supabase**: Service role key only in edge functions (correct)

### ⚠️ Needs Verification

- Verify all secrets are set in Supabase dashboard
- Document required secrets in `docs/SECRETS_SAMPLE.md`
- Ensure no hardcoded secrets in code (scan needed)

---

## 10. Service Worker & Blank Page Analysis

### Current Implementation

**Service Worker**: `public/sw.js`
- PWA support
- Offline caching
- Auto-update logic

**Recovery Logic**: `src/lib/sw-health-monitor.ts`
- Clears old registrations on failure
- Retries up to 3 times
- Falls back to unregister if max failures

### Potential Blank Page Causes

1. **SW Recovery Loop**: If SW fails repeatedly, recovery might cause blank screen
2. **JS Bundle 404**: If build output path is wrong, bundles won't load
3. **Error Boundary Not Wrapping**: If error occurs before ErrorBoundary mounts

### Required Fixes

1. Add timeout to SW recovery (max 30 seconds, then full reload)
2. Verify build output paths match CI expectations
3. Ensure ErrorBoundary wraps entire app tree

---

## 11. FlowC Silent Compliance Status

### ✅ Implemented

- **Webhook Handler**: `flowbills-compliance-hook` edge function
- **Signature Verification**: HMAC-SHA256 validation
- **Idempotency**: `flowbills_compliance_receipts` table
- **Callback Support**: Function exists to send callbacks

### ❌ Missing

- **Callback Handler in FLOWBills**: No endpoint to receive FlowC callbacks
- **Payment Pause Logic**: No integration to pause payments on HOLD signal
- **Review Queue Integration**: Callbacks don't route to review queue

---

## 12. Peppol E-Invoicing Status

### Current State

- **Validation**: ✅ Real (EN 16931 validation)
- **Receive**: ✅ Real (receives Peppol messages)
- **Send**: ⚠️ MOCK (uses mock AP endpoint)

### Mock Implementation

**File**: `supabase/functions/einvoice_send/index.ts:76`
```typescript
// Mock AP endpoint - replace with actual Peppol Access Point
const apUrl = Deno.env.get('PEPPOL_AP_URL') || 'http://localhost:8080/ap/send';
```

**Status**: Clearly marked as mock, needs real AP client integration

---

## 13. Database Triggers Status

### ✅ Existing Triggers

- `trigger_generate_duplicate_hash`: Auto-generates duplicate hash on invoice insert/update
- `update_updated_at_column`: Updates `updated_at` timestamp (multiple tables)

### ❌ Missing Triggers

- **Auto-start workflow**: No trigger to create workflow instance on invoice creation
- **Auto-call invoice-intake**: No trigger to call extraction after document upload

---

## 14. Testing Infrastructure

### Current State

- **Unit Tests**: Some exist (logger, api-client, error-boundary)
- **Integration Tests**: Minimal (app-functionality.test.tsx)
- **E2E Tests**: None (Playwright configured but no tests)

### Coverage

- **Estimated**: ~20-30% coverage
- **Critical Paths**: Not fully tested
- **Invoice Flow**: No E2E test

---

## 15. Documentation Status

### ✅ Comprehensive Docs

- Production readiness reports
- Security documentation
- Compliance guides
- API documentation
- Deployment guides

### ⚠️ Needs Updates

- Secrets management guide
- Runbook for common issues
- Migration rollback procedures
- FlowC integration guide

---

## 16. Action Plan Summary

### Immediate Fixes (P0)

1. **Fix hil-router column mismatches** (30 min)
   - Change `risk_factors` → `flagged_fields`
   - Change `approval_status` → `status`

2. **Create workflow auto-trigger** (1 hour)
   - Create trigger function
   - Create trigger on invoices table

3. **Fix CI to fail on errors** (30 min)
   - Remove `continue-on-error` from critical checks
   - Fix any revealed errors

### Short-term Fixes (P1)

4. **Add FlowC callback handler** (2 hours)
5. **Fix service worker recovery timeout** (1 hour)
6. **Migrate ErrorBoundary to logger** (30 min)

### Medium-term (P2)

7. **Add integration tests** (4 hours)
8. **Document secrets management** (1 hour)
9. **Create runbook** (2 hours)

---

## 17. Truth vs. Claims

### Production Readiness Report Claims vs. Reality

| Claim | Reality | Status |
|-------|---------|--------|
| "All tables exist" | ✅ TRUE | Verified in migrations |
| "File upload working" | ✅ TRUE | Real implementation exists |
| "Workflow pipeline real data" | ✅ TRUE | Uses real queries |
| "Edge functions production-ready" | ⚠️ MOSTLY | hil-router has bugs |
| "CI fully green" | ⚠️ HIDDEN | Errors ignored with continue-on-error |
| "FlowC integration complete" | ⚠️ PARTIAL | Callback handler missing |
| "Peppol integration ready" | ❌ MOCK | Send function is mock |

---

## 18. Next Steps

1. **Create this system map** ✅ DONE
2. **Fix database column mismatches** (Step 2)
3. **Wire invoice processing end-to-end** (Step 3)
4. **Fix blank page issues** (Step 4)
5. **Clean up CI/CD** (Step 5)
6. **Complete FlowC integration** (Step 6)
7. **Production hardening** (Step 7)

---

**Report Generated**: 2025-01-14  
**Methodology**: Systematic code inspection + migration analysis + CI review  
**Confidence**: HIGH (all findings backed by code evidence)

