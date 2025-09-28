import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCSRF } from './useCSRFProtection';
import { useSecurityMonitoring } from './useSecurityMonitoring';
import { validateInputAdvanced } from '@/lib/security';
import { useToast } from '@/hooks/use-toast';

interface SecureRequestOptions {
  validateInput?: boolean;
  inputSchema?: Record<string, any>;
  requireCSRF?: boolean;
  logSecurityEvents?: boolean;
}

export const useSecureAPI = () => {
  const { validateAndRefreshToken } = useCSRF();
  const { logSecurityEvent } = useSecurityMonitoring();
  const { toast } = useToast();

  const secureInvoke = useCallback(async (
    functionName: string,
    body: any = {},
    options: SecureRequestOptions = {}
  ) => {
    const {
      validateInput = true,
      inputSchema = {},
      requireCSRF = true,
      logSecurityEvents = true
    } = options;

    try {
      // Input validation
      if (validateInput && Object.keys(inputSchema).length > 0) {
        for (const [key, validationOptions] of Object.entries(inputSchema)) {
          const validation = validateInputAdvanced(body[key], validationOptions);
          if (!validation.valid) {
            if (logSecurityEvents) {
              await logSecurityEvent('invalid_api_input', 'medium', {
                function: functionName,
                field: key,
                error: validation.error
              });
            }
            throw new Error(`Invalid input for ${key}: ${validation.error}`);
          }
          // Use sanitized value
          if (validation.sanitized !== undefined) {
            body[key] = validation.sanitized;
          }
        }
      }

      // CSRF protection for state-changing operations
      let headers: Record<string, string> = {};
      if (requireCSRF) {
        const csrfToken = await validateAndRefreshToken();
        if (csrfToken) {
          headers['X-CSRF-Token'] = csrfToken;
        }
      }

      // Add security headers
      headers['X-Requested-With'] = 'XMLHttpRequest';
      headers['X-API-Version'] = '1.0';

      // Make the secure request
      const { data, error } = await supabase.functions.invoke(functionName, {
        body,
        headers
      });

      if (error) {
        if (logSecurityEvents) {
          await logSecurityEvent('api_error', 'medium', {
            function: functionName,
            error: error.message
          });
        }
        throw error;
      }

      // Log successful API call for audit trail
      if (logSecurityEvents) {
        await logSecurityEvent('api_success', 'low', {
          function: functionName,
          timestamp: new Date().toISOString()
        });
      }

      return { data, error: null };

    } catch (error) {
      console.error(`Secure API call failed for ${functionName}:`, error);
      
      if (logSecurityEvents) {
        await logSecurityEvent('api_call_failed', 'high', {
          function: functionName,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // User-friendly error handling
      toast({
        title: "Request Failed",
        description: "An error occurred while processing your request. Please try again.",
        variant: "destructive",
      });

      return { data: null, error };
    }
  }, [validateAndRefreshToken, logSecurityEvent, toast]);

  const secureQuery = useCallback(async (
    table: string,
    query: any,
    options: SecureRequestOptions = {}
  ) => {
    const { logSecurityEvents = true } = options;

    try {
      // Add security metadata to queries
      const result = await query;

      if (logSecurityEvents) {
        await logSecurityEvent('db_query_success', 'low', {
          table,
          timestamp: new Date().toISOString()
        });
      }

      return result;

    } catch (error) {
      console.error(`Secure query failed for ${table}:`, error);
      
      if (logSecurityEvents) {
        await logSecurityEvent('db_query_failed', 'medium', {
          table,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      throw error;
    }
  }, [logSecurityEvent]);

  return {
    secureInvoke,
    secureQuery
  };
};