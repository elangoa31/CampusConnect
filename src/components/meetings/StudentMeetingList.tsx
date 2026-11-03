import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  User,
  AlertCircle,
  RefreshCw,
  Ban,
  MessageSquare,
  Building,
  CheckCircle2,
  CalendarX,
  Search,
} from 'lucide-react';
import type { MeetingRequest } from '../../types/meeting.types';
import { MeetingService } from '../../services/meeting.service';
import { MeetingStatusBadge } from './MeetingStatusBadge';

interface StudentMeetingListProps {
  studentId: string;
  onFindFacultyClick?: () => void;
}

export const StudentMeetingList: React.FC<StudentMeetingListProps> = ({
  studentId,
  onFindFacultyClick,
}) => {
  const [meetings, setMeetings] = useState<MeetingRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Status Filter Tab
  const [filterTab, setFilterTab] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED_REJECTED'>('ALL');

  // Cancellation State
  const [cancellingMeeting, setCancellingMeeting] = useState<MeetingRequest | null>(null);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const loadMeetings = useCallback(async () => {
    if (!studentId) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await MeetingService.getStudentMeetings(studentId);
      setMeetings(data);
    } catch (err: any) {
      setFetchError(err?.message || 'Failed to fetch your meeting requests.');
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    let ignore = false;
    const fetchInitial = async () => {
      try {
        const data = await MeetingService.getStudentMeetings(studentId);
        if (!ignore) {
          setMeetings(data);
        }
      } catch (err: any) {
        if (!ignore) {
          setFetchError(err?.message || 'Failed to fetch your meeting requests.');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    fetchInitial();

    // Realtime subscription: update when staff responds or status changes
    const unsubscribe = MeetingService.subscribeToStudentMeetings(studentId, () => {
      MeetingService.getStudentMeetings(studentId).then((data) => {
        if (!ignore) {
          setMeetings(data);
        }
      });
    });

    return () => {
      ignore = true;
      unsubscribe();
    };
  }, [studentId]);

  // Handle Cancel Request
  const handleConfirmCancel = async () => {
    if (!cancellingMeeting) return;
    setIsCancelling(true);
    setCancelError(null);
    try {
      await MeetingService.cancelMeetingRequest(studentId, cancellingMeeting.id);
      setCancellingMeeting(null);
      await loadMeetings();
    } catch (err: any) {
      setCancelError(err?.message || 'Failed to cancel the meeting request.');
    } finally {
      setIsCancelling(false);
    }
  };

  // Filtered meetings
  const filteredMeetings = useMemo(() => {
    if (filterTab === 'ALL') return meetings;
    if (filterTab === 'CANCELLED_REJECTED') {
      return meetings.filter((m) => m.status === 'CANCELLED' || m.status === 'REJECTED');
    }
    return meetings.filter((m) => m.status === filterTab);
  }, [meetings, filterTab]);

  // Status Counts
  const counts = useMemo(() => {
    return {
      all: meetings.length,
      pending: meetings.filter((m) => m.status === 'PENDING').length,
      accepted: meetings.filter((m) => m.status === 'ACCEPTED').length,
      completed: meetings.filter((m) => m.status === 'COMPLETED').length,
      other: meetings.filter((m) => m.status === 'CANCELLED' || m.status === 'REJECTED').length,
    };
  }, [meetings]);

  const formatDateDisplay = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#0d5c58]" />
            <span>My Meeting Requests</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track schedules, status responses, and appointments with faculty members
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadMeetings}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors shadow-2xs cursor-pointer"
            title="Refresh meetings"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-slate-600 ${isLoading ? 'animate-spin' : ''}`}
            />
            <span>Refresh</span>
          </button>

          {onFindFacultyClick && (
            <button
              type="button"
              onClick={onFindFacultyClick}
              className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-[#0d5c58] hover:bg-[#094340] text-white font-semibold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Book New Meeting</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {fetchError && (
        <div
          role="alert"
          className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-xs text-red-800"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{fetchError}</span>
          </div>
          <button
            type="button"
            onClick={loadMeetings}
            className="px-3 py-1 bg-white border border-red-200 rounded-lg font-semibold hover:bg-red-100/50"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setFilterTab('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            filterTab === 'ALL'
              ? 'bg-[#0d5c58] text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All Requests ({counts.all})
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('PENDING')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            filterTab === 'PENDING'
              ? 'bg-[#0d5c58] text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          Pending ({counts.pending})
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('ACCEPTED')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            filterTab === 'ACCEPTED'
              ? 'bg-[#0d5c58] text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Accepted ({counts.accepted})
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('COMPLETED')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            filterTab === 'COMPLETED'
              ? 'bg-[#0d5c58] text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-teal-500" />
          Completed ({counts.completed})
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('CANCELLED_REJECTED')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            filterTab === 'CANCELLED_REJECTED'
              ? 'bg-[#0d5c58] text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          Declined & Cancelled ({counts.other})
        </button>
      </div>

      {/* Meetings List / Grid */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-5 bg-white rounded-2xl border border-slate-200 animate-pulse space-y-3"
            >
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
              <div className="h-8 bg-slate-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="p-8 sm:p-12 bg-white rounded-3xl border border-slate-200/90 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0d5c58] border border-teal-200 flex items-center justify-center mx-auto">
            <CalendarX className="w-6 h-6 text-[#0d5c58]" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            {filterTab === 'ALL'
              ? 'No meeting requests found'
              : `No ${filterTab.toLowerCase().replace('_', '/')} meetings`}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {filterTab === 'ALL'
              ? 'You have not scheduled any meetings with faculty members yet. Use the faculty directory to request consultation.'
              : 'There are currently no meetings matching this status.'}
          </p>
          {onFindFacultyClick && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onFindFacultyClick}
                className="py-2 px-4 bg-[#0d5c58] hover:bg-[#094340] text-white font-semibold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Browse Faculty Directory
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMeetings.map((meeting) => {
            const staffName = meeting.staff?.full_name || 'Faculty Member';
            const staffDept = meeting.staff?.department || 'Department';
            const staffDesig = meeting.staff?.designation || 'Faculty';

            return (
              <div
                key={meeting.id}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all space-y-4"
              >
                {/* Top Row: Faculty details & Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 text-[#0d5c58] font-bold text-xs flex items-center justify-center border border-teal-200 shrink-0">
                      {staffName
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((p) => p[0]?.toUpperCase())
                        .join('') || <User className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-sm text-slate-900 block truncate">
                        {staffName}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {staffDesig} • {staffDept}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <MeetingStatusBadge status={meeting.status} />
                  </div>
                </div>

                {/* Middle Info: Date, Time & Meeting Type */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        Meeting Date
                      </span>
                      <span className="font-semibold text-slate-800">
                        {formatDateDisplay(meeting.requested_date)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        Time Slot
                      </span>
                      <span className="font-semibold text-slate-800">
                        {meeting.requested_time}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {meeting.meeting_type === 'IN_PERSON' ? (
                      <MapPin className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    ) : (
                      <Video className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    )}
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        Format
                      </span>
                      <span className="font-semibold text-slate-800">
                        {meeting.meeting_type === 'IN_PERSON'
                          ? `In Person ${meeting.staff?.location ? `(${meeting.staff.location})` : ''}`
                          : 'Online Meeting'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Purpose of meeting */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Purpose of Request
                  </span>
                  <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-100 leading-relaxed">
                    {meeting.purpose}
                  </p>
                </div>

                {/* Faculty Response Note (if provided) */}
                {meeting.staff_response && (
                  <div className="p-3 bg-teal-50/80 border border-teal-200/80 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-teal-800 font-bold">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Response from Faculty:</span>
                    </div>
                    <p className="text-teal-900 leading-relaxed">
                      "{meeting.staff_response}"
                    </p>
                  </div>
                )}

                {/* Actions: Cancel if Pending */}
                {meeting.status === 'PENDING' && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Awaiting faculty review
                    </span>

                    <button
                      type="button"
                      onClick={() => setCancellingMeeting(meeting)}
                      className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Cancel Request</span>
                    </button>
                  </div>
                )}

                {meeting.status === 'ACCEPTED' && (
                  <div className="flex items-center gap-1.5 pt-1 text-[11px] text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Meeting approved. Please be available on schedule.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal Before Cancellation */}
      {cancellingMeeting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 text-left">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center">
              <Ban className="w-6 h-6 text-red-600" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Cancel Meeting Request?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to cancel your meeting request with{' '}
                <strong className="text-slate-800">
                  {cancellingMeeting.staff?.full_name || 'the faculty member'}
                </strong>{' '}
                scheduled for{' '}
                <strong className="text-slate-800">
                  {cancellingMeeting.requested_date} at {cancellingMeeting.requested_time}
                </strong>
                ? This action cannot be undone.
              </p>
            </div>

            {cancelError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {cancelError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancellingMeeting(null)}
                disabled={isCancelling}
                className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Keep Request
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                {isCancelling ? 'Cancelling...' : 'Yes, Cancel Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
