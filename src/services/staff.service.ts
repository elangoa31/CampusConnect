import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type {
  StaffProfile,
  StaffProfileFormData,
  AvailabilityUpdatePayload,
  TimetableEntry,
  TimetableFormData,
  DayOfWeek,
} from '../types/staff.types';
import type { AvailabilityStatus } from '../types/faculty.types';

export class StaffService {
  /**
   * Cleans and sanitizes employee IDs to prevent displaying emails, Jane, or placeholder values.
   */
  static sanitizeEmployeeId(
    employeeId?: string | null,
    email?: string | null
  ): string {
    if (!employeeId) return 'Not provided';
    const trimmed = employeeId.trim();
    if (
      !trimmed ||
      trimmed === 'N/A' ||
      trimmed === 'Not specified' ||
      trimmed.toLowerCase() === 'jane' ||
      trimmed.includes('@') ||
      (email && trimmed.toLowerCase() === email.toLowerCase())
    ) {
      return 'Not provided';
    }
    return trimmed;
  }

  /**
   * Fetches the authenticated staff member's live profile from Supabase.
   */
  static async getStaffProfile(userId: string): Promise<StaffProfile | null> {
    if (!isSupabaseConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, email, full_name, role, department, employee_id, designation, availability_status, location, status_message, status_start_time, status_end_time, avatar_url, availability_updated_at, created_at, updated_at'
        )
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        const rawStatus = (data.availability_status || '').toUpperCase().trim();
        const validStatuses: AvailabilityStatus[] = [
          'AVAILABLE',
          'BUSY',
          'IN CLASS',
          'ON LEAVE',
          'UNKNOWN',
        ];
        const status: AvailabilityStatus = validStatuses.includes(
          rawStatus as AvailabilityStatus
        )
          ? (rawStatus as AvailabilityStatus)
          : 'UNKNOWN';

        return {
          id: data.id,
          email: data.email,
          full_name: data.full_name,
          role: 'staff',
          department: data.department || 'Not specified',
          employee_id: this.sanitizeEmployeeId(data.employee_id, data.email),
          designation: data.designation || 'Not specified',
          availability_status: status,
          location: data.location || null,
          status_message: data.status_message || null,
          status_start_time: data.status_start_time || null,
          status_end_time: data.status_end_time || null,
          avatar_url: data.avatar_url || null,
          availability_updated_at: data.availability_updated_at || null,
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
      }

      // Fallback to active auth user metadata if table row is not yet created
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (user && user.id === userId) {
        const meta = user.user_metadata || {};
        return {
          id: user.id,
          email: user.email || '',
          full_name: meta.full_name || 'Faculty Member',
          role: 'staff',
          department: meta.department || 'Not specified',
          employee_id: this.sanitizeEmployeeId(meta.employee_id, user.email),
          designation: meta.designation || 'Not specified',
          availability_status: 'UNKNOWN',
          location: null,
          status_message: null,
          status_start_time: null,
          status_end_time: null,
          avatar_url: null,
          availability_updated_at: null,
        };
      }

      return null;
    } catch (err: any) {
      console.warn('StaffService.getStaffProfile error:', err.message);
      return null;
    }
  }

  /**
   * Updates staff profile information (Full Name, Department, Employee ID, Designation)
   */
  static async updateStaffProfile(
    userId: string,
    formData: StaffProfileFormData
  ): Promise<StaffProfile> {
    if (!isSupabaseConfigured()) {
      throw new Error(
        'Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
      );
    }

    const { data: userData } = await supabase.auth.getUser();
    const currentEmail = userData?.user?.email || '';

    const sanitizedId = this.sanitizeEmployeeId(formData.employeeId, currentEmail);

    const payload = {
      id: userId,
      email: currentEmail,
      full_name: formData.fullName.trim(),
      role: 'staff' as const,
      department: formData.department.trim(),
      employee_id: sanitizedId === 'Not provided' ? null : sanitizedId,
      designation: formData.designation.trim(),
      updated_at: new Date().toISOString(),
    };

    let updatedProfile: StaffProfile = {
      ...payload,
      employee_id: sanitizedId,
      availability_status: 'UNKNOWN',
    };

    // 1. Upsert into public.profiles
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .maybeSingle();

      if (!error && data) {
        updatedProfile = {
          ...data,
          employee_id: this.sanitizeEmployeeId(data.employee_id, data.email),
          role: 'staff',
        };
      } else if (error) {
        console.warn('StaffService.updateStaffProfile profiles warning:', error.message);
      }
    } catch (err: any) {
      console.warn('StaffService.updateStaffProfile error:', err.message);
    }

    // 2. Synchronize user metadata in Supabase Auth
    try {
      await supabase.auth.updateUser({
        data: {
          full_name: formData.fullName.trim(),
          role: 'staff',
          department: formData.department.trim(),
          employee_id: sanitizedId === 'Not provided' ? null : sanitizedId,
          designation: formData.designation.trim(),
        },
      });
    } catch {
      // Non-critical if DB succeeded
    }

    return updatedProfile;
  }

  /**
   * Manually updates availability status, campus location, and temporary validity times
   */
  static async updateAvailability(
    userId: string,
    payload: AvailabilityUpdatePayload
  ): Promise<StaffProfile> {
    if (!isSupabaseConfigured()) {
      throw new Error(
        'Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
      );
    }

    const nowIso = new Date().toISOString();

    const updateData = {
      availability_status: payload.availability_status,
      location: payload.location ? payload.location.trim() : null,
      status_message: payload.status_message ? payload.status_message.trim() : null,
      status_start_time: payload.status_start_time ? payload.status_start_time.trim() : null,
      status_end_time: payload.status_end_time ? payload.status_end_time.trim() : null,
      availability_updated_at: nowIso,
      updated_at: nowIso,
    };

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to update availability: ${error.message}`);
    }

    if (!data) {
      // Fallback: try upserting if profile row didn't exist
      const { data: upserted, error: upsertErr } = await supabase
        .from('profiles')
        .upsert({ id: userId, ...updateData }, { onConflict: 'id' })
        .select()
        .maybeSingle();

      if (upsertErr) {
        throw new Error(`Failed to save availability: ${upsertErr.message}`);
      }
      return upserted as StaffProfile;
    }

    return data as StaffProfile;
  }

  /**
   * Fetches the weekly timetable records for a staff member
   */
  static async getStaffTimetable(userId: string): Promise<TimetableEntry[]> {
    if (!isSupabaseConfigured()) return [];

    try {
      const { data, error } = await supabase
        .from('staff_timetables')
        .select('*')
        .eq('user_id', userId)
        .order('day_of_week')
        .order('start_time');

      if (error) {
        console.warn('StaffService.getStaffTimetable notice:', error.message);
        return [];
      }

      return (data || []) as TimetableEntry[];
    } catch {
      return [];
    }
  }

  /**
   * Creates a new timetable entry for a staff member
   */
  static async createTimetableEntry(
    userId: string,
    formData: TimetableFormData
  ): Promise<TimetableEntry> {
    if (!isSupabaseConfigured()) {
      throw new Error(
        'Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
      );
    }

    const payload = {
      user_id: userId,
      day_of_week: formData.day_of_week,
      start_time: formData.start_time.trim(),
      end_time: formData.end_time.trim(),
      subject: formData.subject.trim(),
      classroom: formData.classroom.trim(),
      department: formData.department.trim(),
    };

    const { data, error } = await supabase
      .from('staff_timetables')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create timetable entry: ${error.message}`);
    }

    return data as TimetableEntry;
  }

  /**
   * Updates an existing timetable entry
   */
  static async updateTimetableEntry(
    entryId: string,
    formData: Partial<TimetableFormData>
  ): Promise<TimetableEntry> {
    if (!isSupabaseConfigured()) {
      throw new Error(
        'Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
      );
    }

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (formData.day_of_week) updateData.day_of_week = formData.day_of_week;
    if (formData.start_time) updateData.start_time = formData.start_time.trim();
    if (formData.end_time) updateData.end_time = formData.end_time.trim();
    if (formData.subject) updateData.subject = formData.subject.trim();
    if (formData.classroom) updateData.classroom = formData.classroom.trim();
    if (formData.department) updateData.department = formData.department.trim();

    const { data, error } = await supabase
      .from('staff_timetables')
      .update(updateData)
      .eq('id', entryId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update timetable entry: ${error.message}`);
    }

    return data as TimetableEntry;
  }

  /**
   * Deletes a timetable entry
   */
  static async deleteTimetableEntry(entryId: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error(
        'Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
      );
    }

    const { error } = await supabase
      .from('staff_timetables')
      .delete()
      .eq('id', entryId);

    if (error) {
      throw new Error(`Failed to delete timetable entry: ${error.message}`);
    }
  }

  /**
   * Filters and sorts timetable entries for the current day of the week
   */
  static getTodaySchedule(
    entries: TimetableEntry[],
    referenceDate: Date = new Date()
  ): { dayName: DayOfWeek; todayClasses: TimetableEntry[] } {
    const dayNames: DayOfWeek[] = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const currentDayName = dayNames[referenceDate.getDay()];

    const todayClasses = entries
      .filter((e) => e.day_of_week === currentDayName)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

    return {
      dayName: currentDayName,
      todayClasses,
    };
  }
}
