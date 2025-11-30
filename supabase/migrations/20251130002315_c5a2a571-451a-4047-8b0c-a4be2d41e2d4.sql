-- ====================================================================
-- PRODUCTION READINESS: Missing Critical Database Components
-- ====================================================================
-- This migration adds all missing tables and columns required for
-- the end-to-end invoice processing workflow to function.
-- ====================================================================

-- Add missing columns to existing tables
-- ====================================================================

-- Ensure invoices.duplicate_hash exists (for duplicate detection)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'invoices' 
    AND column_name = 'duplicate_hash'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN duplicate_hash TEXT;
    CREATE INDEX IF NOT EXISTS idx_invoices_duplicate_hash ON public.invoices(duplicate_hash);
  END IF;
END $$;

-- Ensure invoices.file_name exists  
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'invoices' 
    AND column_name = 'file_name'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN file_name TEXT;
  END IF;
END $$;

-- Ensure invoices.file_url exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'invoices' 
    AND column_name = 'file_url'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN file_url TEXT;
  END IF;
END $$;

-- Add confidence_score to review_queue if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'review_queue' 
    AND column_name = 'confidence_score'
  ) THEN
    ALTER TABLE public.review_queue ADD COLUMN confidence_score NUMERIC;
  END IF;
END $$;

-- Add risk_factors to review_queue if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'review_queue' 
    AND column_name = 'risk_factors'
  ) THEN
    ALTER TABLE public.review_queue ADD COLUMN risk_factors JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add review_decision to review_queue if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'review_queue' 
    AND column_name = 'review_decision'
  ) THEN
    ALTER TABLE public.review_queue ADD COLUMN review_decision TEXT;
  END IF;
END $$;

-- Add review_notes to review_queue if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'review_queue' 
    AND column_name = 'review_notes'
  ) THEN
    ALTER TABLE public.review_queue ADD COLUMN review_notes TEXT;
  END IF;
END $$;

-- Add reviewed_by to review_queue if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'review_queue' 
    AND column_name = 'reviewed_by'
  ) THEN
    ALTER TABLE public.review_queue ADD COLUMN reviewed_by UUID;
  END IF;
END $$;

-- Add reviewed_at to review_queue if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'review_queue' 
    AND column_name = 'reviewed_at'
  ) THEN
    ALTER TABLE public.review_queue ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add amount_approved to approvals if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'approvals' 
    AND column_name = 'amount_approved'
  ) THEN
    ALTER TABLE public.approvals ADD COLUMN amount_approved NUMERIC;
  END IF;
END $$;

-- Add comments to approvals if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'approvals' 
    AND column_name = 'comments'
  ) THEN
    ALTER TABLE public.approvals ADD COLUMN comments TEXT;
  END IF;
END $$;

-- Add auto_approved to approvals if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'approvals' 
    AND column_name = 'auto_approved'
  ) THEN
    ALTER TABLE public.approvals ADD COLUMN auto_approved BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create invoice_line_items table for detailed line item tracking
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.invoice_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  line_number INTEGER NOT NULL,
  description TEXT,
  quantity NUMERIC,
  unit_price NUMERIC,
  amount NUMERIC NOT NULL,
  service_code TEXT,
  afe_id UUID REFERENCES public.afes(id),
  uwi_id UUID REFERENCES public.uwis(id),
  field_ticket_id UUID REFERENCES public.field_tickets(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on invoice_line_items
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoice_line_items
CREATE POLICY "Users can view own invoice line items" ON public.invoice_line_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own invoice line items" ON public.invoice_line_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invoice line items" ON public.invoice_line_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own invoice line items" ON public.invoice_line_items
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id ON public.invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_afe_id ON public.invoice_line_items(afe_id);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_uwi_id ON public.invoice_line_items(uwi_id);

-- Add updated_at trigger for invoice_line_items
CREATE TRIGGER update_invoice_line_items_updated_at
  BEFORE UPDATE ON public.invoice_line_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically generate duplicate hash
-- ====================================================================
CREATE OR REPLACE FUNCTION public.generate_duplicate_hash()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate SHA-256 hash based on vendor, amount, date, and PO
  NEW.duplicate_hash := encode(
    digest(
      COALESCE(NEW.vendor_name, '') || '|' ||
      COALESCE(NEW.invoice_number, '') || '|' ||
      COALESCE(NEW.invoice_date::text, '') || '|' ||
      COALESCE(NEW.amount::text, ''),
      'sha256'
    ),
    'hex'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-generate duplicate hash on invoice insert/update
DROP TRIGGER IF EXISTS trigger_generate_duplicate_hash ON public.invoices;
CREATE TRIGGER trigger_generate_duplicate_hash
  BEFORE INSERT OR UPDATE OF vendor_name, invoice_number, invoice_date, amount
  ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_duplicate_hash();

-- Database function to orchestrate invoice intake workflow
-- ====================================================================
CREATE OR REPLACE FUNCTION public.process_invoice_intake(
  p_invoice_id UUID,
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_invoice RECORD;
  v_duplicate_count INTEGER;
  v_requires_review BOOLEAN := false;
  v_review_reason TEXT;
  v_approval_threshold_manager NUMERIC := 5000.00;
  v_approval_threshold_cfo NUMERIC := 25000.00;
  v_result JSONB;
BEGIN
  -- Fetch invoice
  SELECT * INTO v_invoice FROM public.invoices WHERE id = p_invoice_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  -- Check for duplicates using hash
  SELECT COUNT(*) INTO v_duplicate_count
  FROM public.invoices
  WHERE duplicate_hash = v_invoice.duplicate_hash
    AND id != p_invoice_id
    AND user_id = p_user_id;

  -- If duplicate found, add to review queue
  IF v_duplicate_count > 0 THEN
    v_requires_review := true;
    v_review_reason := 'Suspected duplicate invoice detected';
    
    -- Update invoice status
    UPDATE public.invoices 
    SET status = 'duplicate_suspected'
    WHERE id = p_invoice_id;
    
    -- Add to review queue
    INSERT INTO public.review_queue (
      invoice_id,
      user_id,
      reason,
      confidence_score,
      risk_factors
    ) VALUES (
      p_invoice_id,
      p_user_id,
      v_review_reason,
      0,
      jsonb_build_array('duplicate_detected')
    );
    
  ELSE
    -- Determine approval routing based on amount
    IF v_invoice.amount < v_approval_threshold_manager THEN
      -- Auto-approve small invoices (< $5,000)
      UPDATE public.invoices 
      SET status = 'approved_auto'
      WHERE id = p_invoice_id;
      
      -- Create auto-approval record
      INSERT INTO public.approvals (
        invoice_id,
        user_id,
        approval_status,
        amount_approved,
        approval_date,
        comments,
        auto_approved
      ) VALUES (
        p_invoice_id,
        p_user_id,
        'approved',
        v_invoice.amount,
        now(),
        'Auto-approved: amount under threshold',
        true
      );
      
    ELSIF v_invoice.amount < v_approval_threshold_cfo THEN
      -- Requires manager approval ($5,000 - $25,000)
      UPDATE public.invoices 
      SET status = 'pending_approval'
      WHERE id = p_invoice_id;
      
      INSERT INTO public.approvals (
        invoice_id,
        user_id,
        approval_status,
        approval_method,
        notes
      ) VALUES (
        p_invoice_id,
        p_user_id,
        'pending',
        'manager_approval',
        'Requires manager approval: $5K-$25K range'
      );
      
    ELSE
      -- Requires CFO approval (> $25,000)
      UPDATE public.invoices 
      SET status = 'pending_approval'
      WHERE id = p_invoice_id;
      
      INSERT INTO public.approvals (
        invoice_id,
        user_id,
        approval_status,
        approval_method,
        notes
      ) VALUES (
        p_invoice_id,
        p_user_id,
        'pending',
        'cfo_approval',
        'Requires CFO approval: amount exceeds $25K'
      );
    END IF;
  END IF;

  -- Return result
  v_result := jsonb_build_object(
    'invoice_id', p_invoice_id,
    'duplicate_detected', v_duplicate_count > 0,
    'duplicate_count', v_duplicate_count,
    'requires_review', v_requires_review,
    'review_reason', v_review_reason,
    'status', (SELECT status FROM public.invoices WHERE id = p_invoice_id)
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;