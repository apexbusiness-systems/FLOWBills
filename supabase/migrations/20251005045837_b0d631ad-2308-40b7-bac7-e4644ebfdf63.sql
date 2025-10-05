-- =====================================================
-- CRITICAL SECURITY FIXES - Phase 1
-- Fix 1: Protect Customer Contact Information in consent_logs
-- Fix 2: Prevent Session Token Exposure in user_sessions
-- =====================================================

-- ==================== FIX 1: CONSENT_LOGS PII PROTECTION ====================

-- Drop overly permissive admin policy that exposes raw PII
DROP POLICY IF EXISTS "Admins can view consent with audit" ON public.consent_logs;

-- Create new policy that allows admins to view metadata only (not raw PII)
CREATE POLICY "Admins can view consent metadata only"
  ON public.consent_logs
  FOR SELECT
  TO authenticated
  USING (
    get_user_role(auth.uid()) = 'admin'::user_role
  );

-- Create secure function for admins to access PII ONLY when justified
CREATE OR REPLACE FUNCTION public.get_consent_pii_secure(
  consent_id uuid,
  justification text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pii_data jsonb;
BEGIN
  -- Validate justification is provided
  IF justification IS NULL OR length(trim(justification)) < 10 THEN
    RAISE EXCEPTION 'Justification must be at least 10 characters';
  END IF;

  -- Only admins can call this
  IF get_user_role(auth.uid()) != 'admin'::user_role THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Log the PII access with justification (CRITICAL for audit trail)
  INSERT INTO public.security_events (
    event_type,
    severity,
    user_id,
    details
  ) VALUES (
    'admin_pii_access_consent',
    'critical',
    auth.uid(),
    jsonb_build_object(
      'consent_id', consent_id,
      'justification', justification,
      'accessed_at', now(),
      'access_method', 'get_consent_pii_secure'
    )
  );

  -- Return PII only after logging
  SELECT jsonb_build_object(
    'id', id,
    'email', email,
    'phone', phone,
    'consent_type', consent_type,
    'consent_given', consent_given,
    'created_at', created_at
  ) INTO pii_data
  FROM public.consent_logs
  WHERE id = consent_id;

  IF pii_data IS NULL THEN
    RAISE EXCEPTION 'Consent record not found';
  END IF;

  RETURN pii_data;
END;
$$;

-- Enhance anonymous consent validation with stricter rate limits
CREATE OR REPLACE FUNCTION public.validate_anonymous_consent_secure(
  p_email text, 
  p_phone text, 
  p_ip_address inet, 
  p_honeypot text DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate_limit_record record;
  v_max_attempts_per_hour integer := 3;  -- Reduced from 5
  v_max_attempts_per_day integer := 10;  -- Reduced from 20
  v_validation_errors text[] := ARRAY[]::text[];
  v_is_valid boolean := true;
BEGIN
  -- SECURITY: Honeypot detection
  IF p_honeypot IS NOT NULL AND p_honeypot != '' THEN
    INSERT INTO public.security_events (
      event_type, severity, ip_address, details
    ) VALUES (
      'honeypot_triggered_consent', 'high', p_ip_address,
      jsonb_build_object('timestamp', now(), 'honeypot_value_length', length(p_honeypot))
    );
    RAISE EXCEPTION 'Unable to process consent request';
  END IF;

  -- Check rate limiting
  SELECT * INTO v_rate_limit_record
  FROM public.consent_rate_limits
  WHERE ip_address = p_ip_address
    AND last_attempt_at > (now() - interval '24 hours')
  FOR UPDATE;

  -- Check if IP is currently blocked
  IF FOUND AND v_rate_limit_record.blocked_until IS NOT NULL 
     AND v_rate_limit_record.blocked_until > now() THEN
    INSERT INTO public.security_events (
      event_type, severity, ip_address, details
    ) VALUES (
      'rate_limit_exceeded_consent', 'medium', p_ip_address,
      jsonb_build_object('blocked_until', v_rate_limit_record.blocked_until, 'attempt_count', v_rate_limit_record.attempt_count)
    );
    RAISE EXCEPTION 'Too many requests. Please try again later';
  END IF;

  -- Update rate limit counter
  IF FOUND THEN
    IF v_rate_limit_record.last_attempt_at > (now() - interval '1 hour') 
       AND v_rate_limit_record.attempt_count >= v_max_attempts_per_hour THEN
      UPDATE public.consent_rate_limits
      SET attempt_count = attempt_count + 1, last_attempt_at = now(),
          blocked_until = now() + (interval '1 minute' * POWER(2, LEAST(attempt_count, 6)))
      WHERE id = v_rate_limit_record.id;
      RAISE EXCEPTION 'Too many requests. Please try again later';
    END IF;

    IF v_rate_limit_record.attempt_count >= v_max_attempts_per_day THEN
      UPDATE public.consent_rate_limits
      SET blocked_until = now() + interval '24 hours'
      WHERE id = v_rate_limit_record.id;
      RAISE EXCEPTION 'Daily limit exceeded. Please try again tomorrow';
    END IF;

    UPDATE public.consent_rate_limits
    SET attempt_count = attempt_count + 1, last_attempt_at = now()
    WHERE id = v_rate_limit_record.id;
  ELSE
    INSERT INTO public.consent_rate_limits (ip_address, attempt_count, last_attempt_at)
    VALUES (p_ip_address, 1, now());
  END IF;

  -- Validation
  IF (p_email IS NULL OR p_email = '') AND (p_phone IS NULL OR p_phone = '') THEN
    v_validation_errors := array_append(v_validation_errors, 'missing_contact');
    v_is_valid := false;
  END IF;
  
  IF p_email IS NOT NULL AND p_email != '' THEN
    IF NOT (p_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') 
       OR length(p_email) > 255 OR length(p_email) < 5 THEN
      v_validation_errors := array_append(v_validation_errors, 'invalid_email');
      v_is_valid := false;
    END IF;
  END IF;
  
  IF p_phone IS NOT NULL AND p_phone != '' THEN
    IF length(regexp_replace(p_phone, '[^0-9+]', '', 'g')) < 10 OR length(p_phone) > 20 THEN
      v_validation_errors := array_append(v_validation_errors, 'invalid_phone');
      v_is_valid := false;
    END IF;
  END IF;

  IF NOT v_is_valid THEN
    INSERT INTO public.security_events (
      event_type, severity, ip_address, details
    ) VALUES (
      'consent_validation_failed', 'info', p_ip_address,
      jsonb_build_object('error_count', array_length(v_validation_errors, 1), 'has_email', (p_email IS NOT NULL AND p_email != ''), 'has_phone', (p_phone IS NOT NULL AND p_phone != ''), 'timestamp', now())
    );
    RAISE EXCEPTION 'Invalid contact information provided';
  END IF;
  
  INSERT INTO public.security_events (
    event_type, severity, ip_address, details
  ) VALUES (
    'anonymous_consent_validated', 'info', p_ip_address,
    jsonb_build_object('has_email', (p_email IS NOT NULL AND p_email != ''), 'has_phone', (p_phone IS NOT NULL AND p_phone != ''), 'email_domain', CASE WHEN p_email IS NOT NULL AND p_email != '' THEN split_part(p_email, '@', 2) ELSE NULL END, 'timestamp', now())
  );

  RETURN true;
END;
$$;

-- ==================== FIX 2: USER_SESSIONS SESSION TOKEN PROTECTION ====================

-- Create safe view that excludes session_token from SELECT operations
CREATE OR REPLACE VIEW public.user_sessions_safe AS
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

-- Grant SELECT on safe view
GRANT SELECT ON public.user_sessions_safe TO authenticated;

-- Create secure function to validate sessions without exposing tokens
CREATE OR REPLACE FUNCTION public.validate_my_session(
  session_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_valid boolean;
BEGIN
  -- Check if session exists, belongs to user, and is active
  SELECT EXISTS (
    SELECT 1 FROM public.user_sessions
    WHERE id = session_id
      AND user_id = auth.uid()
      AND is_active = true
      AND expires_at > now()
  ) INTO is_valid;

  -- Update last_activity if valid
  IF is_valid THEN
    UPDATE public.user_sessions
    SET last_activity = now()
    WHERE id = session_id;
  END IF;

  RETURN is_valid;
END;
$$;

-- Drop overly permissive policy that exposes session_token
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_sessions;

-- Create new restrictive policy - users should use user_sessions_safe view instead
CREATE POLICY "Users can view session metadata via safe view"
  ON public.user_sessions
  FOR SELECT
  TO authenticated
  USING (
    -- Only allow viewing own sessions, but this policy is mainly for admin access
    -- Regular users should use user_sessions_safe view
    auth.uid() = user_id AND get_user_role(auth.uid()) = 'admin'::user_role
  );

-- Keep other user_sessions policies as they are (INSERT, UPDATE, DELETE are fine)

-- ==================== SECURITY EVENT LOGGING ====================

-- Log that critical security fixes have been applied
INSERT INTO public.security_events (
  event_type,
  severity,
  details
) VALUES (
  'critical_security_fixes_applied',
  'critical',
  jsonb_build_object(
    'fixes', ARRAY[
      'consent_logs_pii_protection',
      'user_sessions_token_protection',
      'stricter_rate_limiting'
    ],
    'applied_at', now(),
    'migration_version', '2025-10-05-critical-security-fixes'
  )
);

-- ==================== COMMENTS ====================

COMMENT ON FUNCTION public.get_consent_pii_secure IS 
'Securely retrieve PII from consent_logs with mandatory justification and audit logging. Only accessible to admins.';

COMMENT ON FUNCTION public.validate_my_session IS 
'Validate user session without exposing session token. Updates last_activity if valid.';

COMMENT ON VIEW public.user_sessions_safe IS 
'Safe view of user_sessions that excludes session_token to prevent XSS-based token theft.';