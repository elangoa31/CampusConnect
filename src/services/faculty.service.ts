import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type {
  AvailabilityStatus,
  FacultyMember,
  FacultyFilters,
  FacultyStats,
} from '../types/faculty.types';
import type { TimetableEntry } from '../types/staff.types';

export class FacultyService {
  /**
   * Fetch all real registered staff members from Supabase profiles
   */
  static async getFacultyList(): Promise<FacultyMember[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, email, full_name, role, department, designation, employee_id, availability_status, location, status_message, status_start_time, status_end_time, avatar_url, availability_updated_at, created_at, updated_at'
        )
        .eq('role', 'staff')
        .order('full_name', { ascending: true });

      if (error) {
        // Table does not exist in schema cache or RLS issue
        console.warn('FacultyService.getFacultyList notice:', error.message);
        return [];
      }

      if (!data) return [];

      return data.map((item: any) => {
        // Valid status check: only allow confirmed status values, otherwise default to UNKNOWN
        const rawStatus = (item.availability_status || '').toUpperCase().trim();
        const validStatuses: AvailabilityStatus[] = [
          'AVAILABLE',
          'BUSY',
          'IN CLASS',
          'ON LEAVE',
          'UNKNOWN',
        ];
        const availability_status: AvailabilityStatus = validStatuses.includes(
          rawStatus as AvailabilityStatus
        )
          ? (rawStatus as AvailabilityStatus)
          : 'UNKNOWN';

        return {
          id: item.id,
          email: item.email || '',
          full_name: item.full_name || 'Faculty Member',
          role: 'staff' as const,
          department: item.department || 'General',
          designation: item.designation || 'Faculty Member',
          employee_id: item.employee_id || null,
          availability_status,
          location: item.location || null,
          status_message: item.status_message || null,
          status_start_time: item.status_start_time || null,
          status_end_time: item.status_end_time || null,
          avatar_url: item.avatar_url || null,
          availability_updated_at: item.availability_updated_at || item.updated_at || null,
          created_at: item.created_at,
          updated_at: item.updated_at,
        };
      });
    } catch (err: any) {
      console.warn('FacultyService.getFacultyList caught error:', err?.message);
      return [];
    }
  }

  /**
   * Fetch weekly estimated timetable for a faculty member
   */
  static async getFacultyTimetable(facultyUserId: string): Promise<TimetableEntry[]> {
    if (!isSupabaseConfigured()) return [];

    try {
      const { data, error } = await supabase
        .from('staff_timetables')
        .select('*')
        .eq('user_id', facultyUserId)
        .order('day_of_week')
        .order('start_time');

      if (error) {
        console.warn('FacultyService.getFacultyTimetable notice:', error.message);
        return [];
      }

      return (data || []) as TimetableEntry[];
    } catch {
      return [];
    }
  }

  /**
   * Subscribe to Supabase Realtime updates on staff availability
   */
  static subscribeToFacultyUpdates(onUpdate: () => void): () => void {
    if (!isSupabaseConfigured()) {
      return () => {};
    }

    try {
      const channel = supabase
        .channel('public:profiles:staff_availability')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
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
   * Compute dashboard overview statistics from real faculty records
   */
  static computeStats(facultyList: FacultyMember[]): FacultyStats {
    const total = facultyList.length;
    let available = 0;
    let busy = 0;
    let unknown = 0;

    for (const faculty of facultyList) {
      if (faculty.availability_status === 'AVAILABLE') {
        available++;
      } else if (
        faculty.availability_status === 'BUSY' ||
        faculty.availability_status === 'IN CLASS'
      ) {
        busy++;
      } else if (
        !faculty.availability_status ||
        faculty.availability_status === 'UNKNOWN'
      ) {
        unknown++;
      }
    }

    return {
      total,
      available,
      busy,
      unknown,
    };
  }

  /**
   * Filter faculty directory by name search, department, designation, and availability
   */
  static filterFaculty(
    facultyList: FacultyMember[],
    filters: FacultyFilters
  ): FacultyMember[] {
    return facultyList.filter((faculty) => {
      // 1. Search Query (matches name, department, designation, or location)
      if (filters.searchQuery.trim() !== '') {
        const query = filters.searchQuery.toLowerCase().trim();
        const nameMatch = faculty.full_name.toLowerCase().includes(query);
        const deptMatch = faculty.department.toLowerCase().includes(query);
        const desigMatch = (faculty.designation || '')
          .toLowerCase()
          .includes(query);
        const locMatch = (faculty.location || '').toLowerCase().includes(query);

        if (!nameMatch && !deptMatch && !desigMatch && !locMatch) {
          return false;
        }
      }

      // 2. Department filter
      if (filters.department && filters.department !== 'ALL') {
        if (
          faculty.department.toLowerCase() !== filters.department.toLowerCase()
        ) {
          return false;
        }
      }

      // 3. Designation filter
      if (filters.designation && filters.designation !== 'ALL') {
        if (
          (faculty.designation || '').toLowerCase() !==
          filters.designation.toLowerCase()
        ) {
          return false;
        }
      }

      // 4. Availability filter
      if (filters.availability && filters.availability !== 'ALL') {
        if (faculty.availability_status !== filters.availability) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Format ISO date string into human-friendly relative time (e.g. Just now, 10m ago, 2h ago)
   */
  static formatRelativeTime(dateString?: string | null): string {
    return formatRelativeTime(dateString);
  }
}

export const formatRelativeTime = (dateString?: string | null): string => {
  if (!dateString) return 'No updates recorded';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'No updates recorded';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'No updates recorded';
  }
};
