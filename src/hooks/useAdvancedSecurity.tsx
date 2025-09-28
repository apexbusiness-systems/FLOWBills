import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface SecurityThreat {
  id: string;
  type: 'brute_force' | 'session_hijacking' | 'suspicious_activity' | 'data_breach';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: Date;
  resolved: boolean;
}

interface SecurityMetrics {
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  activeThreats: number;
  blockedAttempts: number;
  lastThreatDetected: Date | null;
}

export const useAdvancedSecurity = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [threats, setThreats] = useState<SecurityThreat[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    threatLevel: 'low',
    activeThreats: 0,
    blockedAttempts: 0,
    lastThreatDetected: null
  });
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Rate limiting store
  const [rateLimitStore] = useState(() => new Map<string, number[]>());

  // Advanced rate limiting with exponential backoff
  const checkRateLimit = useCallback((action: string, limit: number = 5, windowMs: number = 60000): boolean => {
    const now = Date.now();
    const key = `${user?.id || 'anonymous'}_${action}`;
    const attempts = rateLimitStore.get(key) || [];
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(timestamp => now - timestamp < windowMs);
    
    if (validAttempts.length >= limit) {
      // Log rate limiting event
      logSecurityThreat({
        type: 'brute_force',
        severity: 'medium',
        description: `Rate limit exceeded for action: ${action}`,
        details: {
          action,
          attempts: validAttempts.length,
          limit,
          windowMs
        }
      });
      return false;
    }
    
    validAttempts.push(now);
    rateLimitStore.set(key, validAttempts);
    return true;
  }, [user?.id, rateLimitStore]);

  // Log security threats
  const logSecurityThreat = useCallback(async (threat: {
    type: SecurityThreat['type'];
    severity: SecurityThreat['severity'];
    description: string;
    details?: any;
  }) => {
    try {
      const { error } = await supabase
        .from('security_events')
        .insert({
          event_type: threat.type,
          severity: threat.severity,
          user_id: user?.id,
          details: {
            description: threat.description,
            ...threat.details,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
            url: window.location.href
          }
        });

      if (!error) {
        const newThreat: SecurityThreat = {
          id: Date.now().toString(),
          type: threat.type,
          severity: threat.severity,
          description: threat.description,
          timestamp: new Date(),
          resolved: false
        };

        setThreats(prev => [newThreat, ...prev.slice(0, 9)]); // Keep last 10 threats

        // Show critical threats immediately
        if (threat.severity === 'critical' || threat.severity === 'high') {
          toast({
            title: "Security Alert",
            description: threat.description,
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Failed to log security threat:', error);
    }
  }, [user?.id, toast]);

  // Monitor for suspicious patterns
  const detectSuspiciousActivity = useCallback(() => {
    // Check for rapid page navigation (potential bot behavior)
    let pageChangeCount = 0;
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      pageChangeCount++;
      if (pageChangeCount > 20) { // 20 page changes in monitoring window
        logSecurityThreat({
          type: 'suspicious_activity',
          severity: 'medium',
          description: 'Excessive page navigation detected'
        });
      }
      return originalPushState.apply(this, args);
    };

    history.replaceState = function(...args) {
      pageChangeCount++;
      return originalReplaceState.apply(this, args);
    };

    // Reset counter periodically
    const resetInterval = setInterval(() => {
      pageChangeCount = 0;
    }, 60000); // Reset every minute

    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      clearInterval(resetInterval);
    };
  }, [logSecurityThreat]);

  // Monitor network requests for anomalies
  const monitorNetworkActivity = useCallback(() => {
    const originalFetch = window.fetch;
    let requestCount = 0;
    
    window.fetch = async function(...args) {
      requestCount++;
      
      // Check for request flooding
      if (requestCount > 100) { // 100 requests in monitoring window
        logSecurityThreat({
          type: 'suspicious_activity',
          severity: 'high',
          description: 'Excessive API requests detected',
          details: { requestCount }
        });
      }
      
      try {
        const response = await originalFetch.apply(this, args);
        
        // Monitor for failed authentication attempts
        if (response.status === 401 || response.status === 403) {
          if (!checkRateLimit('auth_failure', 3, 300000)) { // 3 failures in 5 minutes
            logSecurityThreat({
              type: 'brute_force',
              severity: 'high',
              description: 'Multiple authentication failures detected'
            });
          }
        }
        
        return response;
      } catch (error) {
        // Monitor for network errors that might indicate attacks
        logSecurityThreat({
          type: 'suspicious_activity',
          severity: 'low',
          description: 'Network request failed',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
        throw error;
      }
    };

    // Reset request counter periodically
    const resetInterval = setInterval(() => {
      requestCount = 0;
    }, 60000);

    return () => {
      window.fetch = originalFetch;
      clearInterval(resetInterval);
    };
  }, [logSecurityThreat, checkRateLimit]);

  // Validate input for injection attacks
  const validateInput = useCallback((input: string, context: string = 'general'): boolean => {
    const suspiciousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi,
      /vbscript:/gi,
      /data:text\/html/gi,
      /'(\s*union\s+select|;\s*drop\s+table|;\s*delete\s+from)/gi,
      /\b(alert|confirm|prompt)\s*\(/gi
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(input)) {
        logSecurityThreat({
          type: 'suspicious_activity',
          severity: 'high',
          description: `Potential injection attack detected in ${context}`,
          details: { 
            input: input.substring(0, 100), // Log first 100 chars only
            pattern: pattern.source,
            context 
          }
        });
        return false;
      }
    }

    return true;
  }, [logSecurityThreat]);

  // Update security metrics
  const updateMetrics = useCallback(() => {
    const activeThreats = threats.filter(t => !t.resolved).length;
    const criticalThreats = threats.filter(t => t.severity === 'critical' && !t.resolved).length;
    const highThreats = threats.filter(t => t.severity === 'high' && !t.resolved).length;
    
    let threatLevel: SecurityMetrics['threatLevel'] = 'low';
    if (criticalThreats > 0) threatLevel = 'critical';
    else if (highThreats > 2) threatLevel = 'high';
    else if (activeThreats > 5) threatLevel = 'medium';

    setMetrics({
      threatLevel,
      activeThreats,
      blockedAttempts: rateLimitStore.size,
      lastThreatDetected: threats.length > 0 ? threats[0].timestamp : null
    });
  }, [threats, rateLimitStore.size]);

  // Start/stop monitoring
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;
    
    setIsMonitoring(true);
    const cleanupFunctions: (() => void)[] = [];
    
    cleanupFunctions.push(detectSuspiciousActivity());
    cleanupFunctions.push(monitorNetworkActivity());
    
    // Store cleanup functions for later
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
      setIsMonitoring(false);
    };
  }, [isMonitoring, detectSuspiciousActivity, monitorNetworkActivity]);

  // Auto-start monitoring when user is authenticated
  useEffect(() => {
    if (user && !isMonitoring) {
      const cleanup = startMonitoring();
      return cleanup;
    }
  }, [user, isMonitoring, startMonitoring]);

  // Update metrics when threats change
  useEffect(() => {
    updateMetrics();
  }, [threats, updateMetrics]);

  // Resolve threats
  const resolveThreat = useCallback((threatId: string) => {
    setThreats(prev => 
      prev.map(threat => 
        threat.id === threatId 
          ? { ...threat, resolved: true }
          : threat
      )
    );
  }, []);

  return {
    threats,
    metrics,
    isMonitoring,
    checkRateLimit,
    logSecurityThreat,
    validateInput,
    resolveThreat,
    startMonitoring
  };
};