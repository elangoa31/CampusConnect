export type MeetingType = 'IN_PERSON' | 'ONLINE';

export type MeetingStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'COMPLETED';

export interface MeetingStudentInfo {
  full_name: string;
  email: string;
  department: string;
  register_number?: string;
  year_of_study?: string;
}

export interface MeetingStaffInfo {
  full_name: string;
  email: string;
  department: string;
  designation?: string;
  location?: string;
}

export interface MeetingRequest {
  id: string;
  student_id: string;
  staff_id: string;
  requested_date: string; // YYYY-MM-DD
  requested_time: string; // HH:mm format
  meeting_type: MeetingType;
  purpose: string;
  status: MeetingStatus;
  staff_response?: string | null;
  created_at?: string;
  updated_at?: string;
  student?: MeetingStudentInfo;
  staff?: MeetingStaffInfo;
}

export interface CreateMeetingPayload {
  staff_id: string;
  requested_date: string;
  requested_time: string;
  meeting_type: MeetingType;
  purpose: string;
}

export interface RespondMeetingPayload {
  meeting_id: string;
  status: 'ACCEPTED' | 'REJECTED';
  staff_response?: string;
}
