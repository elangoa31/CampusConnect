import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Trash2,
  ArrowLeft,
  CalendarPlus,
  CheckCircle2,
  XCircle,
  Ban,
  Clock,
  CalendarCheck,
  ExternalLink,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../context/useAuth';
import { formatRelativeTime } from '../../utils/date';
import type { NotificationType } from '../../types/notification.types';

export const NotificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const userRole = profile?.role || (user?.user_metadata?.role as 'student' | 'staff' | undefined);

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');

  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearRead,
  } = useNotifications({ status: activeFilter });

  const totalCount = notifications.length;
  const readCount = notifications.filter((n) => n.is_read).length;

  const dashboardPath = userRole === 'staff' ? '/staff/dashboard' : '/student/dashboard';

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'MEETING_REQUEST_RECEIVED':
        return <CalendarPlus className="w-5 h-5 text-teal-600 shrink-0" />;
      case 'MEETING_REQUEST_ACCEPTED':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
      case 'MEETING_REQUEST_REJECTED':
        return <XCircle className="w-5 h-5 text-rose-600 shrink-0" />;
      case 'MEETING_REQUEST_CANCELLED':
        return <Ban className="w-5 h-5 text-amber-600 shrink-0" />;
      case 'MEETING_COMPLETED':
        return <CalendarCheck className="w-5 h-5 text-blue-600 shrink-0" />;
      case 'MEETING_REMINDER':
        return <Clock className="w-5 h-5 text-purple-600 shrink-0" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500 shrink-0" />;
    }
  };

  const handleItemClick = async (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      await markAsRead(notificationId);
    }
    navigate(`${dashboardPath}?tab=meetings`);
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-slate-900 font-sans flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              to={dashboardPath}
              className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-teal-50 text-[#0d5c58] border border-teal-200">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{userRole === 'staff' ? 'Faculty Notifications' : 'Student Notifications'}</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page Heading & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-600 text-white shadow-2xs">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Stay updated on your consultation requests and meeting schedules.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsRead()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-[#0d5c58] hover:border-teal-200 hover:bg-teal-50/50 shadow-2xs transition-all cursor-pointer"
              >
                <CheckCheck className="w-4 h-4 text-[#0d5c58]" />
                <span>Mark all as read</span>
              </button>
            )}

            {readCount > 0 && (
              <button
                type="button"
                onClick={() => clearRead()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50 shadow-2xs transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-slate-400" />
                <span>Clear read</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80 w-fit">
          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('UNREAD')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'UNREAD'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('READ')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'READ'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Read
          </button>
        </div>

        {/* Notification Cards List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-200/90 shadow-2xs text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-[#0d5c58]" />
              <p className="text-xs font-medium text-slate-500">Loading your notifications...</p>
            </div>
          ) : totalCount === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-200/90 shadow-2xs text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0d5c58] flex items-center justify-center mx-auto border border-teal-100">
                <Bell className="w-6 h-6 text-[#0d5c58]" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                {activeFilter === 'UNREAD' ? 'No unread notifications' : 'No notifications yet'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                {activeFilter === 'UNREAD'
                  ? "You're all caught up! Updates regarding consultation meetings will appear here."
                  : 'Notifications about meeting requests, approvals, and reminders will be listed here.'}
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`group relative bg-white rounded-2xl p-4 sm:p-5 border transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left ${
                  !item.is_read
                    ? 'border-teal-200/90 bg-teal-50/20 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className="mt-0.5 p-2 rounded-xl bg-white border border-slate-200/90 shadow-2xs shrink-0">
                    {getNotificationIcon(item.type)}
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={`text-sm ${
                          !item.is_read ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'
                        }`}
                      >
                        {item.title}
                      </h4>
                      {!item.is_read && (
                        <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0" />
                      )}
                      <span className="text-[11px] text-slate-400 font-medium ml-auto sm:ml-0">
                        {formatRelativeTime(item.created_at)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed pr-2">
                      {item.message}
                    </p>

                    {item.actor && (
                      <p className="text-[11px] text-slate-400 font-medium">
                        Initiated by <strong className="text-slate-700">{item.actor.full_name}</strong>
                        {item.actor.department && ` (${item.actor.department})`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions on Item */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleItemClick(item.id, item.is_read)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0d5c58] hover:bg-[#094340] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                  >
                    <span>View Meeting</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  {!item.is_read && (
                    <button
                      type="button"
                      onClick={() => markAsRead(item.id)}
                      className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Mark as read"
                      aria-label="Mark as read"
                    >
                      <CheckCheck className="w-4 h-4 text-teal-600" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => deleteNotification(item.id)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete notification"
                    aria-label="Delete notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};
