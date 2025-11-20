-- Keyset pagination and tenancy-aware index improvements
CREATE INDEX IF NOT EXISTS idx_invoices_status_created_id ON public.invoices(status, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created_id ON public.audit_logs(user_id, created_at DESC, id DESC);
