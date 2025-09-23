-- Fix infinite recursion in user_roles RLS policies
-- Drop the problematic policy that queries user_roles table within itself
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Keep the working policy that uses the security definer function
-- (The "Admins can manage all user roles" policy using has_role() is correct)

-- Remove duplicate "Users can view own roles" policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create a single, clean policy for users to view their own roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Fix system_health_metrics security issue - restrict to admin users only
DROP POLICY IF EXISTS "Everyone can view system health metrics" ON public.system_health_metrics;

-- Create admin-only policy for viewing system health metrics
CREATE POLICY "Only admins can view system health metrics" 
ON public.system_health_metrics 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update the insert policy to also require admin role
DROP POLICY IF EXISTS "Admins can insert system health metrics" ON public.system_health_metrics;

CREATE POLICY "Only admins can insert system health metrics" 
ON public.system_health_metrics 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));