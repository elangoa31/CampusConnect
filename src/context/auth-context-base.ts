import { createContext } from 'react';
import type {
  LoginFormData,
  SignupFormData,
  UserProfile,
  UserRole,
} from '../types/auth.types';

export interface AuthContextType {
  user: any;
  profile: UserProfile | null;
  isLoading: boolean;
  isConfigured: boolean;
  error: string | null;
  setError: (err: string | null) => void;
  intendedRole: UserRole | null;
  setIntendedRole: (role: UserRole | null) => void;
  login: (data: LoginFormData, expectedRole?: UserRole) => Promise<UserProfile | null>;
  signup: (data: SignupFormData) => Promise<{ needsEmailVerification: boolean }>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: (intendedRole?: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
