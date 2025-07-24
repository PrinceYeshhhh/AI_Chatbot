import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@clerk/clerk-react'
import { auth } from '../lib/auth'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>
  signUp: (email: string, password: string) => Promise<{ data: any; error: any }>
  signOut: () => Promise<{ error: any }>
  getToken: () => string | null;
}

export const AuthContext = React.createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({ data: null, error: null }),
  signUp: async () => ({ data: null, error: null }),
  signOut: async () => ({ error: null }),
  getToken: () => null,
})

export const useAuth = () => React.useContext(AuthContext)

interface E2EEContextType {
  password: string;
  setPassword: (pw: string) => void;
  salt: string;
}

export const E2EEContext = createContext<E2EEContextType | undefined>(undefined);

export const useE2EE = () => {
  const context = useContext(E2EEContext);
  if (context === undefined) {
    throw new Error('useE2EE must be used within an E2EEProvider');
  }
  return context;
};

export const E2EEProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const salt = user?.id || '';
  return (
    <E2EEContext.Provider value={{ password, setPassword, salt }}>
      {children}
    </E2EEContext.Provider>
  );
};

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Use impersonation token if present
  const getToken = () => {
    return localStorage.getItem('impersonationToken') || session?.token;
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { session, error } = await auth.getSession()
        if (error) {
          console.error('Error getting session:', error)
        } else {
          setSession(session)
          setUser(session?.user ?? null)
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    return await auth.signUp(email, password)
  }

  const signIn = async (email: string, password: string) => {
    return await auth.signIn(email, password)
  }

  const signOut = async () => {
    localStorage.removeItem('impersonationToken');
    return await auth.signOut()
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    // Optionally expose getToken for API calls
    getToken,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 