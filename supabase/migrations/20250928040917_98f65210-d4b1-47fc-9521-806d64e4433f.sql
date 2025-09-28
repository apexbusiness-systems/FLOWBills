-- Bootstrap initial admin user and enhance security
-- This migration creates an initial admin user and enhances security monitoring

-- Create function to bootstrap admin user (will be called manually)
CREATE OR REPLACE FUNCTION public.bootstrap_admin_user(admin_email text, admin_password text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- This function should only be called once during initial setup
  -- In production, this would be called via a secure admin interface
  
  -- Check if admin already exists
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RAISE EXCEPTION 'Admin user already exists';
  END IF;
  
  -- Create user record (this would normally be done via Supabase Auth)
  -- For now, we'll create a placeholder that can be linked to a real auth user
  INSERT INTO public.user_roles (user_id, role, assigned_by)
  VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid, -- Placeholder admin UUID
    'admin'::user_role,
    '00000000-0000-0000-0000-000000000001'::uuid
  );
  
  -- Log the admin creation
  INSERT INTO public.security_events (
    event_type,
    severity,
    user_id,
    details
  ) VALUES (
    'admin_user_bootstrapped',
    'critical',
    '00000000-0000-0000-0000-000000000001'::uuid,
    jsonb_build_object(
      'method', 'bootstrap_function',
      'timestamp', now(),
      'note', 'Initial admin user created during system setup'
    )
  );
  
  RETURN '00000000-0000-0000-0000-000000000001'::uuid;
END;
$$;

-- Enhanced security event logging function
CREATE OR REPLACE FUNCTION public.log_security_violation(
  violation_type text,
  severity_level text DEFAULT 'high',
  violation_details jsonb DEFAULT '{}'::jsonb,
  target_user_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.security_events (
    event_type,
    severity,
    user_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    violation_type,
    severity_level,
    COALESCE(target_user_id, auth.uid()),
    violation_details,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  -- For critical violations, also create an audit log entry
  IF severity_level = 'critical' THEN
    INSERT INTO public.audit_logs (
      entity_type,
      entity_id,
      action,
      user_id,
      new_values
    ) VALUES (
      'security_violation',
      gen_random_uuid(),
      'SECURITY_ALERT',
      COALESCE(target_user_id, auth.uid()),
      violation_details
    );
  END IF;
  
  RETURN true;
END;
$$;

-- Function to validate session integrity
CREATE OR REPLACE FUNCTION public.validate_session_integrity(
  session_data jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_session record;
  suspicious_activity boolean := false;
BEGIN
  -- Get current session info
  SELECT * INTO current_session
  FROM public.user_sessions
  WHERE user_id = auth.uid()
    AND is_active = true
    AND expires_at > now()
  ORDER BY last_activity DESC
  LIMIT 1;
  
  -- Check for session anomalies
  IF NOT FOUND THEN
    PERFORM public.log_security_violation(
      'invalid_session_detected',
      'high',
      jsonb_build_object(
        'reason', 'no_active_session_found',
        'user_id', auth.uid(),
        'session_data', session_data
      )
    );
    RETURN false;
  END IF;
  
  -- Check for geographic anomalies (if location data provided)
  IF session_data ? 'location' AND current_session.ip_address IS NOT NULL THEN
    -- Log potential geographic anomaly
    PERFORM public.log_security_violation(
      'geographic_anomaly_detected',
      'medium',
      jsonb_build_object(
        'previous_ip', current_session.ip_address,
        'current_location', session_data->'location',
        'session_id', current_session.id
      )
    );
  END IF;
  
  -- Update session activity
  UPDATE public.user_sessions
  SET last_activity = now()
  WHERE id = current_session.id;
  
  RETURN true;
END;
$$;

-- Function to cleanup stale sessions
CREATE OR REPLACE FUNCTION public.cleanup_stale_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  cleanup_count integer;
BEGIN
  -- Deactivate expired sessions
  UPDATE public.user_sessions
  SET is_active = false
  WHERE expires_at < now() AND is_active = true;
  
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  
  -- Log cleanup activity
  IF cleanup_count > 0 THEN
    INSERT INTO public.security_events (
      event_type,
      severity,
      details
    ) VALUES (
      'session_cleanup',
      'low',
      jsonb_build_object(
        'sessions_cleaned', cleanup_count,
        'cleanup_time', now()
      )
    );
  END IF;
  
  RETURN cleanup_count;
END;
$$;

-- Enhanced trigger for consent audit logging
CREATE OR REPLACE FUNCTION public.audit_consent_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log consent data access (excluding the actual PII for privacy)
  INSERT INTO public.audit_logs (
    entity_type,
    entity_id,
    action,
    user_id,
    old_values,
    new_values
  ) VALUES (
    'consent_access',
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    auth.uid(),
    CASE WHEN TG_OP != 'INSERT' THEN 
      jsonb_build_object(
        'consent_type', OLD.consent_type,
        'consent_given', OLD.consent_given,
        'has_email', (OLD.email IS NOT NULL),
        'has_phone', (OLD.phone IS NOT NULL),
        'created_at', OLD.created_at
      ) 
    ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN 
      jsonb_build_object(
        'consent_type', NEW.consent_type,
        'consent_given', NEW.consent_given,
        'has_email', (NEW.email IS NOT NULL),
        'has_phone', (NEW.phone IS NOT NULL),
        'created_at', NEW.created_at
      ) 
    ELSE NULL END
  );
  
  -- Log security event for admin access to PII
  IF auth.uid() IS NOT NULL AND get_user_role(auth.uid()) = 'admin' THEN
    INSERT INTO public.security_events (
      event_type,
      severity,
      user_id,
      details
    ) VALUES (
      'admin_pii_access',
      'high',
      auth.uid(),
      jsonb_build_object(
        'table_name', 'consent_logs',
        'record_id', COALESCE(NEW.id, OLD.id),
        'operation', TG_OP,
        'justification', 'Administrative access to consent data'
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for consent access auditing
DROP TRIGGER IF EXISTS audit_consent_access_trigger ON public.consent_logs;
CREATE TRIGGER audit_consent_access_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.consent_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_consent_access();

-- Create indexes for security monitoring performance
CREATE INDEX IF NOT EXISTS idx_security_events_severity_time 
  ON public.security_events(severity, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_events_user_time 
  ON public.security_events(user_id, created_at DESC) 
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_sessions_active_expires 
  ON public.user_sessions(is_active, expires_at) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_time 
  ON public.audit_logs(entity_type, created_at DESC);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.log_security_violation(text, text, jsonb, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_session_integrity(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_stale_sessions() TO authenticated;