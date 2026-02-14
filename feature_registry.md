# Feature Registry

| Feature Name | Location | Status | Notes |
|--------------|----------|--------|-------|
| **Authentication** | | | |
| Auth Flow | `src/pages/Auth.tsx` | ✅ Pass | Refactored for better error handling. Weak password protection missing in Prod. |
| Session Management | `src/hooks/useAuth.tsx` | ✅ Pass | robust state management. |
| Role-Based Access | `src/components/auth/ProtectedRoute.tsx` | ✅ Pass | |
| **Invoicing** | | | |
| Invoice Dashboard | `src/pages/Invoices.tsx` | ✅ Pass | Fixed binary file upload bug. |
| Invoice Intake (Orchestrator) | `supabase/functions/invoice-intake` | ✅ Pass | Refactored with Zod validation. |
| Invoice Extraction (AI) | `supabase/functions/invoice-extract` | ✅ Pass | Refactored with Zod validation. |
| OCR Extraction | `supabase/functions/ocr-extract` | ✅ Pass | Refactored with Zod validation. |
| Fraud Detection | `supabase/functions/fraud_detect` | ✅ Pass | High quality code with Zod. |
| Invoice List | `src/components/invoices/InvoiceList.tsx` | ✅ Pass | |
| Edit Invoice Dialog | `src/components/invoices/EditInvoiceDialog.tsx` | ✅ Pass | Uses Zod & React Hook Form. |
| **E-Invoicing (Peppol)** | | | |
| Send Invoice | `supabase/functions/einvoice_send` | ✅ Pass | Uses Zod validation. |
| Receive Invoice | `supabase/functions/einvoice_receive` | ✅ Pass | Uses Zod validation. |
| Validate Invoice | `supabase/functions/einvoice_validate` | ✅ Pass | Uses Zod validation. |
| **Workflows & Automation** | | | |
| Workflow Execution | `supabase/functions/workflow-execute` | ✅ Pass | Refactored with Zod validation. |
| Stripe Webhook | `supabase/functions/stripe-webhook` | ✅ Pass | Robust signature verification. |
| **Admin & Compliance** | | | |
| User Role Management | `src/pages/UserRoleManagement.tsx` | ⚠️ Audit Needed | Not deep-dived yet. |
| Security Headers | `src/components/security/SecurityHeaders.tsx` | ✅ Pass | CSP configured. |
| **DevOps & Infrastructure** | | | |
| CI/CD Pipeline | `.github/workflows/ci.yml` | ✅ Pass | Fixed duplicate permissions syntax error. |
