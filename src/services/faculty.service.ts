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

      // Query taught subjects from staff_timetables to enrich search by subject
      const subjectsMap: Record<string, string[]> = {};
      try {
        const { data: timetableRows, error: ttError } = await supabase
          .from('staff_timetables')
          .select('user_id, subject');

        if (!ttError && timetableRows) {
          timetableRows.forEach((row: any) => {
            if (row.user_id && row.subject) {
              if (!subjectsMap[row.user_id]) {
                subjectsMap[row.user_id] = [];
              }
              const cleanSubject = row.subject.trim();
              if (cleanSubject && !subjectsMap[row.user_id].includes(cleanSubject)) {
                subjectsMap[row.user_id].push(cleanSubject);
              }
            }
          });
        }
      } catch {
        // Non-critical if timetable table is still empty
      }

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

        const taughtSubjects = subjectsMap[item.id] || item.subjects || [];

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
          subjects: taughtSubjects,
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
    let recentlyUpdated = 0;

    const now = Date.now();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;

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

      if (faculty.availability_updated_at) {
        const time = new Date(faculty.availability_updated_at).getTime();
        if (!isNaN(time) && (now - time) <= twentyFourHoursMs && (now - time) >= -60000) {
          recentlyUpdated++;
        }
      }
    }

    return {
      total,
      available,
      busy,
      unknown,
      recentlyUpdated,
    };
  }

  /**
   * Filter faculty directory by name, department, designation, subject, employee ID, location, and sorting
   */
  static filterFaculty(
    facultyList: FacultyMember[],
    filters: Partial<FacultyFilters>
  ): FacultyMember[] {
    const {
      searchQuery = '',
      department = 'ALL',
      designation = 'ALL',
      availability = 'ALL',
      location = 'ALL',
      sortBy = 'available_first',
    } = filters;

    const filtered = facultyList.filter((faculty) => {
      // 1. Search Query: matches name, department, designation, location, employee ID, or taught subjects
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = faculty.full_name.toLowerCase().includes(query);
        const deptMatch = faculty.department.toLowerCase().includes(query);
        const desigMatch = (faculty.designation || '')
          .toLowerCase()
          .includes(query);
        const locMatch = (faculty.location || '').toLowerCase().includes(query);
        const empIdMatch = (faculty.employee_id || '').toLowerCase().includes(query);
        const subjectMatch = (faculty.subjects || []).some((s) =>
          s.toLowerCase().includes(query)
        );

        if (
          !nameMatch &&
          !deptMatch &&
          !desigMatch &&
          !locMatch &&
          !empIdMatch &&
          !subjectMatch
        ) {
          return false;
        }
      }

      // 2. Department filter
      if (department && department !== 'ALL') {
        if (
          faculty.department.toLowerCase() !== department.toLowerCase()
        ) {
          return false;
        }
      }

      // 3. Designation filter
      if (designation && designation !== 'ALL') {
        if (
          (faculty.designation || '').toLowerCase() !==
          designation.toLowerCase()
        ) {
          return false;
        }
      }

      // 4. Availability filter
      if (availability && availability !== 'ALL') {
        if (faculty.availability_status !== availability) {
          return false;
        }
      }

      // 5. Campus location filter
      if (location && location !== 'ALL') {
        if (
          !(faculty.location || '')
            .toLowerCase()
            .includes(location.toLowerCase())
        ) {
          return false;
        }
      }

      return true;
    });

    // 6. Sorting
    return filtered.slice().sort((a, b) => {
      if (sortBy === 'available_first') {
        const statusRank = (status: AvailabilityStatus): number => {
          switch (status) {
            case 'AVAILABLE':
              return 1;
            case 'IN CLASS':
              return 2;
            case 'BUSY':
              return 3;
            case 'ON LEAVE':
              return 4;
            case 'UNKNOWN':
            default:
              return 5;
          }
        };

        const rankDiff = statusRank(a.availability_status) - statusRank(b.availability_status);
        if (rankDiff !== 0) return rankDiff;
        return a.full_name.localeCompare(b.full_name);
      }

      if (sortBy === 'recently_updated') {
        const timeA = a.availability_updated_at
          ? new Date(a.availability_updated_at).getTime()
          : 0;
        const timeB = b.availability_updated_at
          ? new Date(b.availability_updated_at).getTime()
          : 0;
        if (timeA !== timeB) return timeB - timeA; // Most recent first
        return a.full_name.localeCompare(b.full_name);
      }

      if (sortBy === 'alphabetical') {
        return a.full_name.localeCompare(b.full_name);
      }

      return 0;
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
