export type NotificationType =
  | 'MEETING_REQUEST_RECEIVED'
  | 'MEETING_REQUEST_ACCEPTED'
  | 'MEETING_REQUEST_REJECTED'
  | 'MEETING_REQUEST_CANCELLED'
  | 'MEETING_COMPLETED'
  | 'MEETING_REMINDER';

export interface AppNotification {
  id: string;
  recipient_id: string;
  actor_id?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  reference_id?: string | null;
  reference_type?: string | null;
  is_read: boolean;
  created_at: string;
  actor?: {
    id?: string;
    full_name: string;
    email?: string;
    department?: string;
    role?: string;
    avatar_url?: string | null;
  } | null;
}

export interface NotificationFilters {
  status: 'ALL' | 'UNREAD' | 'READ';
  type?: NotificationType | 'ALL';
}
