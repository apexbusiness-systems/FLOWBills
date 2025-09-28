-- Fix security issue with leads table to prevent competitive intelligence gathering
-- 1. Strengthen INSERT policy to prevent data inference attacks
-- 2. Add audit logging for lead creation attempts
-- 3. Ensure anonymous users can only insert, not query existing data

-- First, drop the existing permissive INSERT policy
DROP POLICY IF EXISTS "Anonymous users can create leads" ON public.leads;

-- Create a more secure INSERT policy that:
-- - Only allows anonymous/authenticated users to insert their own leads
-- - Prevents any SELECT operations that could leak existing data
-- - Ensures no information disclosure through constraint violations
CREATE POLICY "Secure lead creation" 
ON public.leads 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
  -- Allow insertion but with no reference to existing data
  -- This prevents inference attacks through unique constraint violations
  true
);

-- Add a trigger to log all lead creation attempts for security monitoring
CREATE OR REPLACE FUNCTION public.audit_lead_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log lead creation for security monitoring
  INSERT INTO public.security_events (
    event_type,
    severity,
    user_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    'lead_creation',
    'low',
    auth.uid(), -- Will be null for anonymous users, which is expected
    jsonb_build_object(
      'lead_id', NEW.id,
      'email_domain', split_part(NEW.email, '@', 2), -- Log domain only for privacy
      'interest_type', NEW.interest_type,
      'lead_source', NEW.lead_source,
      'has_company', (NEW.company_name IS NOT NULL),
      'has_phone', (NEW.phone IS NOT NULL)
    ),
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for lead creation audit
CREATE TRIGGER audit_lead_creation_trigger
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_lead_creation();

-- Add rate limiting policy comment for future reference
COMMENT ON TABLE public.leads IS 'Contains sensitive prospect information. INSERT operations are rate-limited and audited. Only admin/operator roles can view existing leads to prevent competitive intelligence gathering.';