import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  accountStatus: 'active' | 'suspended' | null;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isModerator: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [accountStatus, setAccountStatus] = useState<'active' | 'suspended' | null>(null);

  useEffect(() => {
    const syncSession = async (nextSession: Session | null) => {
      setLoading(true);
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        const isSuspended = await checkAccountStatus(nextSession.user.id);
        if (isSuspended) {
          setIsAdmin(false);
          setIsModerator(false);
          setSession(null);
          setUser(null);
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        await checkUserRoles(nextSession.user.id);
      } else {
        setIsAdmin(false);
        setIsModerator(false);
        setAccountStatus(null);
      }

      setLoading(false);
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        void syncSession(session);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      void syncSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAccountStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('app_user_profiles')
        .select('status')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching account status:', error);
        setAccountStatus('active');
        return false;
      }

      const nextStatus = data?.status === 'suspended' ? 'suspended' : 'active';
      setAccountStatus(nextStatus);
      return nextStatus === 'suspended';
    } catch (error) {
      console.error('Error in checkAccountStatus:', error);
      setAccountStatus('active');
      return false;
    }
  };

  const checkUserRoles = async (userId: string) => {
    try {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user roles:', error);
        setIsAdmin(false);
        setIsModerator(false);
        return;
      }

      const userRoles = roles?.map(r => r.role) || [];
      setIsAdmin(userRoles.includes('admin'));
      setIsModerator(userRoles.includes('moderator') || userRoles.includes('admin'));
    } catch (error) {
      console.error('Error in checkUserRoles:', error);
      setIsAdmin(false);
      setIsModerator(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setIsModerator(false);
    setAccountStatus(null);
  };

  const value = {
    user,
    session,
    loading,
    accountStatus,
    signIn,
    signUp,
    signOut,
    isAdmin,
    isModerator,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
