import React, { useEffect } from 'react';
import {
  X,
  Building2,
  Briefcase,
  MapPin,
  Mail,
  Clock,
  ExternalLink,
  ShieldCheck,
  IdCard,
} from 'lucide-react';
import type { FacultyMember } from '../../types/faculty.types';
import { FacultyStatusBadge } from './FacultyStatusBadge';

interface FacultyDetailModalProps {
  faculty: FacultyMember | null;
  onClose: () => void;
}

export const FacultyDetailModal: React.FC<FacultyDetailModalProps> = ({
  faculty,
  onClose,
}) => {
  // ESC key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (faculty) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [faculty, onClose]);

  if (!faculty) return null;

  const initials =
    faculty.full_name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'FC';

  const formatFullTimestamp = (dateString?: string | null): string => {
    if (!dateString) return 'No status updates recorded yet.';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'No status updates recorded yet.';
      return date.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return 'No status updates recorded yet.';
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'Faculty member is currently available in their office for student discussions, doubt clearing, or consultation.';
      case 'BUSY':
        return 'Faculty member is currently occupied with department meetings or scheduled work.';
      case 'IN CLASS':
        return 'Faculty member is conducting lectures or laboratory sessions.';
      case 'ON LEAVE':
        return 'Faculty member is on approved academic or personal leave.';
      case 'UNKNOWN':
      default:
        return 'No recent availability update has been broadcast by this faculty member. Status is unknown.';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="faculty-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn text-left font-sans"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Top: Close Button */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {faculty.avatar_url ? (
              <img
                src={faculty.avatar_url}
                alt={faculty.full_name}
                className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-[#0d5c58] text-white font-bold text-lg flex items-center justify-center shadow-sm shrink-0">
                {initials}
              </div>
            )}

            <div className="min-w-0">
              <h2
                id="faculty-modal-title"
                className="text-xl font-bold tracking-tight text-slate-900 truncate"
              >
                {faculty.full_name}
              </h2>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{faculty.designation || 'Faculty Member'}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Card */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Current Availability
            </span>
            <FacultyStatusBadge status={faculty.availability_status} size="md" />
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {getStatusDescription(faculty.availability_status)}
          </p>
        </div>

        {/* Detailed Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Department */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-400 flex items-center gap-1 text-[11px]">
              <Building2 className="w-3.5 h-3.5" /> Department
            </span>
            <span className="font-semibold text-slate-800 block text-sm">
              {faculty.department}
            </span>
          </div>

          {/* Current Location */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-400 flex items-center gap-1 text-[11px]">
              <MapPin className="w-3.5 h-3.5" /> Current Location
            </span>
            <span
              className={`font-semibold block text-sm ${
                faculty.location ? 'text-slate-900' : 'text-slate-400 italic'
              }`}
            >
              {faculty.location || 'Location not shared'}
            </span>
          </div>

          {/* Employee ID */}
          {faculty.employee_id && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                <IdCard className="w-3.5 h-3.5" /> Employee ID
              </span>
              <span className="font-semibold text-slate-800 block text-sm">
                {faculty.employee_id}
              </span>
            </div>
          )}

          {/* Verification Badge */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-400 flex items-center gap-1 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> Account Status
            </span>
            <span className="font-semibold text-teal-800 block text-sm">
              Verified Faculty
            </span>
          </div>
        </div>

        {/* College Email & Contact */}
        <div className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="text-[11px] text-teal-700 font-medium block">
              Official College Email
            </span>
            <span className="font-semibold text-slate-900 text-sm block">
              {faculty.email || 'Email not visible'}
            </span>
          </div>

          {faculty.email && (
            <a
              href={`mailto:${faculty.email}?subject=CampusConnect Inquiry`}
              className="inline-flex items-center justify-center gap-1.5 py-2 px-3.5 bg-[#0d5c58] hover:bg-[#094340] text-white font-semibold rounded-xl text-xs shadow-2xs transition-colors whitespace-nowrap"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Send Email</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          )}
        </div>

        {/* Last Updated Timestamp */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-1 border-t border-slate-100">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Last status update: {formatFullTimestamp(faculty.availability_updated_at)}</span>
        </div>

        {/* Close Action */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
