import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { getAuthRedirectUrl } from '../utils/url';
import { isNativePlatform } from '../utils/platform';
import { Browser } from '@capacitor/browser';
import type {
  LoginFormData,
  SignupFormData,
  UserProfile,
  UserRole,
  OAuthSessionResult,
} from '../types/auth.types';

export const INTENDED_ROLE_STORAGE_KEY = 'campusconnect_intended_role';

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
      if (
        error.code === 'email_not_confirmed' ||
        error.message?.toLowerCase().includes('email not confirmed')
      ) {
        throw new Error(
          'Email not confirmed yet. Please verify your email inbox or disable "Confirm email" in Supabase Auth settings to log in immediately.'
        );
      }
      if (error.message?.toLowerCase().includes('invalid login credentials')) {
        throw new Error(
          'Invalid email or password. Please check your credentials and try again.'
        );
      }
      throw new Error(error.message);
    }

    if (!authData.user) {
      throw new Error('Authentication succeeded but user record was not returned.');
    }

    // Retrieve the user profile from database with instantaneous metadata fallback
    const profile = await this.getCurrentProfile(authData.user.id, authData.user);

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
        emailRedirectTo: getAuthRedirectUrl(`/login?role=${data.role}&registered=true`),
      },
    });

    if (error) {
      if (
        error.code === 'over_email_send_rate_limit' ||
        error.message?.toLowerCase().includes('rate limit')
      ) {
        throw new Error(
          'Email rate limit exceeded by authentication service. Please wait a few minutes before trying again.'
        );
      }
      if (error.message?.toLowerCase().includes('already registered')) {
        throw new Error(
          'An account with this college email already exists. Please sign in instead.'
        );
      }
      throw new Error(error.message);
    }

    if (!authData.user) {
      throw new Error('Registration failed to create user record.');
    }

    // If email confirmation is enabled, session will be null
    const needsEmailVerification = !authData.session;

    // Check if profile was created via database trigger or try direct upsert
    let profile: UserProfile | null = null;
    if (authData.session) {
      try {
        // Direct upsert to ensure profile is populated immediately if trigger isn't applied yet
        const { data: profileData, error: profileError } = await supabase
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
          .maybeSingle();

        if (!profileError && profileData) {
          profile = profileData as UserProfile;
        }
      } catch (err) {
        console.warn('Direct profile upsert skipped:', err);
      }
    }

    if (!profile) {
      // If table doesn't exist yet or session is null, we construct the client profile representation from metadata
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
      redirectTo: getAuthRedirectUrl('/login'),
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Sign in with Google OAuth using Supabase
   * Preserves the selected portal role in URL query and browser storage across redirects
   */
  static async signInWithGoogle(intendedRole?: UserRole): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error(
        'Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
      );
    }

    if (intendedRole) {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(INTENDED_ROLE_STORAGE_KEY, intendedRole);
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(INTENDED_ROLE_STORAGE_KEY, intendedRole);
      }
    }

    const redirectPath = intendedRole
      ? `/auth/callback?role=${intendedRole}`
      : '/auth/callback';

    const redirectTo = getAuthRedirectUrl(redirectPath);

    if (isNativePlatform()) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        await Browser.open({
          url: data.url,
          toolbarColor: '#020617',
          windowName: '_self',
        });
      } else {
        throw new Error('Failed to obtain Google authentication URL.');
      }
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
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
   * Read the authoritative user profile directly from public.profiles table.
   * Never fabricates roles or relies on user_metadata.
   */
  static async getAuthoritativeProfile(userId: string): Promise<UserProfile | null> {
    if (!isSupabaseConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        return data as UserProfile;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Safe OAuth Session Handler and Account Provisioner
   *
   * 1. Checks public.profiles for an existing authoritative record.
   * 2. If user exists:
   *    - Reads authoritative role from database.
   *    - NEVER overwrites the existing role.
   *    - If intendedRole differs from profile.role, signs out and returns roleMismatch: true.
   * 3. If user is NEW:
   *    - Creates profile once using intendedRole (defaulting to student).
   *    - Uses INSERT (never upsert with overwrite) to prevent race condition duplicates.
   */
  static async handleOAuthCallbackSession(
    user: any,
    intendedRole?: UserRole | null
  ): Promise<OAuthSessionResult> {
    if (!user || !user.id) {
      return {
        profile: null,
        roleMismatch: false,
        isNewUser: false,
        error: 'No active user found in OAuth session.',
      };
    }

    // 1. Fetch authoritative profile from database
    const existingProfile = await this.getAuthoritativeProfile(user.id);

    if (existingProfile) {
      // Existing user: check if portal role matches stored database role
      if (intendedRole && existingProfile.role !== intendedRole) {
        // Sign out immediately so unauthorized session does not persist
        await supabase.auth.signOut();
        return {
          profile: null,
          roleMismatch: true,
          actualRole: existingProfile.role,
          expectedRole: intendedRole,
          isNewUser: false,
        };
      }

      return {
        profile: existingProfile,
        roleMismatch: false,
        actualRole: existingProfile.role,
        expectedRole: intendedRole || existingProfile.role,
        isNewUser: false,
      };
    }

    // 2. New Google-authenticated user: provision profile using intended role
    const targetRole: UserRole = intendedRole || 'student';
    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'CampusConnect User';

    const newProfilePayload = {
      id: user.id,
      email: user.email || '',
      full_name: fullName,
      role: targetRole,
      department: 'General',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Use INSERT to guarantee single creation and prevent silent overwriting
    const { data: insertedData, error: insertError } = await supabase
      .from('profiles')
      .insert(newProfilePayload)
      .select()
      .maybeSingle();

    if (insertError) {
      // Handle potential duplicate key race condition (e.g. concurrent trigger)
      if (
        insertError.code === '23505' ||
        insertError.message?.includes('duplicate key') ||
        insertError.message?.includes('unique constraint')
      ) {
        const refetched = await this.getAuthoritativeProfile(user.id);
        if (refetched) {
          if (intendedRole && refetched.role !== intendedRole) {
            await supabase.auth.signOut();
            return {
              profile: null,
              roleMismatch: true,
              actualRole: refetched.role,
              expectedRole: intendedRole,
              isNewUser: false,
            };
          }
          return {
            profile: refetched,
            roleMismatch: false,
            actualRole: refetched.role,
            expectedRole: intendedRole || refetched.role,
            isNewUser: false,
          };
        }
      }
      console.warn('Profile provisioning note:', insertError.message);
    }

    // Synchronize auth metadata for local token consistency
    try {
      await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          role: targetRole,
        },
      });
    } catch {
      // Non-fatal
    }

    const finalProfile: UserProfile = (insertedData as UserProfile) || {
      id: user.id,
      email: user.email || '',
      full_name: fullName,
      role: targetRole,
      department: 'General',
    };

    return {
      profile: finalProfile,
      roleMismatch: false,
      actualRole: targetRole,
      expectedRole: targetRole,
      isNewUser: true,
    };
  }

  /**
   * Get current authenticated user profile
   */
  static async getCurrentProfile(userId: string, userRecord?: any): Promise<UserProfile | null> {
    if (!isSupabaseConfigured()) return null;

    // 1. Check authoritative database table first
    const dbProfile = await this.getAuthoritativeProfile(userId);
    if (dbProfile) {
      return dbProfile;
    }

    // 2. Fallback to auth metadata if database row is not yet provisioned
    const activeUser = userRecord || (await supabase.auth.getUser()).data?.user;
    if (activeUser?.user_metadata && (activeUser.id === userId || !activeUser.id)) {
      const meta = activeUser.user_metadata;
      const sessionRole = typeof sessionStorage !== 'undefined'
        ? (sessionStorage.getItem(INTENDED_ROLE_STORAGE_KEY) as 'student' | 'staff' | null)
        : null;
      const resolvedRole: 'student' | 'staff' = (meta.role as 'student' | 'staff') || sessionRole || 'student';

      return {
        id: userId,
        email: activeUser.email || '',
        full_name: meta.full_name || 'CampusConnect User',
        role: resolvedRole,
        department: meta.department || 'General',
        register_number: meta.register_number,
        year_of_study: meta.year_of_study,
        employee_id: meta.employee_id,
        designation: meta.designation,
      };
    }

    return null;
  }

  /**
   * Save or update Student profile information in Supabase
   * Strictly verifies student role and never modifies the role column.
   */
  static async updateStudentProfile(
    userId: string,
    data: {
      fullName: string;
      department: string;
      registerNumber: string;
      yearOfStudy: string;
    }
  ): Promise<UserProfile> {
    if (!isSupabaseConfigured()) {
      throw new Error(
        'Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
      );
    }

    // Security check: verify that user is registered as a student in the database
    const existing = await this.getAuthoritativeProfile(userId);
    if (existing && existing.role !== 'student') {
      throw new Error('Role mismatch: Staff accounts cannot be updated as a student.');
    }

    const { data: userData } = await supabase.auth.getUser();
    const currentEmail = userData?.user?.email || existing?.email || '';

    // Update ONLY student fields; NEVER allow modifying 'role' column
    const updatePayload = {
      full_name: data.fullName.trim(),
      department: data.department.trim(),
      register_number: data.registerNumber.trim(),
      year_of_study: data.yearOfStudy.trim(),
      updated_at: new Date().toISOString(),
    };

    let savedProfile: UserProfile = {
      id: userId,
      email: currentEmail,
      role: 'student',
      ...updatePayload,
    };
    let dbSuccess = false;

    // 1. Update public.profiles without modifying role
    try {
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', userId)
        .select()
        .maybeSingle();

      if (!updateError && updateData) {
        savedProfile = updateData as UserProfile;
        dbSuccess = true;
      } else if (updateError) {
        console.warn('Supabase profiles update warning:', updateError.message);
      }
    } catch (err: any) {
      console.warn('Direct database update error:', err.message);
    }

    // 2. Synchronize auth user metadata
    try {
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          full_name: data.fullName.trim(),
          role: 'student',
          department: data.department.trim(),
          register_number: data.registerNumber.trim(),
          year_of_study: data.yearOfStudy.trim(),
        },
      });

      if (authUpdateError && !dbSuccess) {
        throw new Error(authUpdateError.message);
      }
    } catch (err: any) {
      if (!dbSuccess) {
        throw err;
      }
    }

    return savedProfile;
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
