# Feature Registry

| Feature Name | Location | Status | Notes |
|--------------|----------|--------|-------|
| **Authentication** | | | |
| Auth Flow | `src/pages/Auth.tsx` | ✅ Pass | Refactored for better error handling. Weak password protection missing in Prod. |
| Session Management | `src/hooks/useAuth.tsx` | ✅ Pass | robust state management. |
| Role-Based Access | `src/components/auth/ProtectedRoute.tsx` | ✅ Pass | |
| **Invoicing** | | | |
| Invoice Dashboard | `src/pages/Invoices.tsx` | ✅ Pass | Fixed binary file upload bug. |
| Invoice Extraction (AI) | `supabase/functions/invoice-extract` | ✅ Pass | Refactored with Zod validation. |
| OCR Extraction | `supabase/functions/ocr-extract` | ✅ Pass | Refactored with Zod validation. |
| Invoice List | `src/components/invoices/InvoiceList.tsx` | ✅ Pass | |
| **E-Invoicing (Peppol)** | | | |
| Send Invoice | `supabase/functions/einvoice_send` | ✅ Pass | Uses Zod validation. |
| Receive Invoice | `supabase/functions/einvoice_receive` | ✅ Pass | Uses Zod validation. |
| Validate Invoice | `supabase/functions/einvoice_validate` | ✅ Pass | Uses Zod validation. |
| **Admin & Compliance** | | | |
| User Role Management | `src/pages/UserRoleManagement.tsx` | ⚠️ Audit Needed | Not deep-dived yet. |
| Security Headers | `src/components/security/SecurityHeaders.tsx` | ✅ Pass | CSP configured. |
