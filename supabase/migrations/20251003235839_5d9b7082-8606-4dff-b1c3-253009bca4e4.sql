-- Fix Critical Security Issue: Consent Logs System-Wide INSERT Policy
-- The "System can record consent" policy allows any authenticated user to insert consent for ANY user
-- This is a privilege escalation vulnerability

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can record consent" ON public.consent_logs;

-- Create user-scoped INSERT policy - users can only record their own consent
CREATE POLICY "Users can record own consent"
  ON public.consent_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add admin override policy - admins can record consent on behalf of users (for support cases)
CREATE POLICY "Admins can record any consent"
  ON public.consent_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) = 'admin'::user_role);

-- Add anonymous consent recording for lead capture forms (where user_id is NULL)
CREATE POLICY "Anonymous users can record consent"
  ON public.consent_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (user_id IS NULL);

-- Create audit logging function for consent insertions
CREATE OR REPLACE FUNCTION public.audit_consent_insertion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log consent creation for compliance and security monitoring
  INSERT INTO public.security_events (
    event_type,
    severity,
    user_id,
    details
  ) VALUES (
    'consent_recorded',
    'info',
    COALESCE(NEW.user_id, auth.uid()),
    jsonb_build_object(
      'consent_id', NEW.id,
      'consent_type', NEW.consent_type,
      'consent_given', NEW.consent_given,
      'is_anonymous', (NEW.user_id IS NULL),
      'actor', auth.uid(),
      'ip_address', NEW.ip_address,
      'timestamp', NEW.created_at
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for consent audit logging
DROP TRIGGER IF EXISTS trigger_audit_consent_insertion ON public.consent_logs;
CREATE TRIGGER trigger_audit_consent_insertion
  AFTER INSERT ON public.consent_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_consent_insertion();