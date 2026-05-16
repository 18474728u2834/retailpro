import { useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signInWithDiscord = () => {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/discord-oauth?action=login&origin=${encodeURIComponent(window.location.origin)}`;
    window.location.href = url;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { session, user, loading, signInWithDiscord, signOut };
}
