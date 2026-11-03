import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type {
  MeetingRequest,
  CreateMeetingPayload,
} from '../types/meeting.types';
import { validateMeetingRequestForm } from '../utils/validation';

export class MeetingService {
  /**
   * Creates a new meeting request from student to faculty member.
   */
  static async createMeetingRequest(
    studentId: string,
    payload: CreateMeetingPayload
  ): Promise<MeetingRequest> {
    const errors = validateMeetingRequestForm(payload);
    if (Object.keys(errors).length > 0) {
      throw new Error(Object.values(errors)[0]);
    }

    if (!studentId) {
      throw new Error('Authentication required to submit meeting requests.');
    }

    if (!payload.staff_id) {
      throw new Error('Faculty member must be specified.');
    }

    if (studentId === payload.staff_id) {
      throw new Error('You cannot request a meeting with yourself.');
    }

    if (!isSupabaseConfigured()) {
      throw new Error('Database service is currently unconfigured.');
    }

    const { data, error } = await supabase
      .from('meeting_requests')
      .insert({
        student_id: studentId,
        staff_id: payload.staff_id,
        requested_date: payload.requested_date,
        requested_time: payload.requested_time,
        meeting_type: payload.meeting_type,
        purpose: payload.purpose.trim(),
        status: 'PENDING',
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Failed to submit meeting request.');
    }

    return data as MeetingRequest;
  }

  /**
   * Retrieves all meeting requests created by a student, with faculty details attached.
   */
  static async getStudentMeetings(studentId: string): Promise<MeetingRequest[]> {
    if (!studentId || !isSupabaseConfigured()) {
      return [];
    }

    try {
      // Attempt join query first
      const { data, error } = await supabase
        .from('meeting_requests')
        .select(`
          *,
          staff:profiles!fk_meeting_staff_profile (
            full_name,
            email,
            department,
            designation,
            location
          )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as MeetingRequest[];
      }

      // Resilient fallback query without foreign key alias
      const { data: rawMeetings, error: rawError } = await supabase
        .from('meeting_requests')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (rawError || !rawMeetings) {
        return [];
      }

      // Fetch distinct staff profiles
      const staffIds = Array.from(new Set(rawMeetings.map((m) => m.staff_id)));
      if (staffIds.length === 0) return rawMeetings as MeetingRequest[];

      const { data: staffProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, department, designation, location')
        .in('id', staffIds);

      const staffMap = new Map((staffProfiles || []).map((s) => [s.id, s]));

      return rawMeetings.map((m) => ({
        ...m,
        staff: staffMap.get(m.staff_id) || {
          full_name: 'Faculty Member',
          email: '',
          department: 'College Faculty',
        },
      })) as MeetingRequest[];
    } catch {
      return [];
    }
  }

  /**
   * Retrieves all incoming meeting requests addressed to a staff member, with student details attached.
   */
  static async getStaffMeetings(staffId: string): Promise<MeetingRequest[]> {
    if (!staffId || !isSupabaseConfigured()) {
      return [];
    }

    try {
      // Attempt join query first
      const { data, error } = await supabase
        .from('meeting_requests')
        .select(`
          *,
          student:profiles!fk_meeting_student_profile (
            full_name,
            email,
            department,
            register_number,
            year_of_study
          )
        `)
        .eq('staff_id', staffId)
        .order('requested_date', { ascending: true })
        .order('requested_time', { ascending: true });

      if (!error && data) {
        return data as MeetingRequest[];
      }

      // Resilient fallback query without foreign key alias
      const { data: rawMeetings, error: rawError } = await supabase
        .from('meeting_requests')
        .select('*')
        .eq('staff_id', staffId)
        .order('requested_date', { ascending: true })
        .order('requested_time', { ascending: true });

      if (rawError || !rawMeetings) {
        return [];
      }

      // Fetch distinct student profiles
      const studentIds = Array.from(new Set(rawMeetings.map((m) => m.student_id)));
      if (studentIds.length === 0) return rawMeetings as MeetingRequest[];

      const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, department, register_number, year_of_study')
        .in('id', studentIds);

      const studentMap = new Map((studentProfiles || []).map((s) => [s.id, s]));

      return rawMeetings.map((m) => ({
        ...m,
        student: studentMap.get(m.student_id) || {
          full_name: 'Student',
          email: '',
          department: 'General',
        },
      })) as MeetingRequest[];
    } catch {
      return [];
    }
  }

  /**
   * Student cancels their own pending meeting request.
   */
  static async cancelMeetingRequest(
    studentId: string,
    meetingId: string
  ): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Database service is currently unconfigured.');
    }

    const { error } = await supabase
      .from('meeting_requests')
      .update({
        status: 'CANCELLED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', meetingId)
      .eq('student_id', studentId)
      .eq('status', 'PENDING');

    if (error) {
      throw new Error(error.message || 'Failed to cancel meeting request.');
    }
  }

  /**
   * Staff responds to a pending meeting request by accepting or rejecting it.
   */
  static async respondToMeetingRequest(
    staffId: string,
    meetingId: string,
    status: 'ACCEPTED' | 'REJECTED',
    staffResponse?: string
  ): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Database service is currently unconfigured.');
    }

    const { error } = await supabase
      .from('meeting_requests')
      .update({
        status,
        staff_response: staffResponse?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', meetingId)
      .eq('staff_id', staffId)
      .eq('status', 'PENDING');

    if (error) {
      throw new Error(error.message || `Failed to ${status.toLowerCase()} meeting request.`);
    }
  }

  /**
   * Staff marks an accepted meeting as completed.
   */
  static async completeMeetingRequest(
    staffId: string,
    meetingId: string
  ): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Database service is currently unconfigured.');
    }

    const { error } = await supabase
      .from('meeting_requests')
      .update({
        status: 'COMPLETED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', meetingId)
      .eq('staff_id', staffId)
      .eq('status', 'ACCEPTED');

    if (error) {
      throw new Error(error.message || 'Failed to mark meeting as completed.');
    }
  }

  /**
   * Subscribes to realtime updates on meetings for a student.
   */
  static subscribeToStudentMeetings(
    studentId: string,
    onUpdate: () => void
  ): () => void {
    if (!isSupabaseConfigured() || !studentId) {
      return () => {};
    }

    try {
      const channel = supabase
        .channel(`public:meeting_requests:student_${studentId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'meeting_requests',
            filter: `student_id=eq.${studentId}`,
          },
          () => {
            onUpdate();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      return () => {};
    }
  }

  /**
   * Subscribes to realtime updates on meetings for a staff member.
   */
  static subscribeToStaffMeetings(
    staffId: string,
    onUpdate: () => void
  ): () => void {
    if (!isSupabaseConfigured() || !staffId) {
      return () => {};
    }

    try {
      const channel = supabase
        .channel(`public:meeting_requests:staff_${staffId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'meeting_requests',
            filter: `staff_id=eq.${staffId}`,
          },
          () => {
            onUpdate();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      return () => {};
    }
  }
}
