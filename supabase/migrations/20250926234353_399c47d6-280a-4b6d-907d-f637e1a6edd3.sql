-- Fix critical security issue in consent_logs RLS policy
-- Remove email-based access that could expose personal data of other users

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Users can view own consent only" ON public.consent_logs;

-- Create a secure policy that only allows access based on user_id matching
CREATE POLICY "Users can view own consent only" 
ON public.consent_logs 
FOR SELECT 
USING (auth.uid() = user_id);

-- Log this security fix
INSERT INTO public.security_events (
  event_type,
  severity,
  user_id,
  details
) VALUES (
  'rls_policy_security_fix',
  'critical',
  '00000000-0000-0000-0000-000000000000'::uuid, -- System user
  jsonb_build_object(
    'table', 'consent_logs',
    'fix_type', 'restricted_access_to_user_id_only',
    'removed_vulnerability', 'email_based_access_bypass',
    'description', 'Fixed RLS policy to prevent potential PII exposure through email matching'
  )
);