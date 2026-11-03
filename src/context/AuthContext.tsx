import React, { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { AuthService } from '../services/auth.service';
import { AuthContext } from './auth-context-base';
import type {
  LoginFormData,
  SignupFormData,
  UserProfile,
  UserRole,
} from '../types/auth.types';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isConfigured = isSupabaseConfigured();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => isConfigured);
  const [error, setError] = useState<string | null>(null);
  const [intendedRole, setIntendedRoleState] = useState<UserRole | null>(() => {
    const saved = sessionStorage.getItem('campusconnect_intended_role');
    return (saved === 'student' || saved === 'staff') ? saved : null;
  });

  const setIntendedRole = (role: UserRole | null) => {
    setIntendedRoleState(role);
    if (role) {
      sessionStorage.setItem('campusconnect_intended_role', role);
    } else {
      sessionStorage.removeItem('campusconnect_intended_role');
    }
  };

  const loadUserProfile = async (userId: string, userRecord?: any) => {
    try {
      const prof = await AuthService.getCurrentProfile(userId, userRecord);
      setProfile(prof);
      return prof;
    } catch (err: any) {
      console.warn('Failed to load profile:', err.message);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await loadUserProfile(user.id, user);
    }
  };

  useEffect(() => {
    if (!isConfigured) {
      return;
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadUserProfile(session.user.id, session.user);
      }
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });

    const { data: { subscription } } = AuthService.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadUserProfile(session.user.id, session.user);
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [isConfigured]);

  const login = async (data: LoginFormData, expectedRole?: UserRole): Promise<UserProfile | null> => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await AuthService.signInWithEmail(data, expectedRole);
      setUser(result.user);
      setProfile(result.profile);
      return result.profile;
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: SignupFormData) => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await AuthService.signUpWithEmail(data);
      // Ensure session is cleared so user can complete registration screen and log in through login portal
      if (result.session) {
        await supabase.auth.signOut();
      }
      setUser(null);
      setProfile(null);
      return { needsEmailVerification: result.needsEmailVerification };
    } catch (err: any) {
      setError(err.message || 'Failed to create account.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    setIsLoading(true);
    try {
      await AuthService.sendPasswordResetEmail(email);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async (roleOverride?: UserRole) => {
    setError(null);
    try {
      await AuthService.signInWithGoogle(roleOverride || intendedRole || undefined);
    } catch (err: any) {
      setError(err.message || 'Google sign-in could not be initiated.');
      throw err;
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await AuthService.signOut();
      setUser(null);
      setProfile(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStudentProfile = async (data: {
    fullName: string;
    department: string;
    registerNumber: string;
    yearOfStudy: string;
  }): Promise<UserProfile> => {
    if (!user?.id) {
      throw new Error('No authenticated user session found');
    }
    setError(null);
    setIsLoading(true);
    try {
      const updated = await AuthService.updateStudentProfile(user.id, data);
      setProfile(updated);
      setUser((prev: any) => ({
        ...prev,
        user_metadata: {
          ...prev?.user_metadata,
          full_name: data.fullName.trim(),
          role: 'student',
          department: data.department.trim(),
          register_number: data.registerNumber.trim(),
          year_of_study: data.yearOfStudy.trim(),
        },
      }));
      return updated;
    } catch (err: any) {
      setError(err.message || 'Failed to update student profile.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isConfigured,
        error,
        setError,
        intendedRole,
        setIntendedRole,
        login,
        signup,
        resetPassword,
        signInWithGoogle,
        signOut,
        refreshProfile,
        updateStudentProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
