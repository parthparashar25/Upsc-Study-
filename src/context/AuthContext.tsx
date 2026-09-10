"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Profile } from '@/types/database';
import { fetchProfile, updateProfileData } from '@/lib/api';

const LS_DEMO_USER = 'upsc_demo_user';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isDemo: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, optionalSubject?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<boolean>;
  setDemoMode: (enable: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(!isSupabaseConfigured);

  // Initialize auth state
  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Check if user previously signed in via demo session in localStorage
      try {
        const storedDemo = localStorage.getItem(LS_DEMO_USER);
        if (storedDemo) {
          const parsed = JSON.parse(storedDemo);
          setUser(parsed.user);
          setProfile(parsed.profile);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch {
        setUser(null);
        setProfile(null);
      }
      setIsDemo(true);
      setLoading(false);
      return;
    }

    // Check active sessions from Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const p = await fetchProfile(session.user.id);
        setProfile(p);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (user) {
      const p = await fetchProfile(user.id);
      setProfile(p);
    }
  };

  const updateProfile = async (data: Partial<Profile>): Promise<boolean> => {
    if (!user) return false;
    const ok = await updateProfileData(user.id, data);
    if (ok) {
      setProfile(prev => (prev ? { ...prev, ...data } : null));
    }
    return ok;
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      const demoUser: any = {
        id: 'demo-user-123',
        email,
        user_metadata: { full_name: email.split('@')[0] },
      };
      const demoProfile: Profile = {
        id: 'demo-user-123',
        full_name: email.split('@')[0],
        email,
        optional_subject: 'Anthropology',
        daily_study_target: 4,
      };
      setUser(demoUser);
      setProfile(demoProfile);
      setIsDemo(true);
      try {
        localStorage.setItem(LS_DEMO_USER, JSON.stringify({ user: demoUser, profile: demoProfile }));
      } catch (err) {
        console.error(err);
      }
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error ? new Error(error.message) : null };
    } catch (err: any) {
      return { error: new Error(err.message || 'Login failed') };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, optionalSubject?: string) => {
    if (!isSupabaseConfigured) {
      const demoUser: any = {
        id: `user-${Date.now()}`,
        email,
        user_metadata: { full_name: fullName },
      };
      const demoProfile: Profile = {
        id: demoUser.id,
        full_name: fullName,
        email,
        optional_subject: optionalSubject || 'General',
        daily_study_target: 4,
      };
      setUser(demoUser);
      setProfile(demoProfile);
      setIsDemo(true);
      try {
        localStorage.setItem(LS_DEMO_USER, JSON.stringify({ user: demoUser, profile: demoProfile }));
      } catch (err) {
        console.error(err);
      }
      return { error: null };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            optional_subject: optionalSubject || '',
          },
        },
      });

      if (error) return { error: new Error(error.message) };

      if (data.user) {
        // Ensure profile exists immediately
        await updateProfileData(data.user.id, {
          full_name: fullName,
          optional_subject: optionalSubject || '',
          daily_study_target: 4,
        });
      }

      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.message || 'Signup failed') };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    try {
      localStorage.removeItem(LS_DEMO_USER);
    } catch (err) {
      console.error(err);
    }
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured) {
      return { error: null };
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error: error ? new Error(error.message) : null };
    } catch (err: any) {
      return { error: new Error(err.message || 'Password reset failed') };
    }
  };

  const setDemoMode = (enable: boolean) => {
    setIsDemo(enable);
    if (enable) {
      const demoUser = {
        id: 'demo-user-123',
        email: 'aspirant@upsc.test',
      } as User;
      const demoProfile = {
        id: 'demo-user-123',
        full_name: 'UPSC Aspirant',
        email: 'aspirant@upsc.test',
        optional_subject: 'Anthropology',
        daily_study_target: 4,
      };
      setUser(demoUser);
      setProfile(demoProfile);
      try {
        localStorage.setItem(LS_DEMO_USER, JSON.stringify({ user: demoUser, profile: demoProfile }));
      } catch (err) {
        console.error(err);
      }
    } else {
      signOut();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isDemo,
        signIn,
        signUp,
        signOut,
        resetPassword,
        refreshProfile,
        updateProfile,
        setDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
