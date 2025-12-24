# Invoice Processing End-to-End Flow

**Last Updated**: 2025-12-18  
**Status**: ✅ FULLY WIRED

---

## Complete Flow Diagram

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
│  INVOICE    │ Invoice record created in database
│  CREATED    │ Status: 'pending'
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  INTAKE     │ invoice-intake orchestration function called
│ ORCHESTRATE │
└──────┬──────┘
       │
       ├─→ STEP 1: Extract (invoice-extract)
       │   └─→ AI extraction, AFE validation, UWI lookup
       │
       ├─→ STEP 2: Duplicate Check (duplicate-check)
       │   └─→ SHA-256 hash matching, fuzzy matching
       │
       ├─→ STEP 3: HIL Router (hil-router)
       │   └─→ Confidence-based routing decision
       │       ├─→ High confidence (>85%) → AUTO_APPROVE
       │       └─→ Low confidence (<85%) → HUMAN_REVIEW
       │
       └─→ STEP 4: Update Status
           ├─→ Auto-approved → Status: 'approved_auto'
           │   └─→ Creates approval record
           │
           └─→ Needs review → Status: 'needs_review'
               └─→ Creates review_queue entry (via hil-router)
```

---

## Step-by-Step Implementation

### Step 1: File Upload
**Component**: `src/components/dashboard/InvoiceUpload.tsx`  
**Hook**: `src/hooks/useFileUpload.tsx`

1. User selects/drops file
2. File uploaded to Supabase Storage (`invoice-documents` bucket)
3. `invoice_documents` record created
4. Invoice record created with status `pending`

### Step 2: Invoice Intake Orchestration
**Function**: `supabase/functions/invoice-intake/index.ts`

Called from `InvoiceUpload.tsx` after file upload:

```typescript
const { data: intakeResult } = await supabase.functions.invoke('invoice-intake', {
  body: {
    invoice_id: invoice.id,
    file_content: fileContent
  }
});
```

### Step 3: AI Extraction
**Function**: `supabase/functions/invoice-extract/index.ts`

Called by `invoice-intake`:
- Extracts invoice data using AI (Google Gemini 2.5 Flash)
- Validates against AFE budgets
- Looks up UWI (Unique Well Identifier)
- Returns confidence scores and extracted data

### Step 4: Duplicate Detection
**Function**: `supabase/functions/duplicate-check/index.ts`

Called by `invoice-intake`:
- Generates SHA-256 hash from invoice data
- Checks for exact duplicates
- Performs fuzzy matching (7-day window, 1% amount tolerance)
- Updates `invoices.duplicate_hash` column

### Step 5: HIL Router (Human-in-Loop)
**Function**: `supabase/functions/hil-router/index.ts`

Called by `invoice-intake`:
- Analyzes confidence score, amount, risk factors
- Makes routing decision:
  - **Auto-approve**: Confidence >85%, amount <$10k, no risk factors
  - **Human review**: Confidence <85%, amount >$10k, or risk factors present
- Creates `review_queue` entry if human review needed
- Creates `approvals` record if auto-approved

### Step 6: Status Update
**Function**: `supabase/functions/invoice-intake/index.ts`

Updates invoice status based on routing decision:
- `approved_auto` - Auto-approved by HIL router
- `needs_review` - Requires human review
- `processing` - In progress

---

## Database Tables Used

| Table | Purpose | Updated By |
|-------|---------|------------|
| `invoices` | Main invoice records | invoice-intake, hil-router |
| `invoice_extractions` | AI extraction results | invoice-extract |
| `invoice_documents` | File attachments | useFileUpload hook |
| `review_queue` | Human review queue | hil-router |
| `approvals` | Approval records | hil-router, invoice-intake |
| `workflow_instances` | Workflow execution | auto_start_invoice_workflow trigger |

---

## Automatic Workflow Trigger

**Trigger**: `trigger_auto_start_invoice_workflow`  
**Function**: `auto_start_invoice_workflow()`

When an invoice is created:
1. Trigger fires automatically
2. Finds active `invoice_processing` workflow for user
3. Creates `workflow_instance` record
4. Workflow can be executed manually or automatically

---

## Error Handling

### Extraction Fails
- Error logged
- Invoice status set to `extraction_failed`
- User notified via toast

### Duplicate Check Fails
- Warning logged
- Processing continues (non-blocking)
- Duplicate status noted in result

### HIL Router Fails
- Fallback logic used:
  - Check duplicates → human review if found
  - Check validation errors → human review if found
  - Check budget → human review if over budget
  - Check confidence → human review if <60%
- Processing continues with fallback decision

### Network Errors
- Retry logic in TanStack Query
- User sees error message
- Can retry upload

---

## Verification Checklist

To verify the end-to-end flow works:

- [x] File uploads to Supabase Storage
- [x] Invoice record created
- [x] `invoice-intake` function called
- [x] `invoice-extract` function called
- [x] Extraction results stored in `invoice_extractions`
- [x] `duplicate-check` function called
- [x] `duplicate_hash` column populated
- [x] `hil-router` function called
- [x] Review queue entry created (if needed)
- [x] Approval record created (if auto-approved)
- [x] Invoice status updated correctly
- [x] Workflow instance created (via trigger)

---

## Testing the Flow

### Manual Test

1. **Upload Invoice**:
   ```typescript
   // In browser console or via UI
   // Upload a test invoice PDF
   ```

2. **Check Database**:
   ```sql
   -- Verify invoice created
   SELECT id, status, invoice_number FROM invoices ORDER BY created_at DESC LIMIT 1;
   
   -- Verify extraction
   SELECT * FROM invoice_extractions WHERE invoice_id = '<invoice-id>';
   
   -- Verify duplicate hash
   SELECT duplicate_hash FROM invoices WHERE id = '<invoice-id>';
   
   -- Verify review queue (if applicable)
   SELECT * FROM review_queue WHERE invoice_id = '<invoice-id>';
   
   -- Verify approval (if auto-approved)
   SELECT * FROM approvals WHERE invoice_id = '<invoice-id>';
   
   -- Verify workflow instance
   SELECT * FROM workflow_instances WHERE entity_id = '<invoice-id>';
   ```

3. **Check Function Logs**:
   - Supabase Dashboard → Edge Functions → Logs
   - Look for `invoice-intake`, `invoice-extract`, `duplicate-check`, `hil-router`

---

## Status Transitions

```
pending → processing → extracting → validated → [auto_approve | needs_review]
                                                      │
                                                      ├─→ approved_auto
                                                      └─→ needs_review → approved (manual)
```

---

## Performance Metrics

**Expected Timings**:
- File upload: 1-5 seconds (depends on file size)
- Extraction: 5-15 seconds (AI processing)
- Duplicate check: <1 second
- HIL routing: <1 second
- **Total**: ~10-25 seconds end-to-end

---

## Troubleshooting

### Invoice Stuck in "processing"
- Check `invoice-intake` function logs
- Verify extraction completed
- Check for errors in function chain

### No Review Queue Entry
- Verify `hil-router` was called
- Check `hil-router` logs for errors
- Verify `review_queue` table exists
- Check column names match (should be `flagged_fields`, not `risk_factors`)

### No Approval Record
- Verify auto-approval conditions met
- Check `approvals` table exists
- Verify column names match (should be `status`, not `approval_status`)

### Workflow Instance Not Created
- Verify trigger exists: `trigger_auto_start_invoice_workflow`
- Check workflow exists for user
- Verify workflow is active (`is_active = true`)

---

**Last Updated**: 2025-12-18  
**Maintained By**: Staff Engineer + SRE Team

