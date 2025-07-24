import { ClerkProvider, useAuth } from '@clerk/clerk-react';

// Auth helper functions using Clerk
export const auth = {
  // Sign up with email and password
  signUp: async (email: string, password: string) => {
    try {
      const { signUp } = useAuth();
      const result = await signUp.create({
        emailAddress: email,
        password,
      });
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    try {
      const { signIn } = useAuth();
      const result = await signIn.create({
        identifier: email,
        password,
      });
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Sign out
  signOut: async () => {
    try {
      const { signOut } = useAuth();
      await signOut();
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  // Get current session
  getSession: async () => {
    try {
      const { session } = useAuth();
      return { session, error: null };
    } catch (error) {
      return { session: null, error };
    }
  },

  // Get current user
  getUser: async () => {
    try {
      const { user } = useAuth();
      return { user, error: null };
    } catch (error) {
      return { user: null, error };
    }
  },

  // Listen to auth changes
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    const { session } = useAuth();
    // Clerk handles auth state changes automatically
    return () => {}; // Return cleanup function
  }
};

export default auth; 