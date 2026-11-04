import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type {
  AppNotification,
  NotificationFilters,
} from '../types/notification.types';

export class NotificationService {
  /**
   * Fetches all notifications for the authenticated user with optional filtering.
   */
  static async getNotifications(
    userId: string,
    filters?: NotificationFilters
  ): Promise<AppNotification[]> {
    if (!userId || !isSupabaseConfigured()) {
      return [];
    }

    try {
      let query = supabase
        .from('notifications')
        .select(`
          *,
          actor:profiles!fk_notification_actor_profile (
            id,
            full_name,
            email,
            department,
            role,
            avatar_url
          )
        `)
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false });

      if (filters?.status === 'UNREAD') {
        query = query.eq('is_read', false);
      } else if (filters?.status === 'READ') {
        query = query.eq('is_read', true);
      }

      if (filters?.type && filters.type !== 'ALL') {
        query = query.eq('type', filters.type);
      }

      const { data, error } = await query;

      if (!error && data) {
        return data as AppNotification[];
      }

      // Resilient fallback query if foreign key join is not yet cached by PostgREST
      let fallbackQuery = supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false });

      if (filters?.status === 'UNREAD') {
        fallbackQuery = fallbackQuery.eq('is_read', false);
      } else if (filters?.status === 'READ') {
        fallbackQuery = fallbackQuery.eq('is_read', true);
      }

      if (filters?.type && filters.type !== 'ALL') {
        fallbackQuery = fallbackQuery.eq('type', filters.type);
      }

      const { data: rawNotifications, error: rawError } = await fallbackQuery;

      if (rawError || !rawNotifications) {
        return [];
      }

      const actorIds = Array.from(
        new Set(rawNotifications.map((n) => n.actor_id).filter(Boolean))
      ) as string[];

      if (actorIds.length === 0) {
        return rawNotifications as AppNotification[];
      }

      const { data: actorProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, department, role, avatar_url')
        .in('id', actorIds);

      const actorMap = new Map((actorProfiles || []).map((a) => [a.id, a]));

      return rawNotifications.map((n) => ({
        ...n,
        actor: n.actor_id ? actorMap.get(n.actor_id) || null : null,
      })) as AppNotification[];
    } catch {
      return [];
    }
  }

  /**
   * Returns the count of unread notifications for a user.
   */
  static async getUnreadCount(userId: string): Promise<number> {
    if (!userId || !isSupabaseConfigured()) {
      return 0;
    }

    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('is_read', false);

      if (error || count === null) {
        return 0;
      }

      return count;
    } catch {
      return 0;
    }
  }

  /**
   * Marks a single notification as read.
   */
  static async markAsRead(notificationId: string, userId: string): Promise<void> {
    if (!notificationId || !userId || !isSupabaseConfigured()) {
      return;
    }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('recipient_id', userId);

    if (error) {
      throw new Error(error.message || 'Failed to mark notification as read.');
    }
  }

  /**
   * Marks all unread notifications for a user as read.
   */
  static async markAllAsRead(userId: string): Promise<void> {
    if (!userId || !isSupabaseConfigured()) {
      return;
    }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (error) {
      throw new Error(error.message || 'Failed to mark all notifications as read.');
    }
  }

  /**
   * Deletes a single notification owned by the user.
   */
  static async deleteNotification(
    notificationId: string,
    userId: string
  ): Promise<void> {
    if (!notificationId || !userId || !isSupabaseConfigured()) {
      return;
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('recipient_id', userId);

    if (error) {
      throw new Error(error.message || 'Failed to delete notification.');
    }
  }

  /**
   * Deletes all read notifications owned by the user.
   */
  static async clearReadNotifications(userId: string): Promise<void> {
    if (!userId || !isSupabaseConfigured()) {
      return;
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('recipient_id', userId)
      .eq('is_read', true);

    if (error) {
      throw new Error(error.message || 'Failed to clear read notifications.');
    }
  }

  /**
   * Subscribes to realtime updates for notifications addressed to the user.
   */
  static subscribeToNotifications(
    userId: string,
    onUpdate: (payload?: any) => void
  ): () => void {
    if (!userId || !isSupabaseConfigured()) {
      return () => {};
    }

    try {
      const channel = supabase
        .channel(`public:notifications:${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${userId}`,
          },
          (payload) => {
            onUpdate(payload);
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
