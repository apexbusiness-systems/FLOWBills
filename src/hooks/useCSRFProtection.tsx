import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { generateSecureToken } from '@/lib/security';

interface CSRFContextType {
  csrfToken: string | null;
  refreshToken: () => Promise<void>;
  validateAndRefreshToken: () => Promise<string | null>;
}

const CSRFContext = createContext<CSRFContextType | undefined>(undefined);

export const CSRFProvider = ({ children }: { children: ReactNode }) => {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const { user } = useAuth();

  const generateToken = async (): Promise<string> => {
    // Generate client-side token for now
    // In production, this would be generated server-side
    const token = generateSecureToken();
    
    // Store in session storage for validation
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('csrf_token', token);
      sessionStorage.setItem('csrf_token_time', Date.now().toString());
    }
    
    return token;
  };

  const refreshToken = async () => {
    const newToken = await generateToken();
    setCsrfToken(newToken);
  };

  const validateAndRefreshToken = async (): Promise<string | null> => {
    if (!user) return null;

    // Check if current token is still valid (30 minutes)
    if (typeof window !== 'undefined') {
      const storedToken = sessionStorage.getItem('csrf_token');
      const tokenTime = sessionStorage.getItem('csrf_token_time');
      
      if (storedToken && tokenTime) {
        const tokenAge = Date.now() - parseInt(tokenTime);
        const maxAge = 30 * 60 * 1000; // 30 minutes
        
        if (tokenAge < maxAge && storedToken === csrfToken) {
          return csrfToken;
        }
      }
    }

    // Generate new token if expired or missing
    await refreshToken();
    return csrfToken;
  };

  // Generate initial token when user is authenticated
  useEffect(() => {
    if (user && !csrfToken) {
      refreshToken();
    }
  }, [user, csrfToken]);

  // Refresh token periodically (every 20 minutes)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      refreshToken();
    }, 20 * 60 * 1000); // 20 minutes

    return () => clearInterval(interval);
  }, [user]);

  return (
    <CSRFContext.Provider value={{
      csrfToken,
      refreshToken,
      validateAndRefreshToken
    }}>
      {children}
    </CSRFContext.Provider>
  );
};

export const useCSRF = () => {
  const context = useContext(CSRFContext);
  if (context === undefined) {
    throw new Error('useCSRF must be used within a CSRFProvider');
  }
  return context;
};

// Enhanced fetch wrapper with CSRF protection
export const secureRequest = async (
  url: string,
  options: RequestInit = {},
  csrfToken?: string
): Promise<Response> => {
  const headers = new Headers(options.headers);
  
  // Add CSRF token for state-changing operations
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method?.toUpperCase() || 'GET')) {
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken);
    }
  }

  // Add security headers
  headers.set('X-Requested-With', 'XMLHttpRequest');
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'same-origin' // Important for CSRF protection
  });
};