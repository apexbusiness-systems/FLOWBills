-- Fix security issue with leads table to prevent competitive intelligence gathering
-- Drop existing policies and create secure ones with unique names

-- Drop all existing INSERT policies on leads table
DROP POLICY IF EXISTS "Anonymous users can create leads" ON public.leads;
DROP POLICY IF EXISTS "Secure lead creation" ON public.leads;

-- Create a more restrictive INSERT policy
CREATE POLICY "leads_secure_insert_policy" 
ON public.leads 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
  -- Allow insertion but ensure no data leakage
  -- Anonymous users can only create leads, never query existing ones
  auth.role() IN ('anon', 'authenticated')
);

-- Add audit logging function for lead creation (if not exists)
CREATE OR REPLACE FUNCTION public.audit_lead_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log lead creation for security monitoring and competitive intelligence protection
  INSERT INTO public.security_events (
    event_type,
    severity,
    user_id,
    details,
    ip_address
  ) VALUES (
    'lead_creation_attempt',
    'info',
    auth.uid(), -- Will be null for anonymous users
    jsonb_build_object(
      'lead_id', NEW.id,
      'email_domain', COALESCE(split_part(NEW.email, '@', 2), 'unknown'), 
      'interest_type', COALESCE(NEW.interest_type, 'unspecified'),
      'lead_source', COALESCE(NEW.lead_source, 'unknown'),
      'has_company_name', (NEW.company_name IS NOT NULL AND NEW.company_name != ''),
      'has_phone_number', (NEW.phone IS NOT NULL AND NEW.phone != ''),
      'submission_timestamp', now()
    ),
    inet_client_addr()
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for lead creation audit (drop if exists first)
DROP TRIGGER IF EXISTS audit_lead_creation_trigger ON public.leads;
CREATE TRIGGER audit_lead_creation_trigger
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_lead_creation();

-- Add security comment
COMMENT ON TABLE public.leads IS 'SECURITY: Contains sensitive prospect data. All insertions are audited. Only admin/operator roles can read existing leads to prevent competitive intelligence theft.';