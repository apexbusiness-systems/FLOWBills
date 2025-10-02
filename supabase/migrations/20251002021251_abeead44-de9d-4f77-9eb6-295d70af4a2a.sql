-- Fix Critical Security Issue: Replace overly permissive user_sessions policy
-- The "System can manage sessions" policy allows unrestricted access, enabling session hijacking

-- Drop the insecure policy
DROP POLICY IF EXISTS "System can manage sessions" ON public.user_sessions;

-- Drop existing admin policy to upgrade it from SELECT to ALL
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.user_sessions;

-- Create secure, scoped policies for user_sessions table

-- Users can insert their own sessions (during login)
CREATE POLICY "Users can create own sessions"
  ON public.user_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions (activity tracking, session refresh)
CREATE POLICY "Users can update own sessions"
  ON public.user_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own sessions (logout cleanup)
CREATE POLICY "Users can delete own sessions"
  ON public.user_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can manage all sessions (for security monitoring and management)
CREATE POLICY "Admins can manage all sessions"
  ON public.user_sessions
  FOR ALL
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin'::user_role)
  WITH CHECK (get_user_role(auth.uid()) = 'admin'::user_role);

-- Add audit logging for session modifications (security monitoring)
CREATE OR REPLACE FUNCTION public.audit_session_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log session modifications for security monitoring
  INSERT INTO public.security_events (
    event_type,
    severity,
    user_id,
    details
  ) VALUES (
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'session_created'
      WHEN TG_OP = 'UPDATE' THEN 'session_updated'
      WHEN TG_OP = 'DELETE' THEN 'session_deleted'
    END,
    'medium',
    COALESCE(NEW.user_id, OLD.user_id),
    jsonb_build_object(
      'operation', TG_OP,
      'session_id', COALESCE(NEW.id, OLD.id),
      'is_active', COALESCE(NEW.is_active, OLD.is_active),
      'actor', auth.uid()
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for session audit logging
DROP TRIGGER IF EXISTS trigger_audit_session_changes ON public.user_sessions;
CREATE TRIGGER trigger_audit_session_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_session_changes();