import React from 'react';
import { Compass, GraduationCap, LogOut, Building, Hash, Calendar, ShieldCheck, Clock } from 'lucide-react';
import { useAuth } from '../../context/useAuth';

export const StudentDashboardPlaceholder: React.FC = () => {
  const { user, profile, signOut, isLoading } = useAuth();

  const fullName = profile?.full_name || user?.user_metadata?.full_name || 'Student';
  const email = profile?.email || user?.email || '';
  const department = profile?.department || user?.user_metadata?.department || 'Not specified';
  const registerNumber = profile?.register_number || user?.user_metadata?.register_number || 'N/A';
  const yearOfStudy = profile?.year_of_study || user?.user_metadata?.year_of_study || 'N/A';

  return (
    <div className="min-h-screen w-full bg-slate-50 font-sans flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="w-full bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-[#0d5c58] flex items-center justify-center text-teal-200 shadow-xs">
            <Compass className="w-5 h-5 text-teal-200" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-extrabold text-base sm:text-lg tracking-wider text-slate-900">
              CAMPUSCONNECT
            </span>
            <span className="text-[10px] uppercase tracking-widest text-[#0d5c58] font-bold">
              Student Portal
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => signOut()}
          disabled={isLoading}
          className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign out</span>
        </button>
      </header>

      {/* Main Body */}
      <main className="max-w-2xl w-full mx-auto my-auto p-4 sm:p-6 space-y-6 text-left">
        {/* Verification Status Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-start justify-between pb-4 border-b border-slate-100">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-teal-50 text-[#0d5c58] border border-teal-200">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Verified Student Session</span>
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 pt-1">
                Welcome, {fullName}
              </h1>
              <p className="text-xs text-slate-500">{email}</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#0d5c58] flex items-center justify-center shrink-0 border border-teal-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          {/* Profile Attributes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[11px] flex items-center gap-1">
                <Building className="w-3.5 h-3.5" /> Department
              </span>
              <span className="font-semibold text-slate-800 text-sm mt-0.5 block">
                {department}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[11px] flex items-center gap-1">
                <Hash className="w-3.5 h-3.5" /> Register Number
              </span>
              <span className="font-semibold text-slate-800 text-sm mt-0.5 block">
                {registerNumber}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
              <span className="text-slate-400 block text-[11px] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Year of Study
              </span>
              <span className="font-semibold text-slate-800 text-sm mt-0.5 block">
                {yearOfStudy}
              </span>
            </div>
          </div>

          {/* Scope Notice */}
          <div className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-2xl text-xs text-teal-950 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-teal-900">
              <Clock className="w-4 h-4 text-[#0d5c58]" />
              <span>Student Dashboard Placeholder (Phase 2 Preview)</span>
            </div>
            <p className="text-[11px] text-teal-800/90 leading-relaxed">
              Real authentication, database role verification, and protected session access are successfully completed. Faculty search, real-time availability tracking, and discovery tools are reserved for Phase 2 upon approval.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-4 text-xs text-slate-400">
        CampusConnect • College Staff Availability & Discovery System
      </footer>
    </div>
  );
};
