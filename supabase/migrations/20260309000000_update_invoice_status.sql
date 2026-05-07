-- Add new statuses to the invoice_status enum if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'invoice_status' AND e.enumlabel = 'validated') THEN
        ALTER TYPE public.invoice_status ADD VALUE 'validated';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'invoice_status' AND e.enumlabel = 'approved_auto') THEN
        ALTER TYPE public.invoice_status ADD VALUE 'approved_auto';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'invoice_status' AND e.enumlabel = 'needs_review') THEN
        ALTER TYPE public.invoice_status ADD VALUE 'needs_review';
    END IF;
END
$$;
