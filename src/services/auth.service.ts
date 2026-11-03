import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type {
  LoginFormData,
  SignupFormData,
  UserProfile,
  UserRole,
} from '../types/auth.types';

export class AuthService {
  /**
   * Sign in using college email and password with role verification
   */
  static async signInWithEmail(
    data: LoginFormData,
    expectedRole?: UserRole
  ): Promise<{
    user: any;
    session: any;
    profile: UserProfile | null;
  }> {
    if (!isSupabaseConfigured()) {
      throw new Error(
        'Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
      );
    }

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email.trim(),
      password: data.password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!authData.user) {
      throw new Error('Authentication succeeded but user record was not returned.');
    }

    // Retrieve the user profile from database
    const profile = await this.getCurrentProfile(authData.user.id);

    // Verify role matches selected portal
    if (expectedRole && profile && profile.role !== expectedRole) {
      await supabase.auth.signOut();
      const actualLabel = profile.role === 'student' ? 'Student' : 'Faculty / Staff';
      const expectedLabel = expectedRole === 'student' ? 'Student' : 'Faculty / Staff';
      throw new Error(
        `Role mismatch: This account is registered as ${actualLabel}. You cannot sign in through the ${expectedLabel} portal. Please sign in via the ${actualLabel} portal.`
      );
    }

    return {
      user: authData.user,
      session: authData.session,
      profile,
    };
  }

  /**
   * Register a new Student or Staff account
   */
  static async signUpWithEmail(data: SignupFormData): Promise<{
    user: any;
    session: any;
    profile: UserProfile | null;
    needsEmailVerification: boolean;
  }> {
    if (!isSupabaseConfigured()) {
      throw new Error(
        'Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
      );
    }

    // Pass role and custom attributes into raw_user_meta_data
    const metaData: Record<string, any> = {
      full_name: data.fullName.trim(),
      role: data.role,
      department: data.department.trim(),
    };

    if (data.role === 'student') {
      metaData.register_number = data.registerNumber?.trim();
      metaData.year_of_study = data.yearOfStudy?.trim();
    } else if (data.role === 'staff') {
      metaData.employee_id = data.employeeId?.trim();
      metaData.designation = data.designation?.trim();
    }

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email.trim(),
      password: data.password,
      options: {
        data: metaData,
        emailRedirectTo: `${window.location.origin}/login?role=${data.role}`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!authData.user) {
      throw new Error('Registration failed to create user record.');
    }

    // If email confirmation is enabled, session will be null
    const needsEmailVerification = !authData.session;

    // Check if profile was created via database trigger or try direct upsert
    let profile: UserProfile | null = null;
    try {
      if (authData.session) {
        // Direct upsert to ensure profile is populated immediately if trigger isn't applied yet
        const { data: profileData } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: data.email.trim(),
            full_name: data.fullName.trim(),
            role: data.role,
            department: data.department.trim(),
            register_number: data.role === 'student' ? data.registerNumber?.trim() : null,
            year_of_study: data.role === 'student' ? data.yearOfStudy?.trim() : null,
            employee_id: data.role === 'staff' ? data.employeeId?.trim() : null,
            designation: data.role === 'staff' ? data.designation?.trim() : null,
          })
          .select()
          .single();

        profile = profileData as UserProfile;
      }
    } catch {
      // If table doesn't exist yet, we still construct the client profile representation from metadata
      profile = {
        id: authData.user.id,
        email: data.email.trim(),
        full_name: data.fullName.trim(),
        role: data.role,
        department: data.department.trim(),
        register_number: data.role === 'student' ? data.registerNumber?.trim() : null,
        year_of_study: data.role === 'student' ? data.yearOfStudy?.trim() : null,
        employee_id: data.role === 'staff' ? data.employeeId?.trim() : null,
        designation: data.role === 'staff' ? data.designation?.trim() : null,
      };
    }

    return {
      user: authData.user,
      session: authData.session,
      profile,
      needsEmailVerification,
    };
  }

  /**
   * Request password recovery link for registered college email
   */
  static async sendPasswordResetEmail(email: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error(
        'Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
      );
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Sign in with Google OAuth using Supabase
   */
  static async signInWithGoogle(intendedRole?: UserRole): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error(
        'Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
      );
    }

    const redirectPath = intendedRole ? `/login?role=${intendedRole}` : '/login';

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${redirectPath}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Get current authenticated user profile
   */
  static async getCurrentProfile(userId: string): Promise<UserProfile | null> {
    if (!isSupabaseConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Could not fetch profile from profiles table:', error.message);
        // Fallback to auth metadata if profile table is not yet provisioned
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.user_metadata) {
          const meta = userData.user.user_metadata;
          return {
            id: userId,
            email: userData.user.email || '',
            full_name: meta.full_name || 'CampusConnect User',
            role: (meta.role as 'student' | 'staff') || 'student',
            department: meta.department || 'General',
            register_number: meta.register_number,
            year_of_study: meta.year_of_study,
            employee_id: meta.employee_id,
            designation: meta.designation,
          };
        }
        return null;
      }

      return data as UserProfile;
    } catch {
      return null;
    }
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  }

  /**
   * Auth state listener
   */
  static onAuthStateChange(
    callback: (event: string, session: any) => void
  ) {
    return supabase.auth.onAuthStateChange(callback);
  }
}
