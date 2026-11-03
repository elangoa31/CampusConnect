import React from 'react';
import { Building2, Briefcase, MapPin, Clock, ArrowUpRight } from 'lucide-react';
import type { FacultyMember } from '../../types/faculty.types';
import { formatRelativeTime } from '../../services/faculty.service';
import { FacultyStatusBadge } from './FacultyStatusBadge';

interface FacultyCardProps {
  faculty: FacultyMember;
  onSelect: (faculty: FacultyMember) => void;
}

export const FacultyCard: React.FC<FacultyCardProps> = ({ faculty, onSelect }) => {
  const initials = faculty.full_name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'FC';

  return (
    <div
      onClick={() => onSelect(faculty)}
      className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-teal-200 transition-all duration-200 flex flex-col justify-between text-left cursor-pointer group hover:-translate-y-0.5"
    >
      <div>
        {/* Top: Avatar + Status Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            {faculty.avatar_url ? (
              <img
                src={faculty.avatar_url}
                alt={faculty.full_name}
                className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-2xs shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-[#0d5c58] text-white font-bold text-base flex items-center justify-center shadow-2xs shrink-0">
                {initials}
              </div>
            )}

            <div className="min-w-0">
              <h3 className="font-bold text-base text-slate-900 group-hover:text-[#0d5c58] transition-colors truncate">
                {faculty.full_name}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{faculty.designation || 'Faculty Member'}</span>
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <FacultyStatusBadge status={faculty.availability_status} size="sm" />
          </div>
        </div>

        {/* Metadata Details */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2 text-xs">
          {/* Department */}
          <div className="flex items-center gap-2 text-slate-600">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate font-medium">{faculty.department}</span>
          </div>

          {/* Current Location */}
          <div className="flex items-center gap-2 text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span
              className={`truncate ${
                faculty.location
                  ? 'font-medium text-slate-800'
                  : 'text-slate-400 italic'
              }`}
            >
              {faculty.location || 'Location not shared'}
            </span>
          </div>

          {/* Availability Message (Requirement 5) */}
          {faculty.status_message && (
            <div className="p-2 bg-teal-50/70 rounded-xl border border-teal-100/80 text-[11px] text-teal-900 leading-snug italic truncate">
              "{faculty.status_message}"
            </div>
          )}

          {/* Taught Subjects (if any) */}
          {faculty.subjects && faculty.subjects.length > 0 && (
            <div className="flex items-center gap-1 overflow-hidden pt-0.5">
              <span className="text-[10px] text-slate-400 shrink-0 font-medium">Subjects:</span>
              <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md truncate">
                {faculty.subjects.slice(0, 2).join(', ')}
                {faculty.subjects.length > 2 ? ` +${faculty.subjects.length - 2}` : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer: Last Updated + Click Prompt */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5 truncate">
          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
          <span>{formatRelativeTime(faculty.availability_updated_at)}</span>
        </span>

        <span className="inline-flex items-center gap-0.5 text-[#0d5c58] font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          <span>View Profile</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
