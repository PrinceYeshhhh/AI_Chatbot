import { useEffect, useState, useCallback } from 'react';
import { useClerk, useUser } from '@clerk/clerk-react';

export function useAuth() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async (userId?: string) => {
    if (!userId) return setProfile(null);
    // For Clerk, user profile is already available in user object
    setProfile(user);
  }, [user]);

  useEffect(() => {
    setLoading(!isLoaded);
  }, [isLoaded]);

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
      setProfile(null);
    },
    refreshSession: () => {}, // Clerk handles session automatically
    refreshProfile
  };
} 