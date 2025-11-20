-- P4: Strengthen idempotency keys with tenant scope and response metadata

-- Drop the legacy unique constraint to allow scoped uniqueness
ALTER TABLE IF EXISTS public.idempotency_keys
  DROP CONSTRAINT IF EXISTS idempotency_keys_idempotency_key_key;

-- Add new columns for tenant scoping and metadata
ALTER TABLE IF EXISTS public.idempotency_keys
  ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS response_headers JSONB,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Ensure updated_at stays fresh
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_idempotency_keys_updated_at'
  ) THEN
    CREATE TRIGGER update_idempotency_keys_updated_at
      BEFORE UPDATE ON public.idempotency_keys
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Enforce scoped uniqueness
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'idempotency_keys_scope_key'
  ) THEN
    ALTER TABLE public.idempotency_keys
      ADD CONSTRAINT idempotency_keys_scope_key UNIQUE (tenant_id, scope, idempotency_key);
  END IF;
END $$;

-- Index for fast lookups by tenant/scope/key and cleanup
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_scope_lookup
  ON public.idempotency_keys(tenant_id, scope, idempotency_key);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_tenant_status
  ON public.idempotency_keys(tenant_id, scope, status);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires_new
  ON public.idempotency_keys(expires_at);
