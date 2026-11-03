import React from 'react';
import { GraduationCap, Briefcase, CheckCircle2, LogOut, User, Building, Hash, Calendar, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/useAuth';

export const AuthSuccessView: React.FC = () => {
  const { user, profile, signOut, isLoading } = useAuth();

  const role = profile?.role || user?.user_metadata?.role || 'student';
  const fullName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const email = profile?.email || user?.email || '';
  const department = profile?.department || user?.user_metadata?.department || 'Not specified';

  return (
    <div className="w-full text-left space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200 shadow-sm shrink-0">
          <CheckCircle2 className="w-5 h-5 text-teal-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
            AUTHENTICATED
          </h2>
          <p className="text-xs text-slate-500">
            Phase 1 authentication complete.
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-semibold text-sm">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900">{fullName}</div>
              <div className="text-[11px] text-slate-500">{email}</div>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
              role === 'student'
                ? 'bg-blue-100/80 text-blue-800 border border-blue-200'
                : 'bg-emerald-100/80 text-emerald-800 border border-emerald-200'
            }`}
          >
            {role === 'student' ? (
              <GraduationCap className="w-3.5 h-3.5" />
            ) : (
              <Briefcase className="w-3.5 h-3.5" />
            )}
            <span>{role}</span>
          </span>
        </div>

        {/* Profile Attributes */}
        <div className="grid grid-cols-1 gap-2 text-xs">
          <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-white border border-slate-100">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400" /> Department:
            </span>
            <span className="font-medium text-slate-800">{department}</span>
          </div>

          {role === 'student' && (
            <>
              {profile?.register_number && (
                <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-white border border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-slate-400" /> Register No:
                  </span>
                  <span className="font-medium text-slate-800">
                    {profile.register_number}
                  </span>
                </div>
              )}
              {profile?.year_of_study && (
                <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-white border border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Year of Study:
                  </span>
                  <span className="font-medium text-slate-800">
                    {profile.year_of_study}
                  </span>
                </div>
              )}
            </>
          )}

          {role === 'staff' && (
            <>
              {profile?.employee_id && (
                <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-white border border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-slate-400" /> Employee ID:
                  </span>
                  <span className="font-medium text-slate-800">
                    {profile.employee_id}
                  </span>
                </div>
              )}
              {profile?.designation && (
                <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-white border border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Designation:
                  </span>
                  <span className="font-medium text-slate-800">
                    {profile.designation}
                  </span>
                </div>
              )}
            </>
          )}

          <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-white border border-slate-100">
            <span className="text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Session:
            </span>
            <span className="font-medium text-emerald-600">Active (Verified)</span>
          </div>
        </div>
      </div>

      {/* Scope Notification */}
      <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-xl text-left text-xs text-teal-900 space-y-1">
        <p className="font-semibold text-teal-950">Phase 1 Scope Restricted Notice</p>
        <p className="text-[11px] text-teal-800/90 leading-relaxed">
          The student and staff dashboards, faculty discovery, and real-time availability tracking are intentionally reserved for Phase 2 awaiting authorization.
        </p>
      </div>

      {/* Sign Out Button */}
      <button
        type="button"
        onClick={() => signOut()}
        disabled={isLoading}
        className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-sm transition-all duration-150 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-900/30 cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        <span>Sign out</span>
      </button>
    </div>
  );
};
