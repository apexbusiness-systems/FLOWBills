# Database Schema Changelog

This document tracks all database schema changes made during the enterprise readiness transformation.

---

## 2025-12-18: Auto-Workflow Trigger

**Migration**: `20251218130642_auto_workflow_trigger.sql`

**Changes**:
- Created `auto_start_invoice_workflow()` function to automatically create workflow instances when invoices are created
- Created `trigger_auto_start_invoice_workflow` trigger on `invoices` table

**Purpose**: Enable automatic workflow execution without manual intervention

**Impact**: Low risk - only creates workflow instances, doesn't modify existing data

---

## Previous Schema State

### Tables Verified (from migrations)

**Core Invoice Tables**:
- `invoices` - Main invoice records (has `duplicate_hash` column)
- `invoice_extractions` - AI extraction results
- `invoice_documents` - File attachments

**Workflow Tables**:
- `workflows` - Workflow definitions
- `workflow_instances` - Execution tracking

**Approval Tables**:
- `approvals` - Approval records (has `status` enum, `approver_id` column)
- `review_queue` - Human-in-loop queue (has `flagged_fields` JSONB, `assigned_to` column)

**Security Tables**:
- `security_events` - Security event logging
- `audit_logs` - Audit trail
- `consent_logs` - CASL/PIPEDA compliance

**Integration Tables**:
- `flowbills_compliance_receipts` - FlowC idempotency tracking

**Oil & Gas Tables**:
- `afes` - Authorization for Expenditure
- `uwis` - Unique Well Identifiers
- `field_tickets` - Field service tickets

### Column Mismatches Fixed

**hil-router edge function** (fixed 2025-12-18):
- Changed `risk_factors` → `flagged_fields` (matches `review_queue.flagged_fields`)
- Changed `approval_status` → `status` (matches `approvals.status` enum)
- Changed `user_id` → `assigned_to` (matches `review_queue.assigned_to`)
- Changed `user_id` → `approver_id` (matches `approvals.approver_id`)

---

## Migration Verification

To verify all tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'invoices', 'invoice_extractions', 'invoice_documents',
    'workflows', 'workflow_instances',
    'approvals', 'review_queue',
    'security_events', 'audit_logs', 'consent_logs',
    'flowbills_compliance_receipts',
    'afes', 'uwis', 'field_tickets'
  )
ORDER BY table_name;
```

To verify triggers exist:

```sql
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    'trigger_auto_start_invoice_workflow',
    'trigger_generate_duplicate_hash',
    'update_invoices_updated_at'
  )
ORDER BY trigger_name;
```

---

## Rollback Procedures

### Rollback Auto-Workflow Trigger

```sql
DROP TRIGGER IF EXISTS trigger_auto_start_invoice_workflow ON public.invoices;
DROP FUNCTION IF EXISTS public.auto_start_invoice_workflow();
```

**Note**: This will stop automatic workflow creation. Workflows will need to be manually triggered.

---

## Future Schema Changes

Planned but not yet implemented:
- None currently planned

---

**Last Updated**: 2025-12-18  
**Maintained By**: Staff Engineer + SRE Team

