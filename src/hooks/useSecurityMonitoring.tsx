import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface SecurityEvent {
  id: string;
  event_type: string;
  severity: string;
  user_id?: string;
  ip_address?: string | null;
  user_agent?: string | null;
  details: any;
  created_at: string;
}

interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  highSeverityEvents: number;
  recentEvents: SecurityEvent[];
  lastUpdated: Date;
}

export const useSecurityMonitoring = () => {
  const { user, hasRole } = useAuth();
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalEvents: 0,
    criticalEvents: 0,
    highSeverityEvents: 0,
    recentEvents: [],
    lastUpdated: new Date()
  });
  const [loading, setLoading] = useState(false);

  const logSecurityEvent = useCallback(async (
    eventType: string,
    severity: 'critical' | 'high' | 'medium' | 'low',
    details: any = {},
    targetUserId?: string
  ) => {
    try {
      // Get client IP and user agent
      const clientInfo = {
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        ...details
      };

      const { error } = await supabase
        .from('security_events')
        .insert({
          event_type: eventType,
          severity,
          user_id: targetUserId || user?.id,
          details: clientInfo
        });

      if (error) throw error;

      // Show toast for high/critical events
      if (['critical', 'high'].includes(severity)) {
        toast({
          title: "Security Alert",
          description: `${eventType.replace(/_/g, ' ').toUpperCase()} detected`,
          variant: severity === 'critical' ? 'destructive' : 'default',
        });
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }, [user]);

  const fetchSecurityMetrics = useCallback(async () => {
    if (!user || !hasRole('admin')) return;

    try {
      setLoading(true);

      // Get events from the last 24 hours
      const { data: events, error } = await supabase
        .from('security_events')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

        if (error) throw error;

        // Type cast to match our interface
        const typedEvents = (events || []).map(event => ({
          ...event,
          ip_address: event.ip_address as string | null,
          user_agent: event.user_agent as string | null
        }));

        const criticalCount = typedEvents.filter(e => e.severity === 'critical').length;
        const highCount = typedEvents.filter(e => e.severity === 'high').length;

        setMetrics({
          totalEvents: typedEvents.length,
          criticalEvents: criticalCount,
          highSeverityEvents: highCount,
          recentEvents: typedEvents.slice(0, 20),
          lastUpdated: new Date()
        });
    } catch (error) {
      console.error('Failed to fetch security metrics:', error);
      toast({
        title: "Security Monitoring Error",
        description: "Failed to load security metrics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, hasRole]);

  const monitorSessionSecurity = useCallback(async () => {
    if (!user) return;

    try {
      // Check for suspicious session patterns
      // Use safe view to avoid exposing session tokens
      const { data: sessions, error } = await supabase
        .from('user_sessions_safe')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;

      // Check for multiple active sessions from different IPs
      const uniqueIPs = new Set(sessions?.map(s => s.ip_address).filter(Boolean));
      if (uniqueIPs.size > 3) {
        await logSecurityEvent(
          'multiple_active_sessions',
          'medium',
          {
            active_sessions: sessions?.length,
            unique_ips: uniqueIPs.size,
            session_details: sessions?.map(s => ({
              id: s.id,
              ip: s.ip_address,
              last_activity: s.last_activity
            }))
          }
        );
      }

      // Check for old sessions that should be expired
      const oldSessions = sessions?.filter(s => 
        new Date(s.last_activity).getTime() < Date.now() - 24 * 60 * 60 * 1000
      );

      if (oldSessions && oldSessions.length > 0) {
        // Deactivate old sessions (UPDATE operations still use user_sessions table)
        await supabase
          .from('user_sessions')
          .update({ is_active: false })
          .in('id', oldSessions.map(s => s.id));

        await logSecurityEvent(
          'stale_sessions_cleaned',
          'low',
          { cleaned_sessions: oldSessions.length }
        );
      }
    } catch (error) {
      console.error('Session security monitoring error:', error);
    }
  }, [user, logSecurityEvent]);

  const validateFileUpload = useCallback(async (file: File) => {
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.js', '.vbs', '.jar'];
    const maxSizeBytes = 50 * 1024 * 1024; // 50MB
    
    // Check file size
    if (file.size > maxSizeBytes) {
      await logSecurityEvent(
        'oversized_file_upload',
        'medium',
        { file_size: file.size, file_name: file.name }
      );
      return { valid: false, error: 'File size exceeds maximum limit' };
    }

    // Check for suspicious file extensions
    const fileName = file.name.toLowerCase();
    if (suspiciousExtensions.some(ext => fileName.endsWith(ext))) {
      await logSecurityEvent(
        'suspicious_file_upload',
        'high',
        { file_name: file.name, file_type: file.type }
      );
      return { valid: false, error: 'File type not allowed for security reasons' };
    }

    // Log successful validation
    await logSecurityEvent(
      'file_upload_validated',
      'low',
      { file_name: file.name, file_size: file.size, file_type: file.type }
    );

    return { valid: true };
  }, [logSecurityEvent]);

  // Set up real-time monitoring
  useEffect(() => {
    if (!user) return;

    fetchSecurityMetrics();

    // Monitor session security every 5 minutes
    const sessionMonitorInterval = setInterval(monitorSessionSecurity, 5 * 60 * 1000);

    // Refresh metrics every 30 seconds for admins
    let metricsInterval: NodeJS.Timeout;
    if (hasRole('admin')) {
      metricsInterval = setInterval(fetchSecurityMetrics, 30 * 1000);
    }

    // Set up real-time subscription for critical events
    const subscription = supabase
      .channel('security_monitoring')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_events',
          filter: hasRole('admin') ? undefined : `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newEvent = payload.new as SecurityEvent;
          
          // Update metrics immediately for admins
          if (hasRole('admin')) {
            setMetrics(prev => ({
              ...prev,
              totalEvents: prev.totalEvents + 1,
              criticalEvents: prev.criticalEvents + (newEvent.severity === 'critical' ? 1 : 0),
              highSeverityEvents: prev.highSeverityEvents + (newEvent.severity === 'high' ? 1 : 0),
              recentEvents: [newEvent, ...prev.recentEvents.slice(0, 19)],
              lastUpdated: new Date()
            }));
          }

          // Show immediate alert for critical/high severity events
          if (['critical', 'high'].includes(newEvent.severity)) {
            toast({
              title: "Security Alert",
              description: `${newEvent.event_type.replace(/_/g, ' ').toUpperCase()} detected`,
              variant: newEvent.severity === 'critical' ? 'destructive' : 'default',
            });
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(sessionMonitorInterval);
      if (metricsInterval) clearInterval(metricsInterval);
      subscription.unsubscribe();
    };
  }, [user, hasRole, fetchSecurityMetrics, monitorSessionSecurity]);

  return {
    metrics,
    loading,
    logSecurityEvent,
    validateFileUpload,
    monitorSessionSecurity,
    refreshMetrics: fetchSecurityMetrics
  };
};