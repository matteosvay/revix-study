import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

type AuthCtx = { user: User | null; session: Session | null; loading: boolean };
const Ctx = createContext<AuthCtx>({ user: null, session: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const readyRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session: restoredSession } }) => {
      if (!mounted) return;
      setSession(restoredSession);
      setUser(restoredSession?.user ?? null);
      readyRef.current = true;
      setLoading(false);
    }).catch(() => {
      if (!mounted) return;
      setSession(null);
      setUser(null);
      readyRef.current = true;
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (readyRef.current) setLoading(false);
      // Applique un code de parrainage en attente après login/confirmation email
      if (nextSession?.user) {
        try {
          const pending = localStorage.getItem("revix_pending_referral");
          if (pending) {
            try { localStorage.removeItem("revix_pending_referral"); } catch {/* noop */}
            supabase.rpc("apply_referral_code", { _code: pending });
          }
        } catch {/* noop */}
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return <Ctx.Provider value={{ user, session, loading }}>{children}</Ctx.Provider>;
};

export const useAuth = () => useContext(Ctx);