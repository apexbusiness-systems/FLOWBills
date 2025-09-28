-- Security Fix 1: Remove anonymous access from leads table
-- Current policy allows anonymous users to insert leads, which is a security risk

DROP POLICY IF EXISTS "leads_secure_insert_policy" ON public.leads;

-- Create new secure policy that requires authentication for lead creation
CREATE POLICY "authenticated_users_can_create_leads" 
ON public.leads 
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Limit to 5 leads per user per hour to prevent spam
  (
    SELECT COUNT(*) 
    FROM public.leads 
    WHERE created_at >= NOW() - INTERVAL '1 hour'
  ) < 5
);

-- Security Fix 2: Restrict queue_jobs access to admin/operator roles only
-- Current policy allows any authenticated user full access, which is too broad

DROP POLICY IF EXISTS "System can manage queue jobs" ON public.queue_jobs;

-- Create restrictive policies for queue_jobs
CREATE POLICY "admins_can_manage_queue_jobs" 
ON public.queue_jobs 
FOR ALL
TO authenticated
USING (get_user_role(auth.uid()) = 'admin'::user_role)
WITH CHECK (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "operators_can_view_queue_jobs" 
ON public.queue_jobs 
FOR SELECT
TO authenticated
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'operator'::user_role]));

-- System functions can still insert jobs (for internal processes)
CREATE POLICY "system_can_insert_queue_jobs" 
ON public.queue_jobs 
FOR INSERT
TO service_role
WITH CHECK (true);

-- Log these security policy updates
INSERT INTO public.security_events (
  event_type,
  severity,
  details
) VALUES (
  'security_policy_update',
  'high',
  jsonb_build_object(
    'tables_updated', ARRAY['leads', 'queue_jobs'],
    'fix_type', 'rls_policy_hardening',
    'description', 'Removed anonymous access from leads, restricted queue_jobs to admin/operator roles',
    'timestamp', now()
  )
);