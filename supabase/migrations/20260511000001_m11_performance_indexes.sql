-- ============================================================
-- M-11: Performance indexes for O&G invoice processing hot paths
-- Date: 2026-05-11
-- All indexes use IF NOT EXISTS for idempotent re-application
-- NOTE: No CONCURRENTLY — migrations run inside transactions
-- ============================================================

-- pg_trgm for fuzzy vendor name search (SmartSearch)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- AFE number lookup (used in every invoice-extract validation call)
CREATE INDEX IF NOT EXISTS idx_afes_afe_number
  ON public.afes (afe_number);

-- Active AFE composite: hot path WHERE user_id=? AND afe_number=? AND status='active'
CREATE INDEX IF NOT EXISTS idx_afes_user_status_number
  ON public.afes (user_id, status, afe_number);

-- UWI well identifier lookup
CREATE INDEX IF NOT EXISTS idx_uwis_uwi
  ON public.uwis (uwi);

-- UWI user + identifier composite for extraction cross-reference
CREATE INDEX IF NOT EXISTS idx_uwis_user_uwi
  ON public.uwis (user_id, uwi);

-- Invoice extractions: FK join path from invoice_id
CREATE INDEX IF NOT EXISTS idx_invoice_extractions_invoice_id
  ON public.invoice_extractions (invoice_id);

-- Invoice extractions: user status summary for dashboard
CREATE INDEX IF NOT EXISTS idx_invoice_extractions_user_status
  ON public.invoice_extractions (user_id, extraction_status);

-- Review queue: partial index for pending items only
-- Covers core query: WHERE user_id=? AND reviewed_at IS NULL ORDER BY priority ASC, created_at ASC
CREATE INDEX IF NOT EXISTS idx_review_queue_pending
  ON public.review_queue (user_id, priority ASC, created_at ASC)
  WHERE reviewed_at IS NULL;

-- Invoices: trigram GIN index for fuzzy SmartSearch on vendor names
CREATE INDEX IF NOT EXISTS idx_invoices_vendor_trgm
  ON public.invoices USING gin (vendor_name gin_trgm_ops);

-- Invoices: user + invoice_number composite for filtered lookups
CREATE INDEX IF NOT EXISTS idx_invoices_user_invoice_number
  ON public.invoices (user_id, invoice_number);

-- Activities: user feed ordered by recency (audit trail)
CREATE INDEX IF NOT EXISTS idx_activities_user_created_desc
  ON public.activities (user_id, created_at DESC);
