import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useClerk, useUser } from '@clerk/clerk-react';

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user, isLoaded } = useUser();
  const { signIn, signOut } = useClerk();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(!isLoaded);
  }, [isLoaded]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });
      setLoading(false);
      return result;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut();
      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  // Check if user is admin based on Clerk user metadata
  const isAdmin = () => {
    return user?.publicMetadata?.role === 'admin' || user?.privateMetadata?.role === 'admin';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin }}>
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