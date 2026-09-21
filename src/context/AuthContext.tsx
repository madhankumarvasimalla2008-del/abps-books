'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Role } from '@/types';
import { supabaseBrowser } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  role: Role;
  isLoading: boolean;
  loginAs: (role: Role) => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName?: string, phone?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  refreshSession: () => Promise<void>;
}

export const DEMO_USERS: Record<Role, User> = {
  customer: {
    id: 'u1',
    name: 'Priya Desai',
    email: 'priya.desai@abps.edu',
    phone: '9876543210',
    role: 'customer',
    branchId: 'b1',
    branchName: 'The Aditya Birla Public School, Kharach',
    createdAt: '2024-01-15',
  },
  branch_admin: {
    id: 'u2',
    name: 'Vikram Patel',
    email: 'vikram.p@abps.edu',
    phone: '9876543211',
    role: 'branch_admin',
    branchId: 'b2',
    branchName: 'The Aditya Birla Public School, Renukoot',
    createdAt: '2024-01-10',
  },
  admin: {
    id: 'u_admin',
    name: 'Rajesh Sharma (Owner)',
    email: 'admin@birlabooks.in',
    phone: '9820011223',
    role: 'admin',
    createdAt: '2023-05-01',
  },
  warehouse: {
    id: 'u_wh',
    name: 'Suresh Kumar',
    email: 'warehouse@birlabooks.in',
    phone: '9820055443',
    role: 'warehouse',
    createdAt: '2023-08-12',
  },
  sales: {
    id: 'u_sales',
    name: 'Ananya Verma',
    email: 'sales@birlabooks.in',
    phone: '9820099887',
    role: 'sales',
    createdAt: '2023-09-20',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(DEMO_USERS.customer);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const syncServerSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const json = await res.json();
        if (json?.data?.authenticated && json.data.user) {
          const authUser = json.data.user;
          setUser({
            id: authUser.userId,
            name: authUser.fullName || authUser.email.split('@')[0],
            email: authUser.email,
            phone: '',
            role: authUser.role as Role,
            branchId: authUser.branchId || undefined,
            createdAt: new Date().toISOString(),
          });
          return;
        }
      }
    } catch {
      // Offline or network error - retain current state
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (!supabaseBrowser) {
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabaseBrowser.auth.getSession();
        if (session?.user && mounted) {
          await syncServerSession();
        }
      } catch {
        // Fallback to demo persona
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initAuth();

    if (supabaseBrowser) {
      const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          await syncServerSession();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, [syncServerSession]);

  const loginAs = (role: Role) => {
    setUser(DEMO_USERS[role] || DEMO_USERS.customer);
  };

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    if (!supabaseBrowser) {
      return { error: 'Supabase client is not initialized' };
    }
    try {
      const { data, error } = await supabaseBrowser.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        return { error: error.message };
      }
      if (data.user) {
        await syncServerSession();
      }
      return { error: null };
    } catch (err: any) {
      return { error: err?.message || 'Failed to sign in' };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName?: string,
    phone?: string
  ): Promise<{ error: string | null }> => {
    if (!supabaseBrowser) {
      return { error: 'Supabase client is not initialized' };
    }
    try {
      const { error } = await supabaseBrowser.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
          },
        },
      });
      if (error) {
        return { error: error.message };
      }
      return { error: null };
    } catch (err: any) {
      return { error: err?.message || 'Failed to sign up' };
    }
  };

  const signOut = async () => {
    if (supabaseBrowser) {
      try {
        await supabaseBrowser.auth.signOut();
      } catch {
        // Ignore error on sign out
      }
    }
    setUser(null);
  };

  const logout = () => {
    signOut();
  };

  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    if (!supabaseBrowser) {
      return { error: 'Supabase client is not initialized' };
    }
    try {
      const { error } = await supabaseBrowser.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined,
      });
      if (error) {
        return { error: error.message };
      }
      return { error: null };
    } catch (err: any) {
      return { error: err?.message || 'Failed to request password reset' };
    }
  };

  const updatePassword = async (password: string): Promise<{ error: string | null }> => {
    if (!supabaseBrowser) {
      return { error: 'Supabase client is not initialized' };
    }
    try {
      const { error } = await supabaseBrowser.auth.updateUser({
        password,
      });
      if (error) {
        return { error: error.message };
      }
      return { error: null };
    } catch (err: any) {
      return { error: err?.message || 'Failed to update password' };
    }
  };

  const refreshSession = async () => {
    await syncServerSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'customer',
        isLoading,
        loginAs,
        signIn,
        signUp,
        signOut,
        logout,
        resetPassword,
        updatePassword,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
