import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface SessionSecurityContextType {
  sessionTimeoutMinutes: number;
  isSessionValid: boolean;
  refreshSession: () => void;
  logSecurityEvent: (eventType: string, details?: any) => void;
}

const SessionSecurityContext = createContext<SessionSecurityContextType | undefined>(undefined);

const SESSION_TIMEOUT_MINUTES = 60; // 1 hour idle timeout
const SESSION_WARNING_MINUTES = 5; // Warning 5 minutes before timeout

export const SessionSecurityProvider = ({ children }: { children: ReactNode }) => {
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(SESSION_TIMEOUT_MINUTES);
  const [isSessionValid, setIsSessionValid] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [warningShown, setWarningShown] = useState(false);
  
  const { user, session, signOut } = useAuth();
  const { toast } = useToast();

  // Track user activity
  useEffect(() => {
    const updateActivity = () => {
      setLastActivity(Date.now());
      setWarningShown(false);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, []);

  // Session timeout monitoring
  useEffect(() => {
    if (!user || !session) return;

    const checkSession = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;
      const warningThreshold = (sessionTimeoutMinutes - SESSION_WARNING_MINUTES) * 60 * 1000;
      const timeoutThreshold = sessionTimeoutMinutes * 60 * 1000;

      if (timeSinceLastActivity >= timeoutThreshold) {
        logSecurityEvent('session_timeout', {
          user_id: user.id,
          last_activity: new Date(lastActivity).toISOString(),
          timeout_minutes: sessionTimeoutMinutes
        });
        
        toast({
          title: "Session Expired",
          description: "Your session has expired due to inactivity. Please sign in again.",
          variant: "destructive",
        });
        
        signOut();
        setIsSessionValid(false);
      } else if (timeSinceLastActivity >= warningThreshold && !warningShown) {
        setWarningShown(true);
        toast({
          title: "Session Warning", 
          description: `Your session will expire in ${SESSION_WARNING_MINUTES} minutes due to inactivity.`,
          variant: "default",
        });
      }
    };

    const interval = setInterval(checkSession, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [user, session, lastActivity, sessionTimeoutMinutes, warningShown, toast, signOut]);

  // Generate device fingerprint for enhanced security
  const generateDeviceFingerprint = (): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx?.fillText('Device fingerprint', 10, 10);
    const canvasData = canvas.toDataURL();
    
    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
      canvas: canvasData.substring(0, 100), // First 100 chars of canvas data
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack
    };
    
    // Simple hash function for fingerprint
    let hash = 0;
    const str = JSON.stringify(fingerprint);
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  };

  // Initialize or update session record with device fingerprinting
  useEffect(() => {
    if (!user || !session) return;

    const initializeSession = async () => {
      try {
        const sessionToken = session.access_token;
        const userAgent = navigator.userAgent;
        const deviceFingerprint = generateDeviceFingerprint();
        
        const { error } = await supabase
          .from('user_sessions')
          .upsert({
            user_id: user.id,
            session_token: sessionToken,
            user_agent: userAgent,
            device_fingerprint: deviceFingerprint,
            last_activity: new Date().toISOString(),
            expires_at: new Date(Date.now() + sessionTimeoutMinutes * 60 * 1000).toISOString(),
            is_active: true
          }, {
            onConflict: 'session_token',
            ignoreDuplicates: false
          });

        if (error) {
          console.error('Failed to initialize session record:', error);
        } else {
          // Log successful session initialization
          await logSecurityEvent('session_initialized', {
            device_fingerprint: deviceFingerprint,
            user_agent: userAgent.substring(0, 100) // Limit length for storage
          });
        }
      } catch (error) {
        console.error('Session initialization error:', error);
      }
    };

    initializeSession();
  }, [user, session, sessionTimeoutMinutes]);

  const refreshSession = async () => {
    if (!session) return;

    try {
      const { error } = await supabase.auth.refreshSession();
      if (!error) {
        setLastActivity(Date.now());
        setWarningShown(false);
        
        // Update session record
        await supabase
          .from('user_sessions')
          .update({
            last_activity: new Date().toISOString(),
            expires_at: new Date(Date.now() + sessionTimeoutMinutes * 60 * 1000).toISOString()
          })
          .eq('session_token', session.access_token);
        
        toast({
          title: "Session Refreshed",
          description: "Your session has been successfully refreshed.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
    }
  };

  const logSecurityEvent = async (eventType: string, details?: any) => {
    try {
      await supabase.from('security_events').insert({
        event_type: eventType,
        severity: eventType.includes('timeout') || eventType.includes('failed') ? 'high' : 'medium',
        user_id: user?.id || null,
        details: {
          ...details,
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  return (
    <SessionSecurityContext.Provider value={{
      sessionTimeoutMinutes,
      isSessionValid,
      refreshSession,
      logSecurityEvent
    }}>
      {children}
    </SessionSecurityContext.Provider>
  );
};

export const useSessionSecurity = () => {
  const context = useContext(SessionSecurityContext);
  if (context === undefined) {
    throw new Error('useSessionSecurity must be used within a SessionSecurityProvider');
  }
  return context;
};