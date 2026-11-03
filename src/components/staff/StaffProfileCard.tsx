import React from 'react';
import {
  Building2,
  Briefcase,
  IdCard,
  Mail,
  ShieldCheck,
  Edit3,
} from 'lucide-react';
import type { StaffProfile } from '../../types/staff.types';
import { StaffService } from '../../services/staff.service';

interface StaffProfileCardProps {
  profile: StaffProfile | null;
  onEditProfile: () => void;
}

export const StaffProfileCard: React.FC<StaffProfileCardProps> = ({
  profile,
  onEditProfile,
}) => {
  const fullName = profile?.full_name || 'Faculty Member';
  const email = profile?.email || '';
  const department = profile?.department || 'Not specified';
  const employeeId = StaffService.sanitizeEmployeeId(profile?.employee_id, profile?.email);
  const designation = profile?.designation || 'Not specified';

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs text-left space-y-5">
      {/* Top Banner with Name & Edit Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-teal-500 to-[#0d5c58] text-white font-extrabold text-xl flex items-center justify-center shadow-sm shrink-0">
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 truncate">
                {fullName}
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Verified Faculty Session</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{email}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onEditProfile}
          className="inline-flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-semibold bg-teal-50 hover:bg-teal-100 text-[#0d5c58] border border-teal-200 transition-colors shadow-2xs cursor-pointer self-start sm:self-center"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit Profile</span>
        </button>
      </div>

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        {/* Department */}
        <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1">
          <span className="text-slate-400 flex items-center gap-1 text-[11px]">
            <Building2 className="w-3.5 h-3.5" /> Department
          </span>
          <span className="font-bold text-slate-800 block text-sm">
            {department}
          </span>
        </div>

        {/* Employee ID */}
        <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1">
          <span className="text-slate-400 flex items-center gap-1 text-[11px]">
            <IdCard className="w-3.5 h-3.5" /> Employee ID
          </span>
          <span
            className={`font-bold block text-sm ${
              employeeId === 'Not provided' ? 'text-amber-700 italic font-medium' : 'text-slate-800'
            }`}
          >
            {employeeId}
          </span>
        </div>

        {/* Designation */}
        <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1">
          <span className="text-slate-400 flex items-center gap-1 text-[11px]">
            <Briefcase className="w-3.5 h-3.5" /> Designation
          </span>
          <span className="font-bold text-slate-800 block text-sm">
            {designation}
          </span>
        </div>
      </div>
    </div>
  );
};
