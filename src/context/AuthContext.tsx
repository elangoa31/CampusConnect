import React, { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { AuthService, INTENDED_ROLE_STORAGE_KEY } from '../services/auth.service';
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
    try {
      const savedSession = typeof sessionStorage !== 'undefined'
        ? sessionStorage.getItem(INTENDED_ROLE_STORAGE_KEY)
        : null;
      if (savedSession === 'student' || savedSession === 'staff') return savedSession;

      const savedLocal = typeof localStorage !== 'undefined'
        ? localStorage.getItem(INTENDED_ROLE_STORAGE_KEY)
        : null;
      if (savedLocal === 'student' || savedLocal === 'staff') return savedLocal;
    } catch {
      // Ignore storage errors
    }
    return null;
  });

  const setIntendedRole = (role: UserRole | null) => {
    setIntendedRoleState(role);
    try {
      if (role) {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(INTENDED_ROLE_STORAGE_KEY, role);
        }
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(INTENDED_ROLE_STORAGE_KEY, role);
        }
      } else {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem(INTENDED_ROLE_STORAGE_KEY);
        }
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(INTENDED_ROLE_STORAGE_KEY);
        }
      }
    } catch {
      // Ignore storage errors
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
