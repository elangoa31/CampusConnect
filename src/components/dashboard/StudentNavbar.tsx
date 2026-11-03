import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Compass,
  LayoutDashboard,
  Search,
  User,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';

interface StudentNavbarProps {
  activeTab: 'overview' | 'directory' | 'meetings';
  onTabChange: (tab: 'overview' | 'directory' | 'meetings') => void;
  facultyCount: number;
  meetingCount?: number;
}

export const StudentNavbar: React.FC<StudentNavbarProps> = ({
  activeTab,
  onTabChange,
  facultyCount,
  meetingCount = 0,
}) => {
  const { signOut, isLoading, user, profile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const studentName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    'Student';

  const isProfileActive = location.pathname.includes('/student/profile');

  const handleNavClick = (tab: 'overview' | 'directory' | 'meetings') => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-6">
          <Link
            to="/student/dashboard"
            onClick={() => handleNavClick('overview')}
            className="flex items-center space-x-3 group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#0d5c58] flex items-center justify-center text-teal-200 shadow-xs group-hover:bg-[#094340] transition-colors">
              <Compass className="w-5 h-5 text-teal-200" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-base sm:text-lg tracking-wider text-slate-900 group-hover:text-slate-800 transition-colors">
                CAMPUSCONNECT
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#0d5c58] font-bold">
                Student Portal
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-slate-200">
            <button
              type="button"
              onClick={() => handleNavClick('overview')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'overview' && !isProfileActive
                  ? 'bg-teal-50 text-[#0d5c58] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('directory')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'directory' && !isProfileActive
                  ? 'bg-teal-50 text-[#0d5c58] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Find Faculty</span>
              {facultyCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-teal-100/80 text-teal-800 font-bold">
                  {facultyCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('meetings')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'meetings' && !isProfileActive
                  ? 'bg-teal-50 text-[#0d5c58] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>My Meetings</span>
              {meetingCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                  {meetingCount}
                </span>
              )}
            </button>

            <Link
              to="/student/profile-setup?edit=true"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                isProfileActive
                  ? 'bg-teal-50 text-[#0d5c58] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <User className="w-4 h-4" />
              <span>My Profile</span>
            </Link>
          </nav>
        </div>

        {/* Right Section: User snippet & Sign Out */}
        <div className="hidden md:flex items-center space-x-3">
          <Link
            to="/student/profile-setup?edit=true"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-teal-100 text-[#0d5c58] font-bold text-xs flex items-center justify-center border border-teal-200">
              {studentName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-800 leading-tight">
                {studentName}
              </span>
              <span className="text-[10px] text-slate-400">Student</span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => signOut()}
            disabled={isLoading}
            className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200/80 shadow-2xs cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center space-x-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-9 h-9 rounded-full bg-teal-100 text-[#0d5c58] font-bold text-sm flex items-center justify-center border border-teal-200">
              {studentName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900">{studentName}</span>
              <span className="text-[10px] text-teal-700 font-medium flex items-center gap-1">
                <GraduationCap className="w-3 h-3" /> Student
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => handleNavClick('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-colors ${
                activeTab === 'overview' && !isProfileActive
                  ? 'bg-teal-50 text-[#0d5c58]'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard Overview</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('directory')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-colors ${
                activeTab === 'directory' && !isProfileActive
                  ? 'bg-teal-50 text-[#0d5c58]'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Search className="w-4 h-4" />
                <span>Find Faculty</span>
              </div>
              {facultyCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-teal-100 text-teal-800 font-bold">
                  {facultyCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('meetings')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-colors ${
                activeTab === 'meetings' && !isProfileActive
                  ? 'bg-teal-50 text-[#0d5c58]'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4" />
                <span>My Meetings</span>
              </div>
              {meetingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                  {meetingCount}
                </span>
              )}
            </button>

            <Link
              to="/student/profile-setup?edit=true"
              onClick={() => setMobileMenuOpen(false)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-colors ${
                isProfileActive
                  ? 'bg-teal-50 text-[#0d5c58]'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <User className="w-4 h-4" />
              <span>My Profile</span>
            </Link>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => signOut()}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
