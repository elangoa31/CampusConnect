import type { AvailabilityStatus } from './faculty.types';
import type { UserProfile } from './auth.types';

export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export type CampusLocationPreset =
  | 'Department Office'
  | 'Staff Room'
  | 'Classroom'
  | 'Laboratory'
  | 'Library'
  | 'Conference Hall'
  | 'Other';

export const LOCATION_PRESETS: CampusLocationPreset[] = [
  'Department Office',
  'Staff Room',
  'Classroom',
  'Laboratory',
  'Library',
  'Conference Hall',
  'Other',
];

export interface StaffProfile extends UserProfile {
  availability_status?: AvailabilityStatus;
  location?: string | null;
  status_message?: string | null;
  status_start_time?: string | null;
  status_end_time?: string | null;
  availability_updated_at?: string | null;
  avatar_url?: string | null;
}

export interface AvailabilityUpdatePayload {
  availability_status: AvailabilityStatus;
  location?: string;
  status_message?: string;
  status_start_time?: string;
  status_end_time?: string;
}

export interface TimetableEntry {
  id: string;
  user_id: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  subject: string;
  classroom: string;
  department: string;
  created_at?: string;
  updated_at?: string;
}

export interface TimetableFormData {
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  subject: string;
  classroom: string;
  department: string;
}

export interface StaffProfileFormData {
  fullName: string;
  department: string;
  employeeId: string;
  designation: string;
}
