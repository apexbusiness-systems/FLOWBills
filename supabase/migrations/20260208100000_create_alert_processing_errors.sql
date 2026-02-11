-- Create alert_processing_errors table for audit trail
CREATE TABLE IF NOT EXISTS public.alert_processing_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID,
  rule_id UUID REFERENCES public.budget_alert_rules(id) ON DELETE SET NULL,
  afe_id UUID REFERENCES public.afes(id) ON DELETE SET NULL,
  user_id UUID,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alert_processing_errors ENABLE ROW LEVEL SECURITY;

-- RLS Policies (System/Admin access only mainly, but users might need to see their own errors?)
-- Assuming system insert, admin view.

CREATE POLICY "System can insert alert processing errors"
  ON public.alert_processing_errors
  FOR INSERT
  WITH CHECK (true); -- Edge functions use service role

CREATE POLICY "Admins can view alert processing errors"
  ON public.alert_processing_errors
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Index for faster lookups
CREATE INDEX idx_alert_processing_errors_batch_id ON public.alert_processing_errors(batch_id);
CREATE INDEX idx_alert_processing_errors_created_at ON public.alert_processing_errors(created_at DESC);
