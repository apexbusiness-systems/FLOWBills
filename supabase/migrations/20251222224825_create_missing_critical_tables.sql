-- Create missing critical tables for production readiness
-- Based on audit findings: review_queue, approvals, security_events tables are missing

-- Create review_queue table
CREATE TABLE public.review_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  priority INTEGER NOT NULL DEFAULT 3,
  reason TEXT NOT NULL,
  confidence_score NUMERIC,
  flagged_fields TEXT[],
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_decision TEXT,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on review_queue
ALTER TABLE public.review_queue ENABLE ROW LEVEL SECURITY;

-- RLS policies for review_queue
CREATE POLICY "Users can view own review queue items"
  ON public.review_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert review queue items"
  ON public.review_queue FOR INSERT
  WITH CHECK (true);  -- Edge functions use service role

CREATE POLICY "Users can update own review queue items"
  ON public.review_queue FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = reviewed_by);

-- Create approvals table
CREATE TABLE public.approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  amount_approved NUMERIC,
  approval_date TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  comments TEXT,
  auto_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on approvals
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;

-- RLS policies for approvals
CREATE POLICY "Users can view own approval records"
  ON public.approvals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create approval records"
  ON public.approvals FOR INSERT
  WITH CHECK (true);  -- Edge functions use service role

CREATE POLICY "Approvers can update approval records"
  ON public.approvals FOR UPDATE
  USING (auth.uid() = approved_by OR auth.uid() = user_id);

-- Create security_events table
CREATE TABLE public.security_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  user_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on security_events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for security_events (admin-only access)
CREATE POLICY "Only admins can view security events"
  ON public.security_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "System can log security events"
  ON public.security_events FOR INSERT
  WITH CHECK (true);  -- Edge functions use service role

-- Add duplicate_hash column to invoices table
ALTER TABLE public.invoices
  ADD COLUMN duplicate_hash TEXT;

-- Create index for fast duplicate lookups
CREATE INDEX idx_invoices_duplicate_hash
  ON public.invoices(duplicate_hash);

-- Add updated_at triggers for new tables
CREATE TRIGGER update_review_queue_updated_at
  BEFORE UPDATE ON public.review_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_approvals_updated_at
  BEFORE UPDATE ON public.approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update duplicate hash on insert/update
CREATE OR REPLACE FUNCTION public.update_invoice_duplicate_hash()
RETURNS TRIGGER AS $$
DECLARE
  hash_string TEXT;
  hash_bytes BYTEA;
BEGIN
  -- Generate hash from vendor, amount, date, and PO
  hash_string := COALESCE(NEW.vendor_name, '') || '-' ||
                 COALESCE(NEW.amount::TEXT, '') || '-' ||
                 COALESCE(NEW.invoice_date::TEXT, '') || '-' ||
                 COALESCE(NEW.notes, 'no-notes');

  -- Generate SHA-256 hash
  hash_bytes := digest(hash_string, 'sha256');
  NEW.duplicate_hash := encode(hash_bytes, 'hex');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for duplicate hash
CREATE TRIGGER trigger_update_invoice_duplicate_hash
  BEFORE INSERT OR UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_invoice_duplicate_hash();

-- Create function to auto-start default workflow
CREATE OR REPLACE FUNCTION public.auto_start_invoice_workflow()
RETURNS TRIGGER AS $$
DECLARE
  default_workflow_id UUID;
BEGIN
  -- Find active default invoice workflow
  SELECT id INTO default_workflow_id
  FROM public.workflows
  WHERE user_id = NEW.user_id
    AND workflow_type = 'invoice_processing'
    AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  -- If default workflow exists, create instance
  IF default_workflow_id IS NOT NULL THEN
    INSERT INTO public.workflow_instances (
      user_id,
      workflow_id,
      entity_type,
      entity_id,
      status,
      current_step
    ) VALUES (
      NEW.user_id,
      default_workflow_id,
      'invoice',
      NEW.id,
      'pending',
      0
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-starting workflows
CREATE TRIGGER trigger_auto_start_invoice_workflow
  AFTER INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_start_invoice_workflow();
