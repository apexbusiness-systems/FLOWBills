# Invoice Processing Workflow Guide

## Complete User Journey: How to Process an Invoice

### Step 1: Upload Invoice
**Location:** Dashboard → Quick Access → "Invoice Management" OR Invoice Management page → "Upload & Process" tab

1. Click on the file upload zone or drag & drop your invoice (PDF, Excel, CSV)
2. The system automatically extracts data using OCR and AI:
   - Invoice number
   - Vendor name
   - Amount
   - Date
   - Line items
   - AFE numbers (if present)
   - UWI (Unique Well Identifier)
   - Field ticket references

### Step 2: Data Validation
**Automatic Process**

The system validates extracted data against:
- AFE budgets (checks remaining budget)
- Field ticket records (verifies service completion)
- UWI registry (validates well identifiers)
- Vendor information
- Duplicate detection

**Status:** Invoice moves to "Validate" stage in processing pipeline

### Step 3: Three-Way Matching
**Location:** Dashboard → Quick Access → "Three-Way Matching"

The system automatically matches:
1. **Invoice** (uploaded document)
2. **AFE** (Authorization for Expenditure)
3. **Field Ticket** (service verification)

**Match Results:**
- ✅ **Perfect Match:** All amounts align, AFE has budget, field ticket verified → Auto-approve
- ⚠️ **Partial Match:** Minor discrepancies → Route to approval queue
- ❌ **Mismatch:** Significant issues → Route to exceptions queue

**Status:** Invoice moves to "Match" stage

### Step 4: Approval Workflow
**Location:** Workflows page

Based on configured workflow rules:
- **Auto-Approval:** Perfect matches with sufficient budget
- **Manager Approval:** Amounts over threshold or budget concerns
- **Sequential Approval:** Multiple approvers for high-value invoices
- **Exception Review:** Manual review for mismatches

**Status:** Invoice moves to "Approve" stage

### Step 5: Payment Processing
**Automatic Process**

Once approved:
1. Invoice marked as "Ready for Payment"
2. Batched with other approved invoices
3. Exported to accounting system
4. Payment initiated through ERP integration

**Status:** Invoice moves to "Pay" stage

### Step 6: Remittance & Reconciliation
**Final Stage**

1. Payment confirmation received
2. Remittance advice sent to vendor
3. AFE budget updated (spent amount recorded)
4. Transaction logged in audit trail
5. Compliance records updated

**Status:** Invoice moves to "Remit" stage and marked as "Completed"

---

## Quick Access Dashboard Cards

The Dashboard provides direct access to all workflow components:

### 1. AFE Management
- View all Authorization for Expenditure records
- Track budget vs. spent amounts
- Set up budget alerts
- Create new AFEs

### 2. Field Ticket Verification
- Verify field service completion
- Link tickets to invoices
- GPS-based location validation
- Service date validation

### 3. UWI Registry
- Manage Unique Well Identifiers
- Organize invoices by well location
- Track production and costs per well

### 4. Three-Way Matching
- Automated invoice matching
- Review match results
- Approve/reject matched sets
- Handle exceptions

### 5. Reports & Analytics
- AFE spending reports
- Field ticket analysis
- UWI-based cost tracking
- Vendor spend analysis

---

## Processing Pipeline Visualization

The **Processing Pipeline** widget shows real-time status:

```
Inbox (24) → Validate (8) → Match (12) → Approve (6) → Pay (18) → Remit (15)
```

**Color Coding:**
- 🟦 Blue: Active processing
- 🟡 Yellow: Pending action
- 🔴 Red: Attention required (exceptions)
- 🟢 Green: Completed

Click on any stage to view invoices in that status.

---

## Common Workflows

### Workflow 1: Standard Invoice Processing
1. **Upload** invoice via drag & drop
2. **Auto-extract** data using AI
3. **Auto-match** against AFE and field ticket
4. **Auto-approve** if perfect match
5. **Auto-process** payment
6. **Complete** with remittance

**Time:** 2-5 minutes (fully automated)

### Workflow 2: High-Value Invoice (>$50k)
1. Upload invoice
2. Auto-extract data
3. Auto-match
4. **Manager approval required**
5. Process payment after approval
6. Complete with remittance

**Time:** 1-2 business days (approval dependent)

### Workflow 3: Exception Handling
1. Upload invoice
2. Auto-extract data
3. **Mismatch detected** (e.g., field ticket amount differs)
4. **Route to exceptions queue**
5. **Manual review** by operator
6. Correction or rejection
7. Re-process or cancel

**Time:** 2-5 business days (investigation dependent)

---

## Key Features for Oil & Gas

### Joint Interest Billing (JIB)
- Automated JIB compliance checking
- Partner cost allocation
- Operator vs. non-operator handling
- COPAS standard validation

### AFE Integration
- Real-time budget tracking
- Over-budget alerts
- Multi-AFE invoice splitting
- Approval hierarchy based on AFE authority

### Field Ticket Validation
- GPS coordinate verification
- Service date validation
- Equipment and personnel tracking
- Rate validation against contracts

### UWI Management
- Canadian UWI format validation
- Well-level cost tracking
- Production vs. cost analysis
- Multi-well invoice allocation

---

## Best Practices

1. **Set Up AFEs First:** Create AFE records before processing invoices
2. **Configure Validation Rules:** Set up custom validation rules in Settings
3. **Create Approval Workflows:** Define approval chains based on amount thresholds
4. **Enable Budget Alerts:** Get notified before AFE budgets are exceeded
5. **Use Three-Way Matching:** Always verify invoices against field tickets
6. **Review Pipeline Regularly:** Monitor the processing pipeline for bottlenecks
7. **Analyze Reports:** Use analytics to identify cost trends and optimization opportunities

---

## Troubleshooting

### Invoice Stuck in "Validate" Stage
**Cause:** Missing or invalid data
**Solution:** Review validation errors, manually correct data

### No Auto-Match Found
**Cause:** AFE number or field ticket reference not extracted
**Solution:** Manually link invoice to AFE/field ticket

### Approval Delayed
**Cause:** Approver not notified or unavailable
**Solution:** Check notification settings, reassign approver if needed

### Payment Not Processing
**Cause:** ERP integration issue or missing payment details
**Solution:** Check integration status, verify vendor payment information

---

## Next Steps

1. **First Time Users:** Complete the onboarding tour (Dashboard → Tour button)
2. **Upload Test Invoice:** Try the upload process with a sample invoice
3. **Configure Workflows:** Set up approval workflows based on your business rules
4. **Enable Integrations:** Connect to your ERP system for seamless payment processing
5. **Review Analytics:** Explore reports to understand spending patterns

---

## Support

- **In-App Help:** Click the Help icon in any section
- **24/7 AI Support:** Use the support chat (bottom right corner)
- **Video Tutorials:** Visit the Help Center for step-by-step videos
- **Contact Support:** support@flowbills.ca
