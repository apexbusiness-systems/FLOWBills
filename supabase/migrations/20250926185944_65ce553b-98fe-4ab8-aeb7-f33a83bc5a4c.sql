-- Fix Vendor Financial Data Exposure (CRITICAL)
-- Remove overly permissive policy that allows any authenticated user to view vendor financial data
DROP POLICY IF EXISTS "Authenticated users can view vendors" ON public.vendors;

-- Create restrictive policy that only allows admin/operator roles to view vendor data
CREATE POLICY "Only admins and operators can view vendors" 
ON public.vendors 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'operator'::user_role]));

-- Add audit logging function for vendor access (fixed trigger)
CREATE OR REPLACE FUNCTION public.audit_vendor_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log vendor data modification attempts
  INSERT INTO public.audit_logs (
    entity_type,
    entity_id,
    action,
    user_id,
    old_values,
    new_values
  ) VALUES (
    'vendor',
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    auth.uid(),
    CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for vendor modification auditing (INSERT, UPDATE, DELETE only)
DROP TRIGGER IF EXISTS audit_vendor_access_trigger ON public.vendors;
CREATE TRIGGER audit_vendor_access_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.audit_vendor_access();

-- Enhanced session security table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  session_token text NOT NULL UNIQUE,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_activity timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '1 hour'),
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT user_sessions_user_id_check CHECK (user_id IS NOT NULL)
);

-- Enable RLS on user_sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own sessions
CREATE POLICY "Users can view their own sessions" 
ON public.user_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Admins can view all sessions for monitoring
CREATE POLICY "Admins can view all sessions" 
ON public.user_sessions 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- System can manage sessions
CREATE POLICY "System can manage sessions" 
ON public.user_sessions 
FOR ALL 
USING (true);

-- Create security events table for monitoring
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  user_id uuid,
  ip_address inet,
  user_agent text,
  details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on security events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view security events
CREATE POLICY "Only admins can view security events" 
ON public.security_events 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- System can insert security events
CREATE POLICY "System can insert security events" 
ON public.security_events 
FOR INSERT 
WITH CHECK (true);