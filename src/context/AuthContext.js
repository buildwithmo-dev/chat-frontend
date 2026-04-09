'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }) => {
  const supabase = createClient();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // -----------------------------
  // INIT AUTH (SOURCE OF TRUTH)
  // -----------------------------
  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session || null);
      setUser(session?.user || null);
      setLoading(false);
    };

    init();

    // -----------------------------
    // LISTEN FOR CHANGES
    // -----------------------------
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session || null);
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // -----------------------------
  // SIGN OUT
  // -----------------------------
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signOut,
        accessToken: session?.access_token || null,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

// -----------------------------
// SAFE HOOK
// -----------------------------
export const useAuth = () => useContext(AuthContext);