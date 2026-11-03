import React, { useState, useEffect, useCallback } from 'react';
import {
  Menu,
  Clock,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Edit3,
  CalendarCheck,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import type { StaffProfile, TimetableEntry } from '../../types/staff.types';
import { StaffService } from '../../services/staff.service';
import { MeetingService } from '../../services/meeting.service';
import { StaffSidebar, type StaffDashboardTab } from '../../components/staff/StaffSidebar';
import { StaffProfileCard } from '../../components/staff/StaffProfileCard';
import { TodayScheduleCard } from '../../components/staff/TodayScheduleCard';
import { StaffAvailabilityManager } from '../../components/staff/StaffAvailabilityManager';
import { StaffTimetableManager } from '../../components/staff/StaffTimetableManager';
import { StaffEditProfileModal } from '../../components/staff/StaffEditProfileModal';
import { StaffMeetingRequestsManager } from '../../components/meetings/StaffMeetingRequestsManager';
import { FacultyStatusBadge } from '../../components/dashboard/FacultyStatusBadge';

export const StaffDashboard: React.FC = () => {
  const { user, profile: authProfile, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<StaffDashboardTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState<boolean>(false);
  const [pendingMeetingsCount, setPendingMeetingsCount] = useState<number>(0);

  // Live Staff Profile State
  const [staffProfile, setStaffProfile] = useState<StaffProfile | null>(null);
  const [isFetchingProfile, setIsFetchingProfile] = useState<boolean>(true);
  const [profileFetchError, setProfileFetchError] = useState<string | null>(null);

  // Timetable State
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);

  // Fetch Live Data
  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setIsFetchingProfile(true);
    setProfileFetchError(null);

    try {
      const [profileData, timetableData] = await Promise.all([
        StaffService.getStaffProfile(user.id),
        StaffService.getStaffTimetable(user.id),
      ]);

      if (profileData) {
        setStaffProfile(profileData);
      } else if (authProfile) {
        setStaffProfile({
          ...authProfile,
          employee_id: StaffService.sanitizeEmployeeId(
            authProfile.employee_id,
            authProfile.email
          ),
          availability_status: 'UNKNOWN',
        });
      }

      setTimetable(timetableData);
    } catch (err: any) {
      setProfileFetchError(err?.message || 'Failed to load staff information.');
    } finally {
      setIsFetchingProfile(false);
    }
  }, [user, authProfile]);

  useEffect(() => {
    let ignore = false;
    const initialLoad = async () => {
      if (!user?.id) return;
      try {
        const [profileData, timetableData] = await Promise.all([
          StaffService.getStaffProfile(user.id),
          StaffService.getStaffTimetable(user.id),
        ]);

        if (!ignore) {
          if (profileData) {
            setStaffProfile(profileData);
          } else if (authProfile) {
            setStaffProfile({
              ...authProfile,
              employee_id: StaffService.sanitizeEmployeeId(
                authProfile.employee_id,
                authProfile.email
              ),
              availability_status: 'UNKNOWN',
            });
          }
          setTimetable(timetableData);
        }
      } catch (err: any) {
        if (!ignore) {
          setProfileFetchError(err?.message || 'Failed to load staff information.');
        }
      } finally {
        if (!ignore) {
          setIsFetchingProfile(false);
        }
      }
    };

    initialLoad();
    return () => {
      ignore = true;
    };
  }, [user, authProfile]);

  // Load and subscribe to incoming meetings count
  useEffect(() => {
    if (!user?.id) return;
    let isCurrent = true;

    const fetchMeetingsCount = async () => {
      try {
        const meetings = await MeetingService.getStaffMeetings(user.id);
        if (isCurrent) {
          const pending = meetings.filter((m) => m.status === 'PENDING').length;
          setPendingMeetingsCount(pending);
        }
      } catch {
        // fail gracefully
      }
    };

    fetchMeetingsCount();

    const unsub = MeetingService.subscribeToStaffMeetings(user.id, () => {
      fetchMeetingsCount();
    });

    return () => {
      isCurrent = false;
      unsub();
    };
  }, [user?.id]);

  const fullName =
    staffProfile?.full_name ||
    authProfile?.full_name ||
    user?.user_metadata?.full_name ||
    'Faculty Member';

  const employeeId = StaffService.sanitizeEmployeeId(
    staffProfile?.employee_id || authProfile?.employee_id || user?.user_metadata?.employee_id,
    staffProfile?.email || user?.email
  );

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-slate-900 font-sans flex">
      {/* Sidebar Navigation */}
      <StaffSidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        profile={staffProfile}
        pendingMeetingsCount={pendingMeetingsCount}
        onSignOut={() => signOut()}
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
        onOpenEditProfile={() => setIsEditProfileOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Mobile Top Navbar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-sm tracking-wider text-slate-900 leading-tight">
                CampusConnect
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#0d5c58] font-bold">
                Faculty Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <FacultyStatusBadge
              status={staffProfile?.availability_status || 'UNKNOWN'}
              size="sm"
            />
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl w-full mx-auto flex-1">
          {/* Welcome & Quick Action Bar */}
          <section className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs text-left relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-[#0d5c58] border border-teal-200">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Faculty Management Center</span>
                  </span>
                  <span className="sr-only">Faculty Dashboard Placeholder</span>

                  {employeeId !== 'Not provided' && (
                    <span className="text-[11px] text-slate-500 font-medium">
                      Employee ID: <strong className="text-slate-700">{employeeId}</strong>
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  Welcome, {fullName}
                </h1>
                <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                  Manage your real-time campus presence, broadcast availability to students, and maintain your weekly estimated timetable schedule.
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(true)}
                  className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('meetings');
                    const el = document.getElementById('meetings-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`inline-flex items-center gap-1.5 py-2 px-3.5 font-semibold text-xs rounded-xl border transition-colors shadow-2xs cursor-pointer ${
                    activeTab === 'meetings'
                      ? 'bg-[#0d5c58] text-white border-[#0d5c58]'
                      : 'bg-teal-50 hover:bg-teal-100/80 text-[#0d5c58] border-teal-200/80'
                  }`}
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>Meeting Requests</span>
                  {pendingMeetingsCount > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        activeTab === 'meetings'
                          ? 'bg-amber-400 text-amber-950'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {pendingMeetingsCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={loadData}
                  disabled={isFetchingProfile}
                  className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                  title="Refresh records from Supabase"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 text-slate-600 ${
                      isFetchingProfile ? 'animate-spin' : ''
                    }`}
                  />
                  <span>Refresh</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('availability');
                    const el = document.getElementById('availability-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-2 py-2 px-4 bg-[#0d5c58] hover:bg-[#094340] text-white font-semibold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Update Availability</span>
                </button>
              </div>
            </div>
          </section>

          {/* Error notice if fetch failed */}
          {profileFetchError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-red-800 text-left">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{profileFetchError}</span>
              </div>
              <button
                type="button"
                onClick={loadData}
                className="py-1 px-3 bg-white border border-red-200 rounded-lg font-semibold hover:bg-red-100/50"
              >
                Retry
              </button>
            </div>
          )}

          {/* Tab View: Meeting Requests */}
          {activeTab === 'meetings' ? (
            <section id="meetings-section" className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs">
              <StaffMeetingRequestsManager staffId={user?.id || ''} />
            </section>
          ) : (
            <>
              {/* Section: Profile Overview & Today's Schedule Grid */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <StaffProfileCard
                    profile={staffProfile}
                    onEditProfile={() => setIsEditProfileOpen(true)}
                  />
                </div>
                <div className="lg:col-span-1">
                  <TodayScheduleCard
                    timetable={timetable}
                    onOpenTimetableTab={() => {
                      setActiveTab('timetable');
                      const el = document.getElementById('timetable-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                  />
                </div>
              </section>

              {/* Section: Meeting Requests Manager in Overview */}
              <section id="meetings-section" className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs">
                <StaffMeetingRequestsManager staffId={user?.id || ''} />
              </section>

              {/* Section: Availability & Location Management */}
              <section id="availability-section">
                <StaffAvailabilityManager
                  key={staffProfile?.availability_updated_at || staffProfile?.id || 'new'}
                  profile={staffProfile}
                  onAvailabilityUpdated={(updated) => {
                    setStaffProfile(updated);
                  }}
                />
              </section>

              {/* Section: Timetable Management */}
              <section id="timetable-section">
                <StaffTimetableManager
                  userId={user?.id || ''}
                  defaultDepartment={staffProfile?.department || ''}
                  timetable={timetable}
                  onTimetableUpdated={loadData}
                />
              </section>
            </>
          )}
        </main>
      </div>

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <StaffEditProfileModal
          profile={staffProfile}
          onClose={() => setIsEditProfileOpen(false)}
          onProfileUpdated={(updated) => {
            setStaffProfile(updated);
          }}
        />
      )}
    </div>
  );
};
