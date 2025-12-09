import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: string | null;
  signOut: () => Promise<void>;
  hasRole: (role: "admin" | "operator" | "viewer") => boolean;
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
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("Error fetching user role:", error);
        return null;
      }

      return data?.role || null;
    } catch (error) {
      console.error("Error fetching user role:", error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Safety timeout - ensure loading never hangs forever
    const safetyTimeout = setTimeout(() => {
      if (mounted) {
        if (import.meta.env.DEV) {
          console.log("[Auth] Safety timeout triggered - forcing loading to false");
        }
        setLoading(false);
      }
    }, 5000);

    const initAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error && import.meta.env.DEV) {
          console.error("[Auth] Error getting session:", error);
        }

        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const role = await fetchUserRole(session.user.id);
          if (mounted) {
            setUserRole(role);
          }
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("[Auth] Initialization error:", error);
        }
        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // CRITICAL: Make callback synchronous to prevent Supabase deadlock
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (import.meta.env.DEV) {
        console.log("[Auth] State changed:", event, "User:", session?.user?.email);
      }

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false); // Always set loading to false on auth change

      if (session?.user) {
        // Defer Supabase calls with setTimeout to prevent deadlock
        setTimeout(() => {
          fetchUserRole(session.user.id).then((role) => {
            if (mounted) setUserRole(role);
          });
        }, 0);
      } else {
        setUserRole(null);
      }
    });

    initAuth();

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
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
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const hasRole = (role: "admin" | "operator" | "viewer"): boolean => {
    if (!userRole) return false;

    // Admin has all permissions
    if (userRole === "admin") return true;

    // Operator has operator and viewer permissions
    if (userRole === "operator" && (role === "operator" || role === "viewer")) return true;

    // Viewer only has viewer permissions
    if (userRole === "viewer" && role === "viewer") return true;

    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        userRole,
        signOut,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
