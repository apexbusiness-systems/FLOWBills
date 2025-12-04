# FLOWBills.ca — Comprehensive User Stories

**Version:** 1.0.0 | **Last Updated:** December 2025  
**Classification:** Product Requirements Documentation

---

## Document Purpose

This document contains the complete set of user stories that drove the design and implementation of FLOWBills.ca's workflow automation system. Each story is grounded in actual implemented functionality, traceable to specific code paths and database structures.

---

## 1. Invoice Processing Workflow

### Epic: End-to-End Invoice Lifecycle Management

**Business Value:** Reduce manual invoice processing from 15+ minutes to <30 seconds while maintaining compliance and accuracy.

---

### US-001: Invoice Upload and Intake

**As an** AP Clerk  
**I want to** upload invoices via drag-and-drop, email, or API  
**So that** invoices enter the processing pipeline automatically without manual data entry

**Acceptance Criteria:**
- [ ] Support PDF, TIFF, JPEG, PNG file formats
- [ ] Files upload to Supabase Storage with secure URLs
- [ ] Invoice record created in `invoices` table with status `pending`
- [ ] `invoice-intake` edge function triggered automatically
- [ ] Duplicate hash generated using `vendor_name + invoice_number + amount + date`
- [ ] User receives toast notification confirming upload

**Implementation Reference:**
```typescript
// src/hooks/useFileUpload.tsx
// supabase/functions/invoice-intake/index.ts
// Database: invoices.file_url, invoices.file_name, invoices.duplicate_hash
```

**Database Schema Used:**
```sql
invoices (
  id UUID PRIMARY KEY,
  invoice_number TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE,
  status TEXT DEFAULT 'pending',
  file_url TEXT,
  file_name TEXT,
  duplicate_hash TEXT,
  user_id UUID NOT NULL
)
```

---

### US-002: AI-Powered Data Extraction

**As an** AP Clerk  
**I want** the system to automatically extract invoice data (vendor, amount, date, line items, AFE numbers, UWIs)  
**So that** I don't have to manually key in invoice details

**Acceptance Criteria:**
- [ ] OCR processes uploaded documents via `ocr-extract` edge function
- [ ] Extracted data stored in `invoice_extractions` table
- [ ] Confidence scores calculated for each extracted field
- [ ] AFE numbers matched against `afes` table
- [ ] UWI identifiers matched against `uwis` table
- [ ] Field ticket references extracted and linked
- [ ] Line items parsed and stored in `invoice_line_items` table

**Implementation Reference:**
```typescript
// supabase/functions/ocr-extract/index.ts
// supabase/functions/invoice-extract/index.ts
// Database: invoice_extractions, invoice_line_items
```

**Database Schema Used:**
```sql
invoice_extractions (
  id UUID PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id),
  extracted_data JSONB,
  confidence_scores JSONB,
  extraction_status TEXT,
  afe_number TEXT,
  afe_id UUID REFERENCES afes(id),
  uwi TEXT,
  uwi_id UUID REFERENCES uwis(id),
  field_ticket_refs TEXT[],
  line_items JSONB,
  validation_errors TEXT[],
  validation_warnings TEXT[]
)
```

---

### US-003: Duplicate Detection

**As a** Finance Manager  
**I want** the system to automatically detect potential duplicate invoices  
**So that** we prevent duplicate payments that cost us 2-3% of AP spend

**Acceptance Criteria:**
- [ ] `duplicate-check` edge function evaluates every new invoice
- [ ] Fuzzy matching on vendor name (Levenshtein distance ≤ 2)
- [ ] Date window matching (±7 days)
- [ ] Amount tolerance matching (±5%)
- [ ] Invoice number similarity scoring (>0.85 threshold)
- [ ] Cross-AFE duplicate detection
- [ ] Duplicate flag stored and routed to human review
- [ ] Existing duplicate shown to reviewer for comparison

**Implementation Reference:**
```typescript
// supabase/functions/duplicate-check/index.ts
// Database: invoices.duplicate_hash
// Matching algorithm: SHA256(normalize(vendor) + normalize(number) + normalize(amount) + normalize(date))
```

**Business Rules:**
| Match Criteria | Threshold | Action |
|---------------|-----------|--------|
| Exact duplicate hash | 100% match | Auto-reject, log fraud event |
| Vendor + amount + date | >95% similarity | Route to HIL review |
| Vendor + amount (date differs) | >90% similarity | Flag for review |
| Amount only matches | N/A | No action (too common) |

---

### US-004: Human-in-the-Loop (HIL) Routing

**As a** System  
**I want to** automatically route low-confidence or high-risk invoices to human reviewers  
**So that** only clean invoices are auto-approved while exceptions get expert attention

**Acceptance Criteria:**
- [ ] Confidence score < 85% → Route to human review
- [ ] Confidence score < 60% → High priority review
- [ ] Amount > $10,000 CAD → Always requires human review (regardless of confidence)
- [ ] Risk factors present → Route to review with flags
- [ ] Missing critical fields → Route to review
- [ ] Routing decision logged with reason
- [ ] Invoice added to `review_queue` table

**Implementation Reference:**
```typescript
// supabase/functions/hil-router/index.ts
// Thresholds: AUTO_APPROVE_THRESHOLD = 85, REQUIRE_REVIEW_THRESHOLD = 60, HIGH_VALUE_THRESHOLD = 10000
```

**Database Schema Used:**
```sql
review_queue (
  id UUID PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id),
  user_id UUID NOT NULL,
  reason TEXT NOT NULL,
  confidence_score NUMERIC,
  risk_factors JSONB,
  review_decision TEXT,
  review_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  assigned_to UUID
)
```

**Routing Decision Matrix:**
| Confidence | Amount | Risk Factors | Decision |
|------------|--------|--------------|----------|
| ≥85% | <$10K | None | Auto-approve |
| ≥85% | ≥$10K | None | Human review (high value) |
| 60-84% | Any | None | Human review (medium confidence) |
| <60% | Any | Any | Human review (low confidence) |
| Any | Any | Present | Human review (risk flagged) |

---

### US-005: Multi-Tier Approval Workflow

**As a** Finance Manager  
**I want** invoices to route to appropriate approvers based on amount thresholds  
**So that** proper authorization controls are maintained per our corporate policy

**Acceptance Criteria:**
- [ ] Amount < $5,000 → Auto-approve (if confidence ≥85%)
- [ ] Amount $5,000 - $25,000 → Manager approval required
- [ ] Amount > $25,000 → CFO/Director approval required
- [ ] Approval creates record in `approvals` table
- [ ] Invoice status updated to `approved` or `rejected`
- [ ] Rejection requires reason/notes
- [ ] Audit trail maintained for all approval actions

**Implementation Reference:**
```typescript
// supabase/functions/workflow-execute/index.ts
// supabase/functions/policy-engine/index.ts
// src/hooks/useWorkflows.tsx - startWorkflow()
```

**Database Schema Used:**
```sql
approvals (
  id UUID PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id),
  user_id UUID NOT NULL,
  approval_status TEXT DEFAULT 'pending',
  approval_date TIMESTAMPTZ,
  approved_by UUID,
  amount_approved NUMERIC,
  comments TEXT,
  notes TEXT,
  auto_approved BOOLEAN DEFAULT false,
  confidence_score NUMERIC,
  approval_method TEXT,
  metadata JSONB
)
```

---

### US-006: Approval Queue Management

**As a** Manager/CFO  
**I want to** see all invoices pending my approval in a dedicated queue  
**So that** I can efficiently review and approve/reject invoices assigned to me

**Acceptance Criteria:**
- [ ] Queue shows invoices pending approval for current user's role
- [ ] Sort by priority (high value first, then by date)
- [ ] Show key details: vendor, amount, confidence score, flagged issues
- [ ] One-click approve for simple cases
- [ ] Reject with required reason field
- [ ] View invoice document inline
- [ ] View extraction details and confidence breakdown
- [ ] Bulk approve/reject capability

**Implementation Reference:**
```typescript
// src/pages/ApprovalQueue.tsx
// src/hooks/useBulkActions.tsx
// Database queries: review_queue JOIN invoices JOIN invoice_extractions
```

---

## 2. Three-Way Matching Workflow

### Epic: Automated Invoice-PO-Field Ticket Reconciliation

**Business Value:** Eliminate manual reconciliation that takes hours per invoice, catch discrepancies before payment.

---

### US-007: Three-Way Match Execution

**As an** AP Clerk  
**I want** the system to automatically match invoices against purchase orders and field tickets  
**So that** I can verify charges before approving payment

**Acceptance Criteria:**
- [ ] Invoice matched to AFE by extracted AFE number
- [ ] Field tickets linked by invoice_id or ticket number reference
- [ ] Amount variance calculated: Invoice Amount vs Sum of Field Tickets
- [ ] Match status determined: `perfect` (≥90%), `partial` (60-89%), `mismatch` (<60%)
- [ ] Issues list generated for mismatches
- [ ] Match results displayed in Three-Way Matching interface

**Implementation Reference:**
```typescript
// src/hooks/useThreeWayMatching.tsx - calculateMatchStatus()
// Match confidence calculation:
// - No AFE: -40%
// - Amount variance >10%: -30%
// - Amount variance 5-10%: -15%
// - No field tickets: -50%
```

**Match Status Determination:**
```typescript
interface MatchedSet {
  invoice_id: string;
  invoice_amount: number;
  afe_id: string | null;
  field_tickets: FieldTicket[];
  match_status: 'perfect' | 'partial' | 'mismatch';
  match_confidence: number;
  issues: string[];
  total_ticket_amount: number;
  amount_variance: number;
}
```

---

### US-008: Match Discrepancy Resolution

**As a** Finance Manager  
**I want to** review and resolve three-way match discrepancies  
**So that** I can approve valid invoices and reject fraudulent/erroneous ones

**Acceptance Criteria:**
- [ ] View discrepancy details: which amounts don't match, which tickets are missing
- [ ] Compare invoice line items to field ticket details
- [ ] Override match with documented reason
- [ ] Split invoice across multiple AFEs if needed
- [ ] Approve partial match with variance approval
- [ ] Reject with reason and route back to vendor

**Implementation Reference:**
```typescript
// src/components/matching/ThreeWayMatchingInterface.tsx
// src/hooks/useThreeWayMatching.tsx - approveMatch(), rejectMatch()
```

---

## 3. AFE (Authority for Expenditure) Management

### Epic: Budget Tracking and Cost Allocation

**Business Value:** Prevent budget overruns, ensure accurate cost allocation to wells/projects.

---

### US-009: AFE Creation and Tracking

**As a** Project Manager  
**I want to** create and manage AFEs with budget allocations  
**So that** I can track spending against approved budgets

**Acceptance Criteria:**
- [ ] Create AFE with: number, description, budget amount, well name, project type
- [ ] Set approval date and expiry date
- [ ] Track spent amount (auto-updated from approved invoices)
- [ ] View budget utilization percentage
- [ ] Status transitions: active → closed, active → overbudget

**Implementation Reference:**
```typescript
// src/hooks/useAFEs.tsx
// src/components/afe/AFEManager.tsx
// src/components/afe/CreateAFEDialog.tsx
```

**Database Schema Used:**
```sql
afes (
  id UUID PRIMARY KEY,
  afe_number TEXT NOT NULL,
  description TEXT,
  budget_amount NUMERIC NOT NULL,
  spent_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active',
  well_name TEXT,
  project_type TEXT,
  approval_date DATE,
  expiry_date DATE,
  user_id UUID NOT NULL
)
```

---

### US-010: Budget Alert Rules

**As a** Finance Controller  
**I want to** configure alerts when AFE spending reaches thresholds  
**So that** I'm notified before budgets are exceeded

**Acceptance Criteria:**
- [ ] Create alert rules with threshold percentage (e.g., 75%, 90%, 100%)
- [ ] Configure notification channels (email, in-app)
- [ ] Set alert severity (warning, critical)
- [ ] Filter rules by AFE or project type
- [ ] Track when alerts are triggered
- [ ] Automatic check via `budget-alert-check` edge function

**Implementation Reference:**
```typescript
// src/components/afe/BudgetAlertRulesManager.tsx
// src/hooks/useAlertRules.tsx
// supabase/functions/budget-alert-check/index.ts
```

**Database Schema Used:**
```sql
budget_alert_rules (
  id UUID PRIMARY KEY,
  rule_name TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  threshold_value NUMERIC NOT NULL,
  email_recipients TEXT[],
  notification_channels JSONB,
  afe_filter JSONB,
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  user_id UUID NOT NULL
)

budget_alert_logs (
  id UUID PRIMARY KEY,
  afe_id UUID REFERENCES afes(id),
  alert_rule_id UUID REFERENCES budget_alert_rules(id),
  budget_utilization NUMERIC,
  alert_message TEXT,
  severity TEXT,
  user_id UUID NOT NULL
)
```

---

### US-011: Invoice-to-AFE Cost Allocation

**As an** AP Clerk  
**I want** invoices to automatically update AFE spent amounts  
**So that** budget tracking is always current

**Acceptance Criteria:**
- [ ] When invoice approved, add amount to AFE.spent_amount
- [ ] When invoice rejected after approval, subtract from spent_amount
- [ ] Support split allocation across multiple AFEs
- [ ] Prevent approval if it would exceed AFE budget (configurable)
- [ ] Show budget impact during approval review

**Implementation Reference:**
```typescript
// Triggered by approval workflow
// supabase/functions/workflow-execute/index.ts - runValidation()
// Validation: config.check_afe_budget → extraction.budget_status === 'over_budget'
```

---

## 4. Field Ticket Management

### Epic: Field Service Documentation and Verification

**Business Value:** Ensure field work is documented, verified, and properly charged.

---

### US-012: Field Ticket Creation

**As a** Field Operator  
**I want to** create field tickets for services performed  
**So that** work is documented for invoicing and reconciliation

**Acceptance Criteria:**
- [ ] Create ticket with: number, vendor, service date, service type
- [ ] Record hours, rate, equipment, personnel
- [ ] Capture GPS coordinates (optional)
- [ ] Link to AFE and/or UWI
- [ ] Add notes and supporting documentation
- [ ] Status: unverified by default

**Implementation Reference:**
```typescript
// src/hooks/useFieldTickets.tsx
// src/components/field-tickets/CreateFieldTicketDialog.tsx
// src/components/field-tickets/FieldTicketManager.tsx
```

**Database Schema Used:**
```sql
field_tickets (
  id UUID PRIMARY KEY,
  ticket_number TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  service_date DATE NOT NULL,
  service_type TEXT,
  hours NUMERIC,
  rate NUMERIC,
  amount NUMERIC NOT NULL,
  equipment TEXT,
  personnel TEXT,
  location TEXT,
  gps_coordinates JSONB,
  notes TEXT,
  afe_id UUID REFERENCES afes(id),
  uwi_id UUID REFERENCES uwis(id),
  invoice_id UUID REFERENCES invoices(id),
  verified BOOLEAN DEFAULT false,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  user_id UUID NOT NULL
)
```

---

### US-013: Field Ticket Verification

**As a** Field Supervisor  
**I want to** verify field tickets submitted by operators  
**So that** only legitimate work is billed

**Acceptance Criteria:**
- [ ] View unverified tickets assigned to my wells/projects
- [ ] Verify ticket with one-click (sets verified=true, verified_by, verified_at)
- [ ] Reject ticket with reason
- [ ] Compare GPS coordinates against well location
- [ ] View ticket history for same vendor/location

**Implementation Reference:**
```typescript
// src/components/field-tickets/VerifyFieldTicketDialog.tsx
// src/hooks/useFieldTickets.tsx - verifyTicket()
```

---

### US-014: Field Ticket to Invoice Matching

**As an** AP Clerk  
**I want** field tickets automatically linked to invoices  
**So that** three-way matching works without manual lookup

**Acceptance Criteria:**
- [ ] OCR extracts field ticket references from invoices
- [ ] Tickets matched by: ticket_number, vendor + date + amount combination
- [ ] Matched tickets shown on invoice detail view
- [ ] Unmatched tickets flagged for review
- [ ] Manual ticket linking available as fallback

**Implementation Reference:**
```typescript
// supabase/functions/invoice-extract/index.ts - extracts field_ticket_refs
// src/hooks/useThreeWayMatching.tsx - fetchMatchedSets()
// Matching: t.invoice_id === invoice.id || extraction.field_ticket_refs.includes(t.ticket_number)
```

---

## 5. UWI (Unique Well Identifier) Registry

### Epic: Well-Level Cost Tracking and Compliance

**Business Value:** Accurate cost allocation to wells for regulatory reporting and partner billing.

---

### US-015: UWI Registry Management

**As a** Operations Manager  
**I want to** maintain a registry of all wells with their UWIs  
**So that** costs can be properly allocated and reported

**Acceptance Criteria:**
- [ ] Create UWI record with: identifier, well name, operator, province
- [ ] Set location (legal description)
- [ ] Track lifecycle: spud date, completion date, status
- [ ] Status options: active, suspended, abandoned
- [ ] Link invoices and field tickets to wells

**Implementation Reference:**
```typescript
// src/hooks/useUWIs.tsx
// src/components/uwi/UWIRegistry.tsx
// src/components/uwi/CreateUWIDialog.tsx
```

**Database Schema Used:**
```sql
uwis (
  id UUID PRIMARY KEY,
  uwi TEXT NOT NULL,
  well_name TEXT,
  operator TEXT,
  province TEXT,
  location TEXT,
  spud_date DATE,
  completion_date DATE,
  status TEXT DEFAULT 'active',
  metadata JSONB,
  user_id UUID NOT NULL
)
```

---

### US-016: UWI Cost Reporting

**As a** Finance Controller  
**I want to** generate cost reports by well/UWI  
**So that** I can report costs to partners and regulators

**Acceptance Criteria:**
- [ ] Report shows total spend per UWI
- [ ] Breakdown by cost category (service type)
- [ ] Breakdown by vendor
- [ ] Date range filtering
- [ ] Export to CSV/PDF
- [ ] Support joint venture allocation percentages

**Implementation Reference:**
```typescript
// src/components/reports/UWIReport.tsx
// src/hooks/useReports.tsx
```

---

## 6. Workflow Builder

### Epic: Configurable Business Process Automation

**Business Value:** Non-technical users can configure approval rules without developer involvement.

---

### US-017: Visual Workflow Builder

**As a** Finance Manager  
**I want to** create custom approval workflows using a visual builder  
**So that** I can adapt the system to our specific approval policies

**Acceptance Criteria:**
- [ ] Drag-and-drop workflow canvas
- [ ] Step types: Condition, Validation, Approval, Notification, Integration
- [ ] Connect steps with visual lines
- [ ] Configure step properties via side panel
- [ ] Save workflow to database
- [ ] Activate/deactivate workflows

**Implementation Reference:**
```typescript
// src/components/workflow/WorkflowBuilder.tsx
// src/hooks/useWorkflows.tsx - createWorkflow()
```

**Step Type Definitions:**
```typescript
interface WorkflowStep {
  id: string;
  type: 'validation' | 'approval' | 'notification' | 'integration' | 'condition';
  name: string;
  config: Record<string, any>;
  conditions?: WorkflowCondition[];
  position: { x: number; y: number };
  connections: string[];
  true_connection?: string;  // For condition steps
  false_connection?: string; // For condition steps
}

interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 
            'greater_or_equal' | 'less_or_equal' | 'contains' | 'in';
  value: any;
}
```

---

### US-018: Workflow Templates

**As a** New User  
**I want** pre-built workflow templates  
**So that** I can quickly set up common approval processes

**Acceptance Criteria:**
- [ ] Invoice Processing template (validate → approve → notify)
- [ ] Compliance Check template (compliance → audit)
- [ ] High-Value Approval template (validate → manager → CFO → notify)
- [ ] One-click template instantiation
- [ ] Templates are fully customizable after creation

**Implementation Reference:**
```typescript
// src/hooks/useWorkflows.tsx - getWorkflowTemplates()
// src/components/workflow/WorkflowTemplates.tsx
```

**Built-in Templates:**
```typescript
[
  {
    name: 'Invoice Processing',
    description: 'Standard invoice validation and approval workflow',
    workflow_type: 'invoice_processing',
    steps: [
      { type: 'validation', name: 'Validate Invoice', config: { rules: ['amount_check', 'vendor_check'] } },
      { type: 'approval', name: 'Approval Required', config: { threshold: 1000 } },
      { type: 'notification', name: 'Send Notification', config: { recipients: ['finance@company.com'] } }
    ]
  },
  {
    name: 'Compliance Check',
    description: 'Regulatory compliance verification workflow',
    workflow_type: 'compliance',
    steps: [
      { type: 'validation', name: 'Compliance Check', config: { regulations: ['SOX', 'GDPR'] } },
      { type: 'approval', name: 'Audit Review', config: { department: 'compliance' } }
    ]
  }
]
```

---

### US-019: Workflow Execution Engine

**As a** System  
**I want to** execute workflow steps in order with branching logic  
**So that** invoices flow through the correct approval path

**Acceptance Criteria:**
- [ ] Execute workflows via `workflow-execute` edge function
- [ ] Create workflow instance record tracking progress
- [ ] Evaluate condition steps with boolean logic
- [ ] Branch to true_connection or false_connection based on condition result
- [ ] Execute validation steps with configurable rules
- [ ] Pause at approval steps for human action
- [ ] Send notifications at notification steps
- [ ] Update instance status: running → completed/failed
- [ ] Log all step execution with results

**Implementation Reference:**
```typescript
// supabase/functions/workflow-execute/index.ts
// src/hooks/useWorkflows.tsx - startWorkflow()
```

**Execution Flow:**
```typescript
while (currentStep) {
  switch (currentStep.type) {
    case 'condition':
      const result = evaluateConditions(currentStep.conditions, entityData);
      nextStep = result ? currentStep.true_connection : currentStep.false_connection;
      break;
    case 'validation':
      const validationResult = await runValidation(currentStep.config, entityData);
      // Continue to next step
      break;
    case 'approval':
      // Update entity status to pending_approval
      // Continue to next step (approval happens asynchronously)
      break;
    case 'notification':
      // Send notification
      break;
    case 'integration':
      // Call external system
      break;
  }
  // Update workflow_instances.step_data with results
}
```

---

### US-020: Workflow Instance Monitoring

**As a** Finance Manager  
**I want to** see the status of all running workflows  
**So that** I can identify bottlenecks and stuck approvals

**Acceptance Criteria:**
- [ ] List all workflow instances with status
- [ ] Filter by: workflow type, status, date range
- [ ] View current step and step history
- [ ] See time spent at each step
- [ ] Manually advance stuck workflows
- [ ] Cancel/restart failed workflows

**Implementation Reference:**
```typescript
// src/hooks/useWorkflows.tsx - fetchInstances()
// Database: workflow_instances table
```

**Database Schema Used:**
```sql
workflow_instances (
  id UUID PRIMARY KEY,
  workflow_id UUID REFERENCES workflows(id),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  status TEXT DEFAULT 'running',
  current_step INTEGER DEFAULT 0,
  step_data JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  user_id UUID NOT NULL
)
```

---

## 7. Bulk Operations

### Epic: High-Volume Processing Efficiency

**Business Value:** Process 50-100 invoices simultaneously instead of one-by-one.

---

### US-021: Bulk Invoice Selection

**As an** AP Clerk  
**I want to** select multiple invoices at once  
**So that** I can perform batch operations efficiently

**Acceptance Criteria:**
- [ ] Checkbox on each invoice row
- [ ] "Select All" checkbox in header
- [ ] Selected count displayed
- [ ] Selection persists while scrolling (virtualized list)
- [ ] Clear selection with one click

**Implementation Reference:**
```typescript
// src/components/invoices/InvoiceList.tsx - selection state
// src/hooks/useBulkActions.tsx
```

---

### US-022: Bulk Actions Toolbar

**As an** AP Clerk  
**I want** a floating toolbar that appears when invoices are selected  
**So that** I can quickly perform batch operations

**Acceptance Criteria:**
- [ ] Toolbar appears when ≥1 invoice selected
- [ ] Actions: Bulk Approve, Bulk Reject, Bulk Delete, Export CSV, Send to Vendor
- [ ] Confirmation dialog for destructive actions
- [ ] Progress indicator during bulk operation
- [ ] Success/failure summary after completion

**Implementation Reference:**
```typescript
// src/components/invoices/BulkActionsToolbar.tsx
// src/hooks/useBulkActions.tsx - bulkApprove(), bulkReject(), bulkDelete(), exportSelected()
```

---

## 8. Notifications and Alerts

### Epic: Proactive Communication

**Business Value:** Ensure stakeholders are informed without checking the system constantly.

---

### US-023: In-App Notifications

**As a** User  
**I want to** receive in-app notifications for important events  
**So that** I'm aware of items requiring my attention

**Acceptance Criteria:**
- [ ] Notification bell with unread count badge
- [ ] Dropdown shows recent notifications
- [ ] Mark as read on click
- [ ] Mark all as read option
- [ ] Notification categories: system, approval, alert
- [ ] Priority levels: low, medium, high, critical

**Implementation Reference:**
```typescript
// src/components/dashboard/NotificationBell.tsx
// src/hooks/useNotifications.tsx
```

**Database Schema Used:**
```sql
notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  category TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  link_url TEXT,
  link_text TEXT,
  expires_at TIMESTAMPTZ,
  metadata JSONB
)
```

---

### US-024: Notification Preferences

**As a** User  
**I want to** configure my notification preferences  
**So that** I only receive alerts I care about

**Acceptance Criteria:**
- [ ] Toggle email notifications on/off
- [ ] Toggle in-app notifications by category
- [ ] Configure which events trigger notifications
- [ ] Set quiet hours (no notifications during certain times)
- [ ] Preferences saved per user

**Implementation Reference:**
```typescript
// src/components/dashboard/NotificationPreferencesDialog.tsx
// src/hooks/useNotifications.tsx
```

**Database Schema Used:**
```sql
notification_preferences (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email_notifications BOOLEAN DEFAULT true,
  system_notifications BOOLEAN DEFAULT true,
  feature_updates BOOLEAN DEFAULT true,
  tips BOOLEAN DEFAULT true,
  help_articles BOOLEAN DEFAULT true
)
```

---

## 9. Security and Compliance

### Epic: Enterprise-Grade Security

**Business Value:** Meet SOC 2, PIPEDA, and industry security requirements.

---

### US-025: Role-Based Access Control

**As an** Admin  
**I want to** assign roles to users that control their access  
**So that** users only see and do what they're authorized for

**Acceptance Criteria:**
- [ ] Roles: admin, operator, viewer
- [ ] Admin: full access to all features
- [ ] Operator: can create, edit, approve (within limits)
- [ ] Viewer: read-only access
- [ ] Role assignment via admin interface
- [ ] Role checked on every protected action

**Implementation Reference:**
```typescript
// src/hooks/useAuth.tsx - hasRole()
// Database: user_roles table, get_current_user_role() function
```

**Database Schema Used:**
```sql
user_roles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL, -- 'admin' | 'operator' | 'viewer'
  assigned_at TIMESTAMPTZ,
  assigned_by UUID
)

-- Database function
CREATE FUNCTION get_current_user_role() RETURNS app_role
```

---

### US-026: Comprehensive Audit Logging

**As a** Compliance Officer  
**I want** all sensitive actions logged with full context  
**So that** we have an audit trail for regulatory compliance

**Acceptance Criteria:**
- [ ] Log all CRUD operations on sensitive tables
- [ ] Capture: user, timestamp, action, old value, new value
- [ ] Log authentication events (login, logout, failed login)
- [ ] Log approval/rejection actions
- [ ] Log data exports and bulk operations
- [ ] Logs immutable (no delete capability)
- [ ] Logs retained per PIPEDA requirements

**Implementation Reference:**
```typescript
// Database: activities table, security_events table
// Database functions: audit_vendor_access(), log_admin_pii_access()
```

**Database Schema Used:**
```sql
activities (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  description TEXT NOT NULL,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT
)

security_events (
  id UUID PRIMARY KEY,
  event_type TEXT NOT NULL,
  action TEXT NOT NULL,
  severity TEXT NOT NULL,
  user_id UUID,
  resource_type TEXT,
  resource_id TEXT,
  ip_address INET,
  user_agent TEXT,
  message TEXT,
  metadata JSONB,
  status TEXT
)
```

---

### US-027: Session Security

**As a** Security Officer  
**I want** sessions validated with anomaly detection  
**So that** compromised sessions are detected and terminated

**Acceptance Criteria:**
- [ ] Track session with device fingerprint
- [ ] Log session creation with IP, user agent
- [ ] Detect IP address changes during session
- [ ] Detect user agent changes during session
- [ ] Terminate suspicious sessions
- [ ] Idle timeout after 60 minutes
- [ ] Maximum session duration limit

**Implementation Reference:**
```typescript
// Database functions: validate_session_integrity(), validate_session_security()
// src/hooks/useAuth.tsx - session validation
```

---

## 10. Integrations

### Epic: ERP and External System Connectivity

**Business Value:** Bi-directional data sync eliminates double-entry.

---

### US-028: Integration Configuration

**As an** Admin  
**I want to** configure integrations with external systems  
**So that** data flows automatically between FLOWBills and our ERP

**Acceptance Criteria:**
- [ ] Add integration with: name, type, credentials
- [ ] Integration types: SAP, Oracle, QuickBooks, Sage, Custom API
- [ ] Test connection before saving
- [ ] Track sync status and last sync time
- [ ] Enable/disable integrations
- [ ] View sync history and errors

**Implementation Reference:**
```typescript
// src/hooks/useIntegrations.tsx
// src/components/integrations/IntegrationManager.tsx
// src/components/integrations/CreateIntegrationDialog.tsx
```

**Database Schema Used:**
```sql
integration_status (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  integration_name TEXT NOT NULL,
  integration_type TEXT NOT NULL,
  status TEXT DEFAULT 'inactive',
  config JSONB,
  last_sync_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,
  sync_count INTEGER DEFAULT 0,
  error_message TEXT
)
```

---

### US-029: E-Invoicing (Peppol/EN 16931)

**As a** Finance Director  
**I want to** send and receive e-invoices via Peppol network  
**So that** we comply with emerging e-invoicing mandates

**Acceptance Criteria:**
- [ ] Validate invoices against EN 16931 schema
- [ ] Send invoices to Peppol Access Point
- [ ] Receive invoices from Peppol network
- [ ] Support UBL 2.1 and CII D16B formats
- [ ] Country-specific adapters (Spain VeriFACTU, Poland KSeF)
- [ ] Track e-invoice status: sent, delivered, rejected

**Implementation Reference:**
```typescript
// supabase/functions/einvoice_validate/index.ts
// supabase/functions/einvoice_send/index.ts
// supabase/functions/einvoice_receive/index.ts
// supabase/functions/adapters/es-verifactu/index.ts
// supabase/functions/adapters/pl-ksef/index.ts
```

---

## Appendix: User Story Cross-Reference Matrix

| Story ID | Epic | Database Tables | Edge Functions | UI Components |
|----------|------|-----------------|----------------|---------------|
| US-001 | Invoice Processing | invoices | invoice-intake | FileUploadZone |
| US-002 | Invoice Processing | invoice_extractions, invoice_line_items | ocr-extract, invoice-extract | ExtractionResultsPanel |
| US-003 | Invoice Processing | invoices | duplicate-check | — |
| US-004 | Invoice Processing | review_queue, invoices | hil-router | ApprovalQueue |
| US-005 | Invoice Processing | approvals, invoices | workflow-execute, policy-engine | WorkflowPipeline |
| US-006 | Invoice Processing | review_queue, approvals | — | ApprovalQueue |
| US-007 | Three-Way Matching | invoices, afes, field_tickets | — | ThreeWayMatchingInterface |
| US-008 | Three-Way Matching | invoices, approvals | — | ThreeWayMatchingInterface |
| US-009 | AFE Management | afes | — | AFEManager, CreateAFEDialog |
| US-010 | AFE Management | budget_alert_rules, budget_alert_logs | budget-alert-check | BudgetAlertRulesManager |
| US-011 | AFE Management | afes, invoice_extractions | workflow-execute | — |
| US-012 | Field Tickets | field_tickets | — | FieldTicketManager |
| US-013 | Field Tickets | field_tickets | — | VerifyFieldTicketDialog |
| US-014 | Field Tickets | field_tickets, invoice_extractions | invoice-extract | — |
| US-015 | UWI Registry | uwis | — | UWIRegistry, CreateUWIDialog |
| US-016 | UWI Registry | uwis, invoices, field_tickets | — | UWIReport |
| US-017 | Workflow Builder | workflows | — | WorkflowBuilder |
| US-018 | Workflow Builder | workflows | — | WorkflowTemplates |
| US-019 | Workflow Builder | workflow_instances | workflow-execute | — |
| US-020 | Workflow Builder | workflow_instances | — | WorkflowList |
| US-021 | Bulk Operations | invoices | — | InvoiceList |
| US-022 | Bulk Operations | invoices, approvals | — | BulkActionsToolbar |
| US-023 | Notifications | notifications | — | NotificationBell |
| US-024 | Notifications | notification_preferences | — | NotificationPreferencesDialog |
| US-025 | Security | user_roles | — | ProtectedRoute |
| US-026 | Security | activities, security_events | — | — |
| US-027 | Security | user_sessions, security_events | — | — |
| US-028 | Integrations | integration_status | — | IntegrationManager |
| US-029 | Integrations | — | einvoice_* | CountryPacksManager |

---

*This document reflects the actual implementation of FLOWBills.ca as of December 2025. All user stories are traceable to code, database schemas, and edge functions.*
