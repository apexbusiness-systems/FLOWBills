
-- Fix: Security Definer View - Convert user_sessions_safe to SECURITY INVOKER
--
-- ISSUE: The user_sessions_safe view uses default SECURITY DEFINER mode, which runs
-- with the view owner's permissions instead of the querying user's permissions.
-- This can bypass RLS policies and is flagged by the Supabase linter.
--
-- SOLUTION: Recreate the view with security_invoker=true to enforce the querying
-- user's permissions and RLS policies.
--
-- SECURITY IMPACT:
-- ✅ View will now enforce RLS policies of the querying user
-- ✅ No privilege escalation via view ownership
-- ✅ Aligns with security best practices

-- Drop the existing view
DROP VIEW IF EXISTS public.user_sessions_safe;

-- Recreate the view with SECURITY INVOKER mode
CREATE VIEW public.user_sessions_safe
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_id,
  ip_address,
  user_agent,
  created_at,
  last_activity,
  expires_at,
  is_active
FROM public.user_sessions;

-- Grant SELECT to authenticated users (RLS from user_sessions table will apply)
GRANT SELECT ON public.user_sessions_safe TO authenticated;

-- Log the security fix
INSERT INTO public.security_events (
  event_type,
  severity,
  details
) VALUES (
  'security_definer_view_fixed',
  'high',
  jsonb_build_object(
    'view_name', 'user_sessions_safe',
    'fix_applied', 'Converted from SECURITY DEFINER to SECURITY INVOKER',
    'security_impact', 'View now enforces RLS policies of querying user',
    'linter_rule', 'SUPA_security_definer_view',
    'timestamp', now()
  )
);
