import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/useAuth';
import { NotificationService } from '../services/notification.service';
import type {
  AppNotification,
  NotificationFilters,
} from '../types/notification.types';

export const useNotifications = (filters?: NotificationFilters) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const filterStatus = filters?.status;
  const filterType = filters?.type;

  const fetchAll = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const appliedFilters = filterStatus || filterType ? {
        status: filterStatus || 'ALL',
        type: filterType,
      } : undefined;

      const [list, count] = await Promise.all([
        NotificationService.getNotifications(user.id, appliedFilters),
        NotificationService.getUnreadCount(user.id),
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch (err: any) {
      setError(err?.message || 'Failed to load notifications.');
    } finally {
      setIsLoading(false);
    }
  }, [user, filterStatus, filterType]);

  useEffect(() => {
    let ignore = false;

    const loadInitial = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const appliedFilters = filterStatus || filterType ? {
          status: filterStatus || 'ALL',
          type: filterType,
        } : undefined;

        const [list, count] = await Promise.all([
          NotificationService.getNotifications(user.id, appliedFilters),
          NotificationService.getUnreadCount(user.id),
        ]);
        if (!ignore) {
          setNotifications(list);
          setUnreadCount(count);
        }
      } catch (err: any) {
        if (!ignore) {
          setError(err?.message || 'Failed to load notifications.');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadInitial();

    if (!user?.id) return;

    // Realtime subscription for incoming notifications
    const unsubscribe = NotificationService.subscribeToNotifications(
      user.id,
      () => {
        fetchAll();
      }
    );

    return () => {
      ignore = true;
      unsubscribe();
    };
  }, [user, filterStatus, filterType, fetchAll]);

  const markAsRead = async (notificationId: string) => {
    if (!user?.id) return;
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await NotificationService.markAsRead(notificationId, user.id);
    } catch (err: any) {
      setError(err?.message || 'Failed to mark notification as read.');
      fetchAll();
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;
    try {
      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);

      await NotificationService.markAllAsRead(user.id);
    } catch (err: any) {
      setError(err?.message || 'Failed to mark all notifications as read.');
      fetchAll();
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!user?.id) return;
    try {
      const target = notifications.find((n) => n.id === notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      if (target && !target.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      await NotificationService.deleteNotification(notificationId, user.id);
    } catch (err: any) {
      setError(err?.message || 'Failed to delete notification.');
      fetchAll();
    }
  };

  const clearRead = async () => {
    if (!user?.id) return;
    try {
      setNotifications((prev) => prev.filter((n) => !n.is_read));
      await NotificationService.clearReadNotifications(user.id);
    } catch (err: any) {
      setError(err?.message || 'Failed to clear read notifications.');
      fetchAll();
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refreshNotifications: fetchAll,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearRead,
  };
};
