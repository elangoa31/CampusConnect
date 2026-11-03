import React from 'react';
import {
  Compass,
  LayoutDashboard,
  Clock,
  Calendar,
  User,
  LogOut,
  X,
  Briefcase,
  CalendarCheck,
} from 'lucide-react';
import type { StaffProfile } from '../../types/staff.types';

export type StaffDashboardTab = 'overview' | 'availability' | 'timetable' | 'meetings' | 'profile';

interface StaffSidebarProps {
  activeTab: StaffDashboardTab;
  onTabChange: (tab: StaffDashboardTab) => void;
  profile: StaffProfile | null;
  onSignOut: () => void;
  isSigningOut?: boolean;
  mobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
  onOpenEditProfile: () => void;
  pendingMeetingsCount?: number;
}

export const StaffSidebar: React.FC<StaffSidebarProps> = ({
  activeTab,
  onTabChange,
  profile,
  onSignOut,
  isSigningOut = false,
  mobileMenuOpen,
  onCloseMobileMenu,
  onOpenEditProfile,
  pendingMeetingsCount = 0,
}) => {
  const staffName = profile?.full_name || 'Faculty Member';
  const initial = staffName.charAt(0).toUpperCase();

  const navItems = [
    {
      id: 'overview' as const,
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview & Today Schedule',
    },
    {
      id: 'meetings' as const,
      label: 'Meeting Requests',
      icon: CalendarCheck,
      description: 'Student Consultations',
      badge: pendingMeetingsCount,
    },
    {
      id: 'availability' as const,
      label: 'Availability & Location',
      icon: Clock,
      description: 'Broadcast Live Status',
    },
    {
      id: 'timetable' as const,
      label: 'Timetable Management',
      icon: Calendar,
      description: 'Weekly Estimated Schedule',
    },
    {
      id: 'profile' as const,
      label: 'My Faculty Profile',
      icon: User,
      description: 'Department & Employee ID',
    },
  ];

  const handleNavClick = (tabId: StaffDashboardTab) => {
    if (tabId === 'profile') {
      onOpenEditProfile();
    } else {
      onTabChange(tabId);
    }
    onCloseMobileMenu();
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between p-4 sm:p-5">
      {/* Brand & Portal Header */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0d5c58] flex items-center justify-center text-teal-200 shadow-sm shrink-0">
              <Compass className="w-5 h-5 text-teal-200" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-base tracking-wider text-slate-900 leading-tight">
                CAMPUSCONNECT
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#0d5c58] font-bold">
                Faculty / Staff Portal
              </span>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onCloseMobileMenu}
            className="md:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav aria-label="Staff Dashboard Navigation" className="space-y-1.5 text-left">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl font-semibold text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0d5c58] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-teal-200' : 'text-slate-400'
                  }`}
                />
                <div className="flex flex-col text-left flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="truncate">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          isActive
                            ? 'bg-amber-400 text-amber-950'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-normal truncate ${
                      isActive ? 'text-teal-100' : 'text-slate-400'
                    }`}
                  >
                    {item.description}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Staff Account & Logout */}
      <div className="pt-4 border-t border-slate-200 space-y-3">
        {/* User Card */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-left">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-[#0d5c58] font-bold text-sm flex items-center justify-center border border-teal-200 shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-xs text-slate-900 block truncate">
                {staffName}
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                {profile?.designation || 'Faculty Member'}
              </span>
            </div>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          type="button"
          onClick={onSignOut}
          disabled={isSigningOut}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200 transition-colors border border-slate-200 shadow-2xs cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-r border-slate-200/80 shrink-0 min-h-screen sticky top-0 h-screen overflow-y-auto">
        {navContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
            onClick={onCloseMobileMenu}
            aria-hidden="true"
          />
          <div className="relative z-10 w-72 bg-white h-full shadow-2xl flex flex-col animate-slideRight">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
