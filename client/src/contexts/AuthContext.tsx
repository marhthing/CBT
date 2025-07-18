import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
}

interface Profile {
  id: string;
  email: string;
  fullName: string | null;
  role: 'student' | 'teacher' | 'admin';
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: { user: User; profile: Profile } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, role: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<{ user: User; profile: Profile } | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.user && data.profile) {
          setUser(data.user);
          setProfile(data.profile);
          setSession({ user: data.user, profile: data.profile });
        } else {
          // No active session, ensure user is logged out
          setUser(null);
          setProfile(null);
          setSession(null);
          // Clear any potential stale session data
          await fetch('/api/auth/signout', {
            method: 'POST',
            credentials: 'include',
          }).catch(() => {
            // Ignore errors if signout fails
          });
        }
      } else {
        // Session check failed, clear everything
        setUser(null);
        setProfile(null);
        setSession(null);
      }
    } catch (error) {
      console.error('Error checking session:', error);
      setUser(null);
      setProfile(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        setProfile(data.profile);
        setSession({ user: data.user, profile: data.profile });
        return { error: null };
      } else {
        return { error: { message: data.error } };
      }
    } catch (error) {
      return { error: { message: 'Network error' } };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: string) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, fullName, role }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return { error: null };
      } else {
        return { error: { message: data.error } };
      }
    } catch (error) {
      return { error: { message: 'Network error' } };
    }
  };

  const signOut = async () => {
    try {
      await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
      });
      
      setUser(null);
      setProfile(null);
      setSession(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};