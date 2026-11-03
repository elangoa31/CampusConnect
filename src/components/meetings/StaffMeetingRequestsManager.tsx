import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  User,
  AlertCircle,
  RefreshCw,
  Check,
  X,
  Building,
  GraduationCap,
  CalendarCheck,
  CalendarX,
  CheckCheck,
  Send,
  Loader2,
} from 'lucide-react';
import type { MeetingRequest } from '../../types/meeting.types';
import { MeetingService } from '../../services/meeting.service';
import { MeetingStatusBadge } from './MeetingStatusBadge';

interface StaffMeetingRequestsManagerProps {
  staffId: string;
}

export const StaffMeetingRequestsManager: React.FC<StaffMeetingRequestsManagerProps> = ({
  staffId,
}) => {
  const [meetings, setMeetings] = useState<MeetingRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filter Tabs
  const [activeTab, setActiveTab] = useState<'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'ALL'>('PENDING');

  // Response Modal State (Accept / Reject)
  const [respondingMeeting, setRespondingMeeting] = useState<{
    meeting: MeetingRequest;
    action: 'ACCEPTED' | 'REJECTED';
  } | null>(null);
  const [responseMessage, setResponseMessage] = useState<string>('');
  const [isResponding, setIsResponding] = useState<boolean>(false);
  const [responseError, setResponseError] = useState<string | null>(null);

  // Complete Meeting State
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [completeError, setCompleteError] = useState<string | null>(null);

  const loadMeetings = useCallback(async () => {
    if (!staffId) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await MeetingService.getStaffMeetings(staffId);
      setMeetings(data);
    } catch (err: any) {
      setFetchError(err?.message || 'Failed to fetch incoming meeting requests.');
    } finally {
      setIsLoading(false);
    }
  }, [staffId]);

  useEffect(() => {
    let ignore = false;
    const fetchInitial = async () => {
      try {
        const data = await MeetingService.getStaffMeetings(staffId);
        if (!ignore) {
          setMeetings(data);
        }
      } catch (err: any) {
        if (!ignore) {
          setFetchError(err?.message || 'Failed to fetch incoming meeting requests.');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    fetchInitial();

    // Subscribe to realtime updates for this staff member
    const unsubscribe = MeetingService.subscribeToStaffMeetings(staffId, () => {
      MeetingService.getStaffMeetings(staffId).then((data) => {
        if (!ignore) {
          setMeetings(data);
        }
      });
    });

    return () => {
      ignore = true;
      unsubscribe();
    };
  }, [staffId]);

  // Handle Accept / Reject submission
  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondingMeeting) return;

    setIsResponding(true);
    setResponseError(null);

    try {
      await MeetingService.respondToMeetingRequest(
        staffId,
        respondingMeeting.meeting.id,
        respondingMeeting.action,
        responseMessage
      );

      setRespondingMeeting(null);
      setResponseMessage('');
      await loadMeetings();
    } catch (err: any) {
      setResponseError(err?.message || `Failed to ${respondingMeeting.action.toLowerCase()} request.`);
    } finally {
      setIsResponding(false);
    }
  };

  // Handle Mark as Completed
  const handleCompleteMeeting = async (meetingId: string) => {
    setCompletingId(meetingId);
    setCompleteError(null);
    try {
      await MeetingService.completeMeetingRequest(staffId, meetingId);
      await loadMeetings();
    } catch (err: any) {
      setCompleteError(err?.message || 'Failed to complete meeting.');
    } finally {
      setCompletingId(null);
    }
  };

  // Filtered Meetings
  const filteredMeetings = useMemo(() => {
    if (activeTab === 'ALL') return meetings;
    return meetings.filter((m) => m.status === activeTab);
  }, [meetings, activeTab]);

  // Counts
  const counts = useMemo(() => {
    return {
      pending: meetings.filter((m) => m.status === 'PENDING').length,
      accepted: meetings.filter((m) => m.status === 'ACCEPTED').length,
      completed: meetings.filter((m) => m.status === 'COMPLETED').length,
      all: meetings.length,
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
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-[#0d5c58]" />
            <span>Student Meeting Requests</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review consultation requests, manage approved sessions, and provide feedback to students
          </p>
        </div>

        <button
          type="button"
          onClick={loadMeetings}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-slate-600 ${isLoading ? 'animate-spin' : ''}`}
          />
          <span>Refresh Requests</span>
        </button>
      </div>

      {/* Global Alerts */}
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

      {completeError && (
        <div
          role="alert"
          className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{completeError}</span>
        </div>
      )}

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('PENDING')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'PENDING'
              ? 'bg-[#0d5c58] text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>Pending Review</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'PENDING'
                ? 'bg-amber-400 text-amber-950'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {counts.pending}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ACCEPTED')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'ACCEPTED'
              ? 'bg-[#0d5c58] text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>Upcoming Accepted</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'ACCEPTED'
                ? 'bg-emerald-400 text-emerald-950'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {counts.accepted}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('COMPLETED')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'COMPLETED'
              ? 'bg-[#0d5c58] text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>Completed</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'COMPLETED'
                ? 'bg-teal-300 text-teal-950'
                : 'bg-teal-100 text-teal-800'
            }`}
          >
            {counts.completed}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'ALL'
              ? 'bg-[#0d5c58] text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>All Requests</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700 font-bold">
            {counts.all}
          </span>
        </button>
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-5 bg-white rounded-2xl border border-slate-200 animate-pulse space-y-3"
            >
              <div className="h-4 bg-slate-200 rounded w-1/4" />
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
            {activeTab === 'PENDING'
              ? 'No pending meeting requests'
              : activeTab === 'ACCEPTED'
              ? 'No upcoming accepted meetings'
              : 'No meeting requests found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeTab === 'PENDING'
              ? 'You are all caught up! New student requests will appear here in real-time.'
              : 'Requests will be cataloged here as students schedule consultation sessions.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMeetings.map((meeting) => {
            const studentName = meeting.student?.full_name || 'Student';
            const studentDept = meeting.student?.department || 'Department';
            const studentReg = meeting.student?.register_number || 'N/A';
            const studentYear = meeting.student?.year_of_study || '';

            return (
              <div
                key={meeting.id}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all space-y-4"
              >
                {/* Student Info & Status Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 text-[#0d5c58] font-bold text-xs flex items-center justify-center border border-teal-200 shrink-0">
                      {studentName
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((p) => p[0]?.toUpperCase())
                        .join('') || <User className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-sm text-slate-900 block truncate">
                        {studentName}
                      </span>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3 text-slate-400" />
                          {studentDept}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span>Reg: <strong className="text-slate-700">{studentReg}</strong></span>
                        {studentYear && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1">
                              <GraduationCap className="w-3 h-3 text-slate-400" />
                              {studentYear}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <MeetingStatusBadge status={meeting.status} />
                  </div>
                </div>

                {/* Timing & Format */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        Requested Date
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
                        Requested Time
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
                        Meeting Format
                      </span>
                      <span className="font-semibold text-slate-800">
                        {meeting.meeting_type === 'IN_PERSON' ? 'In Person' : 'Online'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Student's Purpose */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Purpose & Inquiry
                  </span>
                  <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-100 leading-relaxed">
                    {meeting.purpose}
                  </p>
                </div>

                {/* Staff Response Note if previously added */}
                {meeting.staff_response && (
                  <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-xl space-y-1 text-xs">
                    <span className="font-bold text-teal-800 block text-[11px]">
                      Your Response / Note:
                    </span>
                    <p className="text-teal-900 leading-relaxed">
                      "{meeting.staff_response}"
                    </p>
                  </div>
                )}

                {/* Actions Bar */}
                {meeting.status === 'PENDING' && (
                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() =>
                        setRespondingMeeting({
                          meeting,
                          action: 'REJECTED',
                        })
                      }
                      className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-semibold text-xs rounded-xl border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setRespondingMeeting({
                          meeting,
                          action: 'ACCEPTED',
                        })
                      }
                      className="inline-flex items-center gap-1.5 py-2 px-4 bg-[#0d5c58] hover:bg-[#094340] text-white font-semibold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept Request</span>
                    </button>
                  </div>
                )}

                {meeting.status === 'ACCEPTED' && (
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-xs text-emerald-700 font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Scheduled Session
                    </span>

                    <button
                      type="button"
                      onClick={() => handleCompleteMeeting(meeting.id)}
                      disabled={completingId === meeting.id}
                      className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-teal-50 hover:bg-teal-100 text-[#0d5c58] font-semibold text-xs rounded-xl border border-teal-200 transition-colors cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>
                        {completingId === meeting.id ? 'Updating...' : 'Mark as Completed'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Response Modal (Accept or Reject with optional note) */}
      {respondingMeeting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                    respondingMeeting.action === 'ACCEPTED'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {respondingMeeting.action === 'ACCEPTED' ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <X className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {respondingMeeting.action === 'ACCEPTED'
                      ? 'Accept Meeting Request'
                      : 'Decline Meeting Request'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Student: {respondingMeeting.meeting.student?.full_name || 'Student'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setRespondingMeeting(null)}
                disabled={isResponding}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {responseError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {responseError}
              </div>
            )}

            <form onSubmit={handleSubmitResponse} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Date:</span>
                  <span className="font-semibold text-slate-800">
                    {respondingMeeting.meeting.requested_date} at{' '}
                    {respondingMeeting.meeting.requested_time}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Purpose:</span>
                  <span className="font-medium text-slate-700 truncate max-w-[240px]">
                    {respondingMeeting.meeting.purpose}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="staff-response-input"
                  className="block text-xs font-bold text-slate-700"
                >
                  Optional Note to Student
                </label>
                <textarea
                  id="staff-response-input"
                  rows={3}
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder={
                    respondingMeeting.action === 'ACCEPTED'
                      ? 'E.g., Please bring your lab report or draft presentation...'
                      : 'E.g., Busy with evaluation this week; please request next Tuesday...'
                  }
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0d5c58] focus:bg-white transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRespondingMeeting(null)}
                  disabled={isResponding}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isResponding}
                  className={`inline-flex items-center gap-1.5 py-2 px-4 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors cursor-pointer ${
                    respondingMeeting.action === 'ACCEPTED'
                      ? 'bg-[#0d5c58] hover:bg-[#094340]'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {isResponding ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>
                        Confirm{' '}
                        {respondingMeeting.action === 'ACCEPTED' ? 'Acceptance' : 'Decline'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
