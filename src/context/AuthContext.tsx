"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, normalizeUserIdentifier, getDisplayUsername } from '@/lib/supabase';
import { Profile } from '@/types/database';
import { fetchProfile, updateProfileData } from '@/lib/api';
import {
  isBiometricsSupported,
  getStoredBiometrics,
  clearStoredBiometrics,
  registerBiometricCredential,
  authenticateWithBiometrics,
} from '@/lib/biometrics';

const LS_DEMO_USER = 'upsc_demo_user';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isDemo: boolean;
  isBiometricsAvailable: boolean;
  hasBiometrics: boolean;
  signIn: (usernameOrEmail: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (usernameOrEmail: string, password: string, fullName: string, optionalSubject?: string, customUsername?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithApple: () => Promise<{ error: Error | null }>;
  signInWithBiometrics: () => Promise<{ success: boolean; error?: string }>;
  enableBiometrics: (password: string) => Promise<{ success: boolean; error?: string }>;
  disableBiometrics: () => void;
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
  const [isBiometricsAvailable, setIsBiometricsAvailable] = useState(false);
  const [hasBiometrics, setHasBiometrics] = useState(false);

  // Initialize auth state & biometric capabilities
  useEffect(() => {
    isBiometricsSupported().then((avail) => {
      setIsBiometricsAvailable(avail);
      setHasBiometrics(Boolean(getStoredBiometrics()));
    });

    if (!isSupabaseConfigured) {
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
      setProfile((prev) => (prev ? { ...prev, ...data } : null));
    }
    return ok;
  };

  const signIn = async (usernameOrEmail: string, password: string) => {
    const identifier = normalizeUserIdentifier(usernameOrEmail);
    const displayUser = getDisplayUsername(usernameOrEmail);

    if (!isSupabaseConfigured) {
      const demoUser: any = {
        id: 'demo-user-123',
        email: identifier,
        user_metadata: { full_name: displayUser },
      };
      const demoProfile: Profile = {
        id: 'demo-user-123',
        full_name: displayUser,
        email: identifier,
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
      const { error } = await supabase.auth.signInWithPassword({
        email: identifier,
        password,
      });
      return { error: error ? new Error(error.message) : null };
    } catch (err: any) {
      return { error: new Error(err.message || 'Login failed') };
    }
  };

  const signUp = async (
    usernameOrEmail: string,
    password: string,
    fullName: string,
    optionalSubject?: string,
    customUsername?: string
  ) => {
    const identifier = normalizeUserIdentifier(customUsername || usernameOrEmail);
    const displayName = fullName || getDisplayUsername(customUsername || usernameOrEmail);

    if (!isSupabaseConfigured) {
      const demoUser: any = {
        id: `user-${Date.now()}`,
        email: identifier,
        user_metadata: { full_name: displayName },
      };
      const demoProfile: Profile = {
        id: demoUser.id,
        full_name: displayName,
        email: identifier,
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
        email: identifier,
        password,
        options: {
          data: {
            full_name: displayName,
            optional_subject: optionalSubject || '',
            username: customUsername || getDisplayUsername(usernameOrEmail),
          },
        },
      });

      if (error) return { error: new Error(error.message) };

      if (data.user) {
        await updateProfileData(data.user.id, {
          full_name: displayName,
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
      const identifier = normalizeUserIdentifier(email);
      const { error } = await supabase.auth.resetPasswordForEmail(identifier);
      return { error: error ? new Error(error.message) : null };
    } catch (err: any) {
      return { error: new Error(err.message || 'Password reset failed') };
    }
  };

  // OAuth methods
  const signInWithGoogle = async () => {
    try {
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : '';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });
      return { error: error ? new Error(error.message) : null };
    } catch (err: any) {
      return { error: new Error(err.message || 'Google sign in failed') };
    }
  };

  const signInWithApple = async () => {
    try {
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : '';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: redirectUrl,
        },
      });
      return { error: error ? new Error(error.message) : null };
    } catch (err: any) {
      return { error: new Error(err.message || 'Apple sign in failed') };
    }
  };

  // Biometric methods
  const signInWithBiometrics = async (): Promise<{ success: boolean; error?: string }> => {
    const res = await authenticateWithBiometrics();
    if (!res.success || !res.userIdentifier || !res.userSecretToken) {
      return { success: false, error: res.error || 'Biometric authentication failed.' };
    }

    const { error } = await signIn(res.userIdentifier, res.userSecretToken);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const enableBiometrics = async (password: string): Promise<{ success: boolean; error?: string }> => {
    const activeIdentifier = user?.email || profile?.email;
    if (!activeIdentifier) {
      return { success: false, error: 'Must be logged in to register biometrics.' };
    }
    const res = await registerBiometricCredential(activeIdentifier, password);
    if (res.success) {
      setHasBiometrics(true);
    }
    return res;
  };

  const disableBiometrics = () => {
    clearStoredBiometrics();
    setHasBiometrics(false);
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
        isBiometricsAvailable,
        hasBiometrics,
        signIn,
        signUp,
        signOut,
        resetPassword,
        signInWithGoogle,
        signInWithApple,
        signInWithBiometrics,
        enableBiometrics,
        disableBiometrics,
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
