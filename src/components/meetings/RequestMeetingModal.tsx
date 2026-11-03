import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  MapPin,
  Video,
  User,
  AlertCircle,
  CheckCircle2,
  Send,
  Loader2,
  Building,
} from 'lucide-react';
import type { FacultyMember } from '../../types/faculty.types';
import type { MeetingType, MeetingRequest } from '../../types/meeting.types';
import { MeetingService } from '../../services/meeting.service';
import { validateMeetingRequestForm } from '../../utils/validation';
import { FacultyStatusBadge } from '../dashboard/FacultyStatusBadge';

interface RequestMeetingModalProps {
  faculty: FacultyMember | null;
  studentId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (createdMeeting: MeetingRequest) => void;
}

export const RequestMeetingModal: React.FC<RequestMeetingModalProps> = ({
  faculty,
  studentId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  // Format today's date in YYYY-MM-DD for the min date attribute
  const [todayStr] = useState(() => new Date().toISOString().split('T')[0]);

  const [requestedDate, setRequestedDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [requestedTime, setRequestedTime] = useState<string>('10:00');
  const [meetingType, setMeetingType] = useState<MeetingType>('IN_PERSON');
  const [purpose, setPurpose] = useState<string>('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !faculty) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const validationErrors = validateMeetingRequestForm({
      requested_date: requestedDate,
      requested_time: requestedTime,
      meeting_type: meetingType,
      purpose,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const created = await MeetingService.createMeetingRequest(studentId, {
        staff_id: faculty.id,
        requested_date: requestedDate,
        requested_time: requestedTime,
        meeting_type: meetingType,
        purpose: purpose.trim(),
      });

      setSubmittedSuccess(true);
      if (onSuccess) {
        onSuccess(created);
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to submit meeting request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="request-meeting-title"
    >
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-left flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#0d5c58] border border-teal-200 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5 text-[#0d5c58]" />
            </div>
            <div>
              <h2
                id="request-meeting-title"
                className="text-lg font-bold text-slate-900 leading-tight"
              >
                Request a Faculty Meeting
              </h2>
              <p className="text-xs text-slate-500">
                Schedule a consultation or doubt clearing slot
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Target Faculty Summary Card */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-teal-100 text-[#0d5c58] font-bold text-sm flex items-center justify-center border border-teal-200 shrink-0">
                {faculty.full_name
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((p) => p[0]?.toUpperCase())
                  .join('') || <User className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <span className="font-bold text-sm text-slate-900 block truncate">
                  {faculty.full_name}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
                  <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {faculty.designation} • {faculty.department}
                </span>
                {faculty.location && (
                  <span className="text-[11px] text-teal-800 flex items-center gap-1 mt-0.5 font-medium truncate">
                    <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
                    {faculty.location}
                  </span>
                )}
              </div>
            </div>

            <div className="shrink-0">
              <FacultyStatusBadge status={faculty.availability_status} size="sm" />
            </div>
          </div>

          {/* Submitted Success Screen */}
          {submittedSuccess ? (
            <div className="py-6 space-y-4 text-center animate-fadeIn">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center border border-emerald-200 shadow-sm">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Meeting Request Submitted!
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Your request has been forwarded to{' '}
                  <strong className="text-slate-800">{faculty.full_name}</strong>. You will be
                  notified in real-time once faculty responds.
                </p>
              </div>

              <div className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-2xl text-xs text-left max-w-md mx-auto space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Requested Date:</span>
                  <span className="font-semibold text-slate-800">{requestedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Requested Time:</span>
                  <span className="font-semibold text-slate-800">{requestedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Meeting Format:</span>
                  <span className="font-semibold text-slate-800">
                    {meetingType === 'IN_PERSON' ? 'In Person (Campus)' : 'Online Meeting'}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-6 bg-[#0d5c58] hover:bg-[#094340] text-white font-semibold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {submitError && (
                <div
                  role="alert"
                  className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Date & Time Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date Input */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="meeting-date"
                    className="block text-xs font-bold text-slate-700"
                  >
                    Preferred Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="meeting-date"
                      type="date"
                      min={todayStr}
                      value={requestedDate}
                      onChange={(e) => setRequestedDate(e.target.value)}
                      className={`w-full py-2.5 px-3 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0d5c58] focus:bg-white transition-all ${
                        errors.requested_date ? 'border-red-400 bg-red-50/30' : 'border-slate-200'
                      }`}
                    />
                  </div>
                  {errors.requested_date && (
                    <p className="text-[11px] text-red-600 font-medium">
                      {errors.requested_date}
                    </p>
                  )}
                </div>

                {/* Time Input */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="meeting-time"
                    className="block text-xs font-bold text-slate-700"
                  >
                    Preferred Time <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="meeting-time"
                      type="time"
                      value={requestedTime}
                      onChange={(e) => setRequestedTime(e.target.value)}
                      className={`w-full py-2.5 px-3 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0d5c58] focus:bg-white transition-all ${
                        errors.requested_time ? 'border-red-400 bg-red-50/30' : 'border-slate-200'
                      }`}
                    />
                  </div>
                  {errors.requested_time && (
                    <p className="text-[11px] text-red-600 font-medium">
                      {errors.requested_time}
                    </p>
                  )}
                </div>
              </div>

              {/* Meeting Type Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Meeting Format <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMeetingType('IN_PERSON')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                      meetingType === 'IN_PERSON'
                        ? 'border-[#0d5c58] bg-teal-50/70 text-[#0d5c58] shadow-2xs ring-1 ring-[#0d5c58]'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        In Person
                      </span>
                      {meetingType === 'IN_PERSON' && (
                        <span className="w-2 h-2 rounded-full bg-[#0d5c58]" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 leading-tight">
                      At faculty office, lab, or campus location
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMeetingType('ONLINE')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                      meetingType === 'ONLINE'
                        ? 'border-[#0d5c58] bg-teal-50/70 text-[#0d5c58] shadow-2xs ring-1 ring-[#0d5c58]'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5" />
                        Online
                      </span>
                      {meetingType === 'ONLINE' && (
                        <span className="w-2 h-2 rounded-full bg-[#0d5c58]" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 leading-tight">
                      Google Meet, Zoom, or video consultation
                    </span>
                  </button>
                </div>
              </div>

              {/* Purpose Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="meeting-purpose"
                    className="block text-xs font-bold text-slate-700"
                  >
                    Purpose of Meeting <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {purpose.length}/500 chars
                  </span>
                </div>
                <textarea
                  id="meeting-purpose"
                  rows={3}
                  maxLength={500}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="E.g., Clarification on Module 3 topics, final year project guidance, or recommendation letter discussion..."
                  className={`w-full py-2.5 px-3 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0d5c58] focus:bg-white transition-all resize-none ${
                    errors.purpose ? 'border-red-400 bg-red-50/30' : 'border-slate-200'
                  }`}
                />
                {errors.purpose && (
                  <p className="text-[11px] text-red-600 font-medium">
                    {errors.purpose}
                  </p>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 py-2.5 px-5 bg-[#0d5c58] hover:bg-[#094340] text-white font-semibold text-xs rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
