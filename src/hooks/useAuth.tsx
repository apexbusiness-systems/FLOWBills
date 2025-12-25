import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: string | null;
  signOut: () => Promise<void>;
  hasRole: (role: 'admin' | 'operator' | 'viewer') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch user role - completely separate from auth state change callback
  const fetchUserRole = async (userId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (import.meta.env.DEV) {
          console.error('[Auth] Error fetching user role:', error);
        }
        return null;
      }

      return data?.role || null;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Auth] Error fetching user role:', error);
      }
      return null;
    }
  };

  // Separate effect to fetch role when user changes - prevents deadlock
  useEffect(() => {
    if (!authInitialized) return;
    
    let mounted = true;
    let cancelled = false;

    if (user?.id) {
      // Use queueMicrotask to ensure this runs after current call stack
      queueMicrotask(async () => {
        if (cancelled || !mounted) return;
        const role = await fetchUserRole(user.id);
        if (mounted && !cancelled) {
          setUserRole(role);
        }
      });
    } else {
      setUserRole(null);
    }

    return () => {
      mounted = false;
      cancelled = true;
    };
  }, [user?.id, authInitialized]);

  // Initialize auth and set up state change listener
  useEffect(() => {
    let mounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    // Safety timeout - ensure loading never hangs forever
    const safetyTimeout = setTimeout(() => {
      if (mounted) {
        if (import.meta.env.DEV) {
          console.warn('[Auth] Safety timeout triggered - forcing initialization');
        }
        setLoading(false);
        setAuthInitialized(true);
      }
    }, 5000);

    // Initialize session synchronously
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error && import.meta.env.DEV) {
          console.error('[Auth] Error getting initial session:', error);
        }

        if (!mounted) return;
        
        // Set state synchronously - no async work here
        setSession(session);
        setUser(session?.user ?? null);
        setAuthInitialized(true);
        setLoading(false);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('[Auth] Initialization error:', error);
        }
        if (mounted) {
          setSession(null);
          setUser(null);
          setAuthInitialized(true);
          setLoading(false);
        }
      }
    };

    // CRITICAL: onAuthStateChange callback must be completely synchronous
    // NO async operations, NO Supabase calls, NO setTimeout - just state updates
    try {
      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(
        (event, newSession) => {
          if (!mounted) return;
          
          if (import.meta.env.DEV) {
            console.log('[Auth] State changed:', event, 'User:', newSession?.user?.email);
          }
          
          // ONLY synchronous state updates - no async work here
          setSession(newSession);
          setUser(newSession?.user ?? null);
          setAuthInitialized(true);
          setLoading(false);
          
          // Clear role if logged out - synchronous only
          if (!newSession?.user) {
            setUserRole(null);
          }
          // Role fetch will happen in separate useEffect above
        }
      );
      subscription = sub;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Auth] Error setting up auth listener:', error);
      }
      if (mounted) {
        setAuthInitialized(true);
        setLoading(false);
      }
    }

    initAuth();

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      setUserRole(null);
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const hasRole = (role: 'admin' | 'operator' | 'viewer'): boolean => {
    if (!userRole) return false;
    
    // Admin has all permissions
    if (userRole === 'admin') return true;
    
    // Operator has operator and viewer permissions
    if (userRole === 'operator' && (role === 'operator' || role === 'viewer')) return true;
    
    // Viewer only has viewer permissions
    if (userRole === 'viewer' && role === 'viewer') return true;
    
    return false;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      userRole, 
      signOut, 
      hasRole 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};