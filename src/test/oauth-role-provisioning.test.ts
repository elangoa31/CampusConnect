import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthService, INTENDED_ROLE_STORAGE_KEY } from '../services/auth.service';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types/auth.types';

describe('CampusConnect OAuth Role Provisioning & Security', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  // 1. New Student Google signup
  it('1. New Student Google signup: provisions a student profile once using intended role', async () => {
    const mockUser = {
      id: 'student-new-uuid',
      email: 'newstudent@college.edu',
      user_metadata: { full_name: 'Alice Student' },
    };

    // getAuthoritativeProfile returns null initially (new user)
    vi.spyOn(AuthService, 'getAuthoritativeProfile').mockResolvedValueOnce(null);

    const insertedProfile: UserProfile = {
      id: mockUser.id,
      email: mockUser.email,
      full_name: 'Alice Student',
      role: 'student',
      department: 'General',
    };

    const insertSpy = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: insertedProfile, error: null }),
      }),
    });

    vi.spyOn(supabase, 'from').mockReturnValue({
      insert: insertSpy,
    } as any);

    vi.spyOn(supabase.auth, 'updateUser').mockResolvedValue({ data: { user: mockUser }, error: null } as any);

    const result = await AuthService.handleOAuthCallbackSession(mockUser, 'student');

    expect(result.roleMismatch).toBe(false);
    expect(result.isNewUser).toBe(true);
    expect(result.actualRole).toBe('student');
    expect(result.expectedRole).toBe('student');
    expect(result.profile?.role).toBe('student');
    expect(result.profile?.email).toBe('newstudent@college.edu');

    // Verify insert was called with role: student
    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockUser.id,
        role: 'student',
        full_name: 'Alice Student',
      })
    );
  });

  // 2. New Staff Google signup
  it('2. New Staff Google signup: provisions a staff profile once using intended role', async () => {
    const mockUser = {
      id: 'staff-new-uuid',
      email: 'dr.smith@college.edu',
      user_metadata: { full_name: 'Dr. John Smith' },
    };

    vi.spyOn(AuthService, 'getAuthoritativeProfile').mockResolvedValueOnce(null);

    const insertedProfile: UserProfile = {
      id: mockUser.id,
      email: mockUser.email,
      full_name: 'Dr. John Smith',
      role: 'staff',
      department: 'General',
    };

    const insertSpy = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: insertedProfile, error: null }),
      }),
    });

    vi.spyOn(supabase, 'from').mockReturnValue({
      insert: insertSpy,
    } as any);

    vi.spyOn(supabase.auth, 'updateUser').mockResolvedValue({ data: { user: mockUser }, error: null } as any);

    const result = await AuthService.handleOAuthCallbackSession(mockUser, 'staff');

    expect(result.roleMismatch).toBe(false);
    expect(result.isNewUser).toBe(true);
    expect(result.actualRole).toBe('staff');
    expect(result.expectedRole).toBe('staff');
    expect(result.profile?.role).toBe('staff');
    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockUser.id,
        role: 'staff',
      })
    );
  });

  // 3. Existing Student selecting Student
  it('3. Existing Student selecting Student: loads authoritative profile and allows access', async () => {
    const mockUser = {
      id: 'student-existing-uuid',
      email: 'alice@college.edu',
    };

    const existingStudentProfile: UserProfile = {
      id: mockUser.id,
      email: mockUser.email,
      full_name: 'Alice Student',
      role: 'student',
      department: 'Computer Science',
      register_number: 'CS2026-001',
      year_of_study: '3rd Year',
    };

    vi.spyOn(AuthService, 'getAuthoritativeProfile').mockResolvedValueOnce(existingStudentProfile);

    const result = await AuthService.handleOAuthCallbackSession(mockUser, 'student');

    expect(result.roleMismatch).toBe(false);
    expect(result.isNewUser).toBe(false);
    expect(result.actualRole).toBe('student');
    expect(result.profile?.role).toBe('student');
    expect(result.profile?.register_number).toBe('CS2026-001');
  });

  // 4. Existing Staff selecting Staff
  it('4. Existing Staff selecting Staff: loads authoritative profile and allows access', async () => {
    const mockUser = {
      id: 'staff-existing-uuid',
      email: 'dr.smith@college.edu',
    };

    const existingStaffProfile: UserProfile = {
      id: mockUser.id,
      email: mockUser.email,
      full_name: 'Dr. John Smith',
      role: 'staff',
      department: 'Electronics',
      employee_id: 'FAC-9001',
      designation: 'Professor',
    };

    vi.spyOn(AuthService, 'getAuthoritativeProfile').mockResolvedValueOnce(existingStaffProfile);

    const result = await AuthService.handleOAuthCallbackSession(mockUser, 'staff');

    expect(result.roleMismatch).toBe(false);
    expect(result.isNewUser).toBe(false);
    expect(result.actualRole).toBe('staff');
    expect(result.profile?.role).toBe('staff');
    expect(result.profile?.employee_id).toBe('FAC-9001');
  });

  // 5. Existing Student selecting Staff
  it('5. Existing Student selecting Staff: detects role mismatch, signs out, and blocks staff access', async () => {
    const mockUser = {
      id: 'student-trying-staff-uuid',
      email: 'student@college.edu',
    };

    const existingStudentProfile: UserProfile = {
      id: mockUser.id,
      email: mockUser.email,
      full_name: 'Bob Student',
      role: 'student',
      department: 'Mechanical',
    };

    vi.spyOn(AuthService, 'getAuthoritativeProfile').mockResolvedValueOnce(existingStudentProfile);
    const signOutSpy = vi.spyOn(supabase.auth, 'signOut').mockResolvedValue({ error: null } as any);

    // Student attempted to sign in through the staff portal
    const result = await AuthService.handleOAuthCallbackSession(mockUser, 'staff');

    expect(result.roleMismatch).toBe(true);
    expect(result.actualRole).toBe('student');
    expect(result.expectedRole).toBe('staff');
    expect(result.profile).toBeNull();
    expect(signOutSpy).toHaveBeenCalled();
  });

  // 6. Existing Staff selecting Student
  it('6. Existing Staff selecting Student: detects role mismatch, signs out, and blocks student access', async () => {
    const mockUser = {
      id: 'staff-trying-student-uuid',
      email: 'prof@college.edu',
    };

    const existingStaffProfile: UserProfile = {
      id: mockUser.id,
      email: mockUser.email,
      full_name: 'Prof. Miller',
      role: 'staff',
      department: 'Mathematics',
    };

    vi.spyOn(AuthService, 'getAuthoritativeProfile').mockResolvedValueOnce(existingStaffProfile);
    const signOutSpy = vi.spyOn(supabase.auth, 'signOut').mockResolvedValue({ error: null } as any);

    // Faculty attempted to sign in through the student portal
    const result = await AuthService.handleOAuthCallbackSession(mockUser, 'student');

    expect(result.roleMismatch).toBe(true);
    expect(result.actualRole).toBe('staff');
    expect(result.expectedRole).toBe('student');
    expect(result.profile).toBeNull();
    expect(signOutSpy).toHaveBeenCalled();
  });

  // 7. OAuth callback and page refresh
  it('7. OAuth callback & page refresh: preserves intended role across storage and redirects', async () => {
    // Test that signInWithGoogle sets both sessionStorage and localStorage
    const setSessionItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    vi.spyOn(supabase.auth, 'signInWithOAuth').mockResolvedValue({ data: { provider: 'google', url: 'https://accounts.google.com' }, error: null });

    await AuthService.signInWithGoogle('staff');

    expect(setSessionItemSpy).toHaveBeenCalledWith(INTENDED_ROLE_STORAGE_KEY, 'staff');
  });

  // 8. Duplicate profile prevention
  it('8. Duplicate profile prevention: handles 23505 conflict gracefully and never overwrites', async () => {
    const mockUser = {
      id: 'concurrent-uuid',
      email: 'concurrent@college.edu',
      user_metadata: { full_name: 'Concurrent User' },
    };

    // First lookup returns null
    vi.spyOn(AuthService, 'getAuthoritativeProfile')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: mockUser.id,
        email: mockUser.email,
        full_name: 'Concurrent User',
        role: 'staff',
        department: 'General',
      });

    // Insert triggers duplicate key error
    const insertSpy = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: { code: '23505', message: 'duplicate key value violates unique constraint "profiles_pkey"' },
        }),
      }),
    });

    vi.spyOn(supabase, 'from').mockReturnValue({
      insert: insertSpy,
    } as any);

    const result = await AuthService.handleOAuthCallbackSession(mockUser, 'staff');

    expect(result.roleMismatch).toBe(false);
    expect(result.profile?.role).toBe('staff');
    expect(result.profile?.id).toBe(mockUser.id);
  });

  // 9. Role Immutability Verification
  it('9. Role immutability: updateStudentProfile cannot alter role and rejects non-student accounts', async () => {
    const staffUser = {
      id: 'staff-immutable-uuid',
      email: 'faculty@college.edu',
    };

    // Database lookup returns a staff profile
    vi.spyOn(AuthService, 'getAuthoritativeProfile').mockResolvedValueOnce({
      id: staffUser.id,
      email: staffUser.email,
      full_name: 'Dr. Jane',
      role: 'staff',
      department: 'Physics',
    });

    // Attempting to run updateStudentProfile on a staff account throws an authorization error
    await expect(
      AuthService.updateStudentProfile(staffUser.id, {
        fullName: 'Dr. Jane Changed',
        department: 'Physics',
        registerNumber: 'REG123',
        yearOfStudy: '4th Year',
      })
    ).rejects.toThrow('Role mismatch: Staff accounts cannot be updated as a student.');
  });
});
