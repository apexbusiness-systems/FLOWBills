-- Create table for CSP violation reports
CREATE TABLE IF NOT EXISTS public.csp_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocked_uri TEXT,
  violated_directive TEXT,
  original_policy TEXT,
  disposition TEXT,
  document_uri TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.csp_violations ENABLE ROW LEVEL SECURITY;

-- Only admins can view CSP violations
CREATE POLICY "Admins can view all CSP violations"
  ON public.csp_violations
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow anonymous insertions (violations can come from unauthenticated users)
CREATE POLICY "Allow anonymous CSP violation reports"
  ON public.csp_violations
  FOR INSERT
  WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_csp_violations_timestamp ON public.csp_violations(timestamp DESC);
CREATE INDEX idx_csp_violations_violated_directive ON public.csp_violations(violated_directive);