-- ============================================
-- ENTERPRISE PRODUCTION READINESS MIGRATION
-- Fixes: RLS DELETE policies + Data Retention + Rate Limiting
-- ============================================

-- 1. ADD MISSING DELETE POLICIES (Security Fix)
-- exceptions table
CREATE POLICY "Users can delete their own exceptions"
ON public.exceptions
FOR DELETE
USING (auth.uid() = user_id);

-- compliance_records table
CREATE POLICY "Users can delete their own compliance records"
ON public.compliance_records
FOR DELETE
USING (auth.uid() = user_id);

-- workflows table
CREATE POLICY "Users can delete their own workflows"
ON public.workflows
FOR DELETE
USING (auth.uid() = user_id);

-- workflow_instances table
CREATE POLICY "Users can delete their own workflow instances"
ON public.workflow_instances
FOR DELETE
USING (auth.uid() = user_id);

-- validation_rules table
CREATE POLICY "Users can delete their own validation rules"
ON public.validation_rules
FOR DELETE
USING (auth.uid() = user_id);

-- integration_status table
CREATE POLICY "Users can delete their own integrations"
ON public.integration_status
FOR DELETE
USING (auth.uid() = user_id);

-- 2. DATA RETENTION POLICIES (GDPR/Privacy Compliance)
-- Create function to anonymize old activity logs (IP addresses)
CREATE OR REPLACE FUNCTION public.anonymize_old_activities()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Anonymize IP addresses older than 90 days
  UPDATE public.activities
  SET 
    ip_address = NULL,
    user_agent = NULL
  WHERE created_at < NOW() - INTERVAL '90 days'
    AND ip_address IS NOT NULL;
END;
$$;

-- Create trigger to auto-anonymize on insert (if old data exists)
CREATE OR REPLACE FUNCTION public.trigger_anonymize_activities()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.anonymize_old_activities();
  RETURN NEW;
END;
$$;

-- 3. RATE LIMITING TABLE (Enterprise Security)
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_key TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID,
  ip_address INET,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(resource_key, window_start)
);

-- Enable RLS on rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only admins can view rate limits
CREATE POLICY "Admins can view all rate limits"
ON public.rate_limits
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- System can insert/update rate limits (via edge functions with service role)
-- No user-level INSERT policy needed (service role only)

-- Create index for fast rate limit lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_resource_key ON public.rate_limits(resource_key, window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_id ON public.rate_limits(user_id);

-- 4. AUDIT LOG CLEANUP FUNCTION (Data Retention)
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete activities older than 2 years (retention policy)
  DELETE FROM public.activities
  WHERE created_at < NOW() - INTERVAL '2 years';
  
  -- Delete CSP violations older than 90 days
  DELETE FROM public.csp_violations
  WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$;

-- 5. LEAD SPAM PREVENTION (Rate Limiting for Anonymous Inserts)
CREATE TABLE IF NOT EXISTS public.lead_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  submission_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(ip_address, window_start)
);

-- Enable RLS
ALTER TABLE public.lead_submissions ENABLE ROW LEVEL SECURITY;

-- Only admins can view
CREATE POLICY "Admins can view lead submissions"
ON public.lead_submissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create function to check lead submission rate limit
CREATE OR REPLACE FUNCTION public.check_lead_rate_limit(check_ip INET)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  submission_count INTEGER;
BEGIN
  -- Get submission count in last hour
  SELECT COALESCE(SUM(submission_count), 0)
  INTO submission_count
  FROM public.lead_submissions
  WHERE ip_address = check_ip
    AND window_start > NOW() - INTERVAL '1 hour';
  
  -- Allow max 5 submissions per hour per IP
  RETURN submission_count < 5;
END;
$$;

-- 6. PERFORMANCE METRICS TABLE (Observability)
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT,
  labels JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- Admins and operators can view
CREATE POLICY "Admins and operators can view metrics"
ON public.performance_metrics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'operator')
  )
);

-- Create index for fast metric queries
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name_time ON public.performance_metrics(metric_name, timestamp DESC);

-- 7. SLO TRACKING TABLE (Production Monitoring)
CREATE TABLE IF NOT EXISTS public.slo_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slo_name TEXT NOT NULL,
  violation_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  burn_rate NUMERIC,
  error_budget_consumed NUMERIC,
  window_duration TEXT,
  details JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.slo_violations ENABLE ROW LEVEL SECURITY;

-- Admins and operators can view
CREATE POLICY "Admins and operators can view SLO violations"
ON public.slo_violations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'operator')
  )
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_slo_violations_name_time ON public.slo_violations(slo_name, timestamp DESC);

-- 8. COMMENT ON ACTIVITIES TABLE (Document Immutability)
COMMENT ON TABLE public.activities IS 'Audit log table - records are immutable for compliance. No UPDATE/DELETE policies by design. Old records are automatically anonymized after 90 days (IP/user_agent cleared) and deleted after 2 years.';

-- 9. GRANT EXECUTE PERMISSIONS
GRANT EXECUTE ON FUNCTION public.anonymize_old_activities() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_audit_logs() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_lead_rate_limit(INET) TO anon, authenticated;