export type AvailabilityStatus =
  | 'AVAILABLE'
  | 'BUSY'
  | 'IN CLASS'
  | 'ON LEAVE'
  | 'UNKNOWN';

export interface FacultyMember {
  id: string;
  email: string;
  full_name: string;
  role: 'staff';
  department: string;
  designation?: string | null;
  employee_id?: string | null;
  availability_status: AvailabilityStatus;
  location?: string | null;
  avatar_url?: string | null;
  availability_updated_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface FacultyFilters {
  searchQuery: string;
  department: string;
  designation: string;
  availability: string;
}

export interface FacultyStats {
  total: number;
  available: number;
  busy: number;
  unknown: number;
}
