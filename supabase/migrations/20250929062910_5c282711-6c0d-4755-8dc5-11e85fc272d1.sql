-- Fix consent_logs RLS policy to prevent null user_id bypass
DROP POLICY IF EXISTS "Users can view own consent only" ON public.consent_logs;

-- Create secure policy that prevents null user_id bypass
CREATE POLICY "Users can view own consent only" 
ON public.consent_logs 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND auth.uid() = user_id
);

-- Ensure user_id cannot be null for new records (data integrity)
ALTER TABLE public.consent_logs 
ADD CONSTRAINT consent_logs_user_id_not_null 
CHECK (user_id IS NOT NULL);

-- Log the security fix
INSERT INTO public.security_events (
  event_type,
  severity,
  details
) VALUES (
  'security_policy_hardening',
  'high',
  jsonb_build_object(
    'table', 'consent_logs',
    'fix_type', 'rls_null_bypass_prevention',
    'description', 'Enhanced RLS policy to prevent null user_id bypass vulnerability',
    'timestamp', now()
  )
);