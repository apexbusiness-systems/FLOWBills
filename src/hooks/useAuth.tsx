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
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }

      return data?.role || null;
    } catch (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const initAuth = async () => {
      try {
        console.log('[FlowBills Auth] Initializing authentication...');
        
        // Add timeout protection (5 seconds)
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Auth initialization timeout')), 5000);
        });

        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;
        
        clearTimeout(timeoutId);
        
        if (!mounted) return;
        
        if (error) {
          console.error('[FlowBills Auth] Error getting session:', error);
        } else {
          console.log('[FlowBills Auth] Session initialized:', session ? 'Authenticated' : 'Not authenticated');
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch role without blocking
          fetchUserRole(session.user.id).then(role => {
            if (mounted) setUserRole(role);
          });
        }
      } catch (error) {
        console.error('[FlowBills Auth] Auth initialization error:', error);
        // Still set loading to false even on timeout/error
        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          console.log('[FlowBills Auth] Loading complete');
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('[FlowBills Auth] Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch role without blocking
          fetchUserRole(session.user.id).then(role => {
            if (mounted) setUserRole(role);
          });
        } else {
          setUserRole(null);
        }
      }
    );

    // Initialize auth
    initAuth();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
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