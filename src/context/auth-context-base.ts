import { createContext } from 'react';
import type {
  LoginFormData,
  SignupFormData,
  UserProfile,
} from '../types/auth.types';

export interface AuthContextType {
  user: any;
  profile: UserProfile | null;
  isLoading: boolean;
  isConfigured: boolean;
  error: string | null;
  setError: (err: string | null) => void;
  login: (data: LoginFormData) => Promise<void>;
  signup: (data: SignupFormData) => Promise<{ needsEmailVerification: boolean }>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
