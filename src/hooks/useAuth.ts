import { useEffect, useState, useCallback } from 'react';
import { supabase, getSession, signOut, getProfile } from '../services/supabaseClient';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    setLoading(true);
    const session = await getSession();
    setUser(session?.user ?? null);
    setLoading(false);
  }, []);

  const refreshProfile = useCallback(async (userId?: string) => {
    if (!userId) return setProfile(null);
    const { data, error } = await getProfile(userId);
    setProfile(error ? null : data);
  }, []);

  useEffect(() => {
    refreshSession();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      refreshSession();
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [refreshSession]);

  useEffect(() => {
    if (user?.id) {
      refreshProfile(user.id);
    } else {
      setProfile(null);
    }
  }, [user, refreshProfile]);

  return {
    user,
    profile,
    loading,
    signOut: async () => {
      await signOut();
      setUser(null);
      setProfile(null);
    },
    refreshSession,
    refreshProfile
  };
} 