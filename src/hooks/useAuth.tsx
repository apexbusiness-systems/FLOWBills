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
  console.log('[FlowBills Auth] AuthProvider component rendering...');
  
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  console.log('[FlowBills Auth] Current loading state:', loading);
  
  const navigate = useNavigate();
  console.log('[FlowBills Auth] useNavigate hook initialized');

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
    console.log('[FlowBills Auth] useEffect STARTING - This proves useEffect is executing');
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const initAuth = async () => {
      console.log('[FlowBills Auth] initAuth function called');
      try {
        console.log('[FlowBills Auth] About to call supabase.auth.getSession()...');
        
        // Reduce timeout to 3 seconds for faster feedback
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            console.log('[FlowBills Auth] TIMEOUT FIRED - Supabase took too long!');
            reject(new Error('Auth initialization timeout after 3 seconds'));
          }, 3000);
        });

        const sessionPromise = supabase.auth.getSession().then(result => {
          console.log('[FlowBills Auth] Supabase getSession returned:', result);
          return result;
        });

        const result = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;
        
        clearTimeout(timeoutId);
        console.log('[FlowBills Auth] Promise.race completed, result:', result);
        
        if (!mounted) {
          console.log('[FlowBills Auth] Component unmounted, aborting');
          return;
        }
        
        const { data: { session }, error } = result;
        
        if (error) {
          console.error('[FlowBills Auth] Error getting session:', error);
        } else {
          console.log('[FlowBills Auth] Session initialized successfully:', session ? 'Authenticated' : 'Not authenticated');
        }

        console.log('[FlowBills Auth] Setting session and user state...');
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('[FlowBills Auth] User found, fetching role...');
          fetchUserRole(session.user.id).then(role => {
            if (mounted) {
              console.log('[FlowBills Auth] User role fetched:', role);
              setUserRole(role);
            }
          });
        } else {
          console.log('[FlowBills Auth] No user in session');
        }
      } catch (error) {
        console.error('[FlowBills Auth] CAUGHT ERROR in initAuth:', error);
        // Still set loading to false even on timeout/error
        if (mounted) {
          console.log('[FlowBills Auth] Setting null session/user due to error');
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          console.log('[FlowBills Auth] Setting loading = FALSE');
          setLoading(false);
        }
      }
    };

    console.log('[FlowBills Auth] Setting up auth state listener...');
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('[FlowBills Auth] Auth state changed:', event, session ? 'with session' : 'no session');
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          fetchUserRole(session.user.id).then(role => {
            if (mounted) setUserRole(role);
          });
        } else {
          setUserRole(null);
        }
      }
    );
    console.log('[FlowBills Auth] Auth state listener setup complete');

    // Initialize auth
    console.log('[FlowBills Auth] Calling initAuth()...');
    initAuth();
    console.log('[FlowBills Auth] initAuth() called (async function started)');

    return () => {
      console.log('[FlowBills Auth] Cleanup function running');
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