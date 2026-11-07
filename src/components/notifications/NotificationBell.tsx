import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  CalendarPlus,
  CheckCircle2,
  XCircle,
  Ban,
  Clock,
  ArrowRight,
  Loader2,
  CalendarCheck,
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { formatRelativeTime } from '../../utils/date';
import { useAuth } from '../../context/useAuth';
import type { NotificationType } from '../../types/notification.types';

interface NotificationBellProps {
  onNavigateToMeetings?: () => void;
  className?: string;
}

interface DropdownPosition {
  top: number;
  left?: number;
  right?: number;
  width: number | string;
  maxHeight: number;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  onNavigateToMeetings,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<DropdownPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const userRole = profile?.role || (user?.user_metadata?.role as 'student' | 'staff' | undefined);

  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
    const isMobile = viewportWidth < 640;

    if (isMobile) {
      const top = Math.min(rect.bottom + 8, Math.max(50, viewportHeight - 160));
      const maxHeight = Math.max(220, viewportHeight - top - 16);
      setCoords({
        top: top > 0 ? top : 60,
        left: 16,
        right: 16,
        width: 'auto',
        maxHeight,
      });
    } else {
      const dropdownWidth = 384;
      const top = rect.bottom + 8;
      const maxHeight = Math.max(250, viewportHeight - top - 16);

      let right = viewportWidth - rect.right;
      if (viewportWidth - right < dropdownWidth + 16) {
        right = Math.max(16, viewportWidth - dropdownWidth - 16);
      }
      if (right < 16) {
        right = 16;
      }

      setCoords({
        top: top > 0 ? top : 60,
        right,
        width: dropdownWidth,
        maxHeight,
      });
    }
  }, []);

  // Recalculate position on resize and scroll when open
  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleUpdate = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
    };
  }, [isOpen, updatePosition]);

  // Close on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'MEETING_REQUEST_RECEIVED':
        return <CalendarPlus className="w-4 h-4 text-teal-600 shrink-0" />;
      case 'MEETING_REQUEST_ACCEPTED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'MEETING_REQUEST_REJECTED':
        return <XCircle className="w-4 h-4 text-rose-600 shrink-0" />;
      case 'MEETING_REQUEST_CANCELLED':
        return <Ban className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'MEETING_COMPLETED':
        return <CalendarCheck className="w-4 h-4 text-blue-600 shrink-0" />;
      case 'MEETING_REMINDER':
        return <Clock className="w-4 h-4 text-purple-600 shrink-0" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500 shrink-0" />;
    }
  };

  const handleNotificationClick = async (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      await markAsRead(notificationId);
    }
    setIsOpen(false);

    if (onNavigateToMeetings) {
      onNavigateToMeetings();
    } else {
      const destination = userRole === 'staff' ? '/staff/dashboard' : '/student/dashboard';
      navigate(`${destination}?tab=meetings`);
    }
  };

  const previewNotifications = notifications.slice(0, 6);

  const dropdownPortal = isOpen && typeof document !== 'undefined' && (
    <div
      ref={dropdownRef}
      data-testid="notification-dropdown"
      style={{
        position: 'fixed',
        top: coords ? `${coords.top}px` : '4rem',
        left: coords?.left !== undefined ? `${coords.left}px` : undefined,
        right: coords?.right !== undefined ? `${coords.right}px` : '1rem',
        width: coords?.width ? (typeof coords.width === 'number' ? `${coords.width}px` : coords.width) : '24rem',
        maxHeight: coords?.maxHeight ? `${coords.maxHeight}px` : '32rem',
        zIndex: 9999,
      }}
      className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 text-left font-sans flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50/90 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-[#0d5c58]">
              {unreadCount} new
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllAsRead()}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#0d5c58] hover:text-[#094340] transition-colors cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* List Content */}
      <div className="overflow-y-auto divide-y divide-slate-100 flex-1 max-h-80">
        {isLoading && notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-[#0d5c58]" />
            <span className="text-xs">Loading notifications...</span>
          </div>
        ) : previewNotifications.length === 0 ? (
          <div className="py-8 px-4 text-center space-y-1.5">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Bell className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-700">No notifications yet</p>
            <p className="text-[11px] text-slate-400">
              Updates on meeting requests will appear here.
            </p>
          </div>
        ) : (
          previewNotifications.map((item) => (
            <div
              key={item.id}
              onClick={() => handleNotificationClick(item.id, item.is_read)}
              className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer text-left ${
                !item.is_read ? 'bg-teal-50/40' : ''
              }`}
            >
              <div className="mt-0.5 p-1.5 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
                {getNotificationIcon(item.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`text-xs truncate ${
                      !item.is_read
                        ? 'font-bold text-slate-900'
                        : 'font-medium text-slate-700'
                    }`}
                  >
                    {item.title}
                  </p>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {formatRelativeTime(item.created_at)}
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                  {item.message}
                </p>
              </div>

              {!item.is_read && (
                <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0 mt-1.5" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 bg-slate-50/90 border-t border-slate-200 text-center shrink-0">
        <Link
          to="/notifications"
          onClick={() => setIsOpen(false)}
          className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#0d5c58] hover:text-[#094340] py-1 transition-colors"
        >
          <span>View all notifications</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      {/* Bell Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (!isOpen) {
            updatePosition();
          }
          setIsOpen((prev) => !prev);
        }}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0d5c58]/30 cursor-pointer"
        aria-label="Open notifications"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            data-testid="notification-badge"
            className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-teal-600 rounded-full border-2 border-white shadow-xs animate-in zoom-in-75 duration-150"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu rendered via Portal */}
      {dropdownPortal ? createPortal(dropdownPortal, document.body) : null}
    </div>
  );
};
