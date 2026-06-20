import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isTasker: boolean;
  needsOnboarding: boolean;
  bankidVerified: boolean;
  profileLoaded: boolean;
  signOut: () => Promise<void>;
  refreshTaskerStatus: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTasker, setIsTasker] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [bankidVerified, setBankidVerified] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const loadProfileFlags = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("onboarding_completed, bankid_verified" as any)
      .eq("id", userId)
      .maybeSingle();
    const completed = (data as any)?.onboarding_completed === true;
    setNeedsOnboarding(!completed);
    setBankidVerified((data as any)?.bankid_verified === true);
    setProfileLoaded(true);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(async () => {
            const { data: roles } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", session.user.id);
            setIsAdmin(roles?.some((r) => r.role === "admin") ?? false);

            const { data: taskerProfile } = await supabase
              .from("tasker_profiles")
              .select("id")
              .eq("user_id", session.user.id)
              .maybeSingle();
            setIsTasker(!!taskerProfile);

            if (session.user.email_confirmed_at) {
              await supabase
                .from("profiles")
                .update({ email_verified: true })
                .eq("id", session.user.id)
                .eq("email_verified", false);
            }

            // Mark google_connected if signed in with Google
            const hasGoogle = session.user.app_metadata?.providers?.includes?.("google")
              || session.user.app_metadata?.provider === "google";
            if (hasGoogle) {
              await supabase
                .from("profiles")
                .update({ google_connected: true } as any)
                .eq("id", session.user.id);
            }

            await loadProfileFlags(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setIsTasker(false);
          setNeedsOnboarding(false);
          setBankidVerified(false);
          setProfileLoaded(false);
        }

        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfileFlags(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [loadProfileFlags]);

  const refreshTaskerStatus = async () => {
    if (!user) return;
    const { data: taskerProfile } = await supabase
      .from("tasker_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    setIsTasker(!!taskerProfile);
  };

  const refreshProfile = async () => {
    if (!user) return;
    await loadProfileFlags(user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setIsTasker(false);
    setNeedsOnboarding(false);
    setBankidVerified(false);
    setProfileLoaded(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAdmin,
        isTasker,
        needsOnboarding,
        bankidVerified,
        profileLoaded,
        signOut,
        refreshTaskerStatus,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
