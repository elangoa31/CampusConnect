import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navigate, Link } from 'react-router-dom';
import {
  GraduationCap,
  Sparkles,
  RefreshCw,
  Search,
  Building,
  Calendar,
  AlertCircle,
  ExternalLink,
  Edit3,
  Hash,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { isStudentProfileComplete } from '../../utils/validation';
import { FacultyService } from '../../services/faculty.service';
import type {
  FacultyMember,
  FacultyFilters,
} from '../../types/faculty.types';
import { StudentNavbar } from '../../components/dashboard/StudentNavbar';
import { DashboardOverviewCards } from '../../components/dashboard/DashboardOverviewCards';
import { FacultyFiltersBar } from '../../components/dashboard/FacultyFiltersBar';
import { FacultyCard } from '../../components/dashboard/FacultyCard';
import { FacultyDetailModal } from '../../components/dashboard/FacultyDetailModal';
import { FacultySkeletonGrid } from '../../components/dashboard/FacultySkeletonGrid';
import { FacultyEmptyState } from '../../components/dashboard/FacultyEmptyState';

export const StudentDashboard: React.FC = () => {
  const { user, profile, isLoading: authLoading } = useAuth();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'overview' | 'directory'>('overview');

  // Faculty Data State
  const [facultyList, setFacultyList] = useState<FacultyMember[]>([]);
  const [isFetchingFaculty, setIsFetchingFaculty] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Selected faculty for detail modal
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyMember | null>(null);

  // Filters State
  const [filters, setFilters] = useState<FacultyFilters>({
    searchQuery: '',
    department: 'ALL',
    designation: 'ALL',
    availability: 'ALL',
  });

  // Fetch real faculty records from Supabase
  const loadFaculty = useCallback(async () => {
    setIsFetchingFaculty(true);
    setFetchError(null);
    try {
      const data = await FacultyService.getFacultyList();
      setFacultyList(data);
    } catch (err: any) {
      setFetchError(err?.message || 'Failed to load faculty records from database.');
    } finally {
      setIsFetchingFaculty(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const initialFetch = async () => {
      try {
        const data = await FacultyService.getFacultyList();
        if (!ignore) {
          setFacultyList(data);
        }
      } catch (err: any) {
        if (!ignore) {
          setFetchError(err?.message || 'Failed to load faculty records from database.');
        }
      } finally {
        if (!ignore) {
          setIsFetchingFaculty(false);
        }
      }
    };

    initialFetch();

    // Realtime subscription: updates when staff updates availability or location
    const unsubscribe = FacultyService.subscribeToFacultyUpdates(() => {
      FacultyService.getFacultyList().then((data) => {
        if (!ignore) {
          setFacultyList(data);
        }
      });
    });

    return () => {
      ignore = true;
      unsubscribe();
    };
  }, []);

  // Compute live statistics from real database records
  const stats = useMemo(() => {
    return FacultyService.computeStats(facultyList);
  }, [facultyList]);

  // Extract unique departments & designations from real faculty records
  const { availableDepartments, availableDesignations } = useMemo(() => {
    const deptSet = new Set<string>();
    const desigSet = new Set<string>();

    facultyList.forEach((f) => {
      if (f.department && f.department.trim()) {
        deptSet.add(f.department.trim());
      }
      if (f.designation && f.designation.trim()) {
        desigSet.add(f.designation.trim());
      }
    });

    return {
      availableDepartments: Array.from(deptSet).sort(),
      availableDesignations: Array.from(desigSet).sort(),
    };
  }, [facultyList]);

  // Filter faculty based on active criteria
  const filteredFaculty = useMemo(() => {
    return FacultyService.filterFaculty(facultyList, filters);
  }, [facultyList, filters]);

  // Quick filter by status card click
  const handleOverviewStatusClick = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      availability: status,
    }));
    setActiveTab('directory');
    // Smooth scroll down to directory section
    const el = document.getElementById('faculty-directory-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleClearFilters = () => {
    setFilters({
      searchQuery: '',
      department: 'ALL',
      designation: 'ALL',
      availability: 'ALL',
    });
  };

  // Redirect to setup if student profile is incomplete
  if (user && !authLoading && !isStudentProfileComplete(profile || user?.user_metadata)) {
    return <Navigate to="/student/profile-setup" replace />;
  }

  const studentName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    'Student';

  const department =
    profile?.department && profile.department !== 'General'
      ? profile.department
      : (user?.user_metadata?.department || 'General');

  const registerNumber =
    profile?.register_number || user?.user_metadata?.register_number || 'N/A';

  const yearOfStudy =
    profile?.year_of_study || user?.user_metadata?.year_of_study || 'Year 1';

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-slate-900 font-sans flex flex-col justify-between">
      {/* Top Navigation Bar */}
      <StudentNavbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'directory') {
            const el = document.getElementById('faculty-directory-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        facultyCount={facultyList.length}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 flex-1">
        {/* Welcome Section */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs text-left relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-teal-50 text-[#0d5c58] border border-teal-200">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Verified Student Session</span>
                </span>
                <span className="sr-only">Student Dashboard Placeholder</span>

                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Live Availability
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Welcome, {studentName}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-0.5">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>{department}</span>
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Hash className="w-3.5 h-3.5 text-slate-400" />
                  <span>{registerNumber}</span>
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{yearOfStudy}</span>
                </span>
              </div>

              <p className="text-xs text-slate-500 max-w-2xl leading-relaxed pt-1">
                Search faculty across your college, check real-time availability statuses, and find their current office or lab locations without walking across campus.
              </p>
            </div>

            {/* Quick Action Button */}
            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                to="/student/profile-setup?edit=true"
                className="inline-flex items-center gap-1.5 py-2.5 px-3.5 bg-teal-50 hover:bg-teal-100/80 text-[#0d5c58] font-semibold text-xs rounded-xl border border-teal-200/80 transition-colors shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </Link>

              <button
                type="button"
                onClick={loadFaculty}
                disabled={isFetchingFaculty}
                className="inline-flex items-center gap-2 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                title="Refresh availability records from Supabase"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-slate-600 ${
                    isFetchingFaculty ? 'animate-spin' : ''
                  }`}
                />
                <span>Refresh Data</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('faculty-directory-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 py-2.5 px-4 bg-[#0d5c58] hover:bg-[#094340] text-white font-semibold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Find Faculty</span>
              </button>
            </div>
          </div>
        </section>

        {/* Dashboard Overview Statistics Cards (Real Supabase Data) */}
        <section aria-label="Dashboard Overview Statistics" className="space-y-2">
          <div className="flex items-center justify-between text-left px-1">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Faculty Status Overview
            </h2>
            <span className="text-[11px] text-slate-400">
              Real-time database records
            </span>
          </div>

          <DashboardOverviewCards
            stats={stats}
            onFilterByStatus={handleOverviewStatusClick}
          />
        </section>

        {/* Database Error Banner if Supabase fetch failed */}
        {fetchError && (
          <div
            role="alert"
            className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-2xl flex items-start justify-between gap-3 text-left animate-fadeIn"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Could not fetch faculty records</span>
                <span className="text-red-700">{fetchError}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={loadFaculty}
              className="px-3 py-1 bg-white border border-red-200 text-red-700 font-semibold text-xs rounded-lg hover:bg-red-50 transition-colors shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Faculty Discovery Directory Section */}
        <section
          id="faculty-directory-section"
          aria-label="Faculty Directory"
          className="space-y-4 text-left pt-2"
        >
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Faculty Directory
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Locate faculty members and check their real-time availability status
              </p>
            </div>

            {facultyList.length > 0 && (
              <span className="text-xs font-semibold text-[#0d5c58] bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200/60 hidden sm:inline-block">
                {facultyList.length} Faculty Registered
              </span>
            )}
          </div>

          {/* Search & Filter Bar */}
          <FacultyFiltersBar
            filters={filters}
            onChange={setFilters}
            departments={availableDepartments}
            designations={availableDesignations}
            totalResults={filteredFaculty.length}
            totalFaculty={facultyList.length}
          />

          {/* Content States: Loading, Empty, or Faculty Cards Grid */}
          {isFetchingFaculty ? (
            <FacultySkeletonGrid count={6} />
          ) : facultyList.length === 0 ? (
            <FacultyEmptyState type="no-faculty" />
          ) : filteredFaculty.length === 0 ? (
            <FacultyEmptyState
              type="no-match"
              onClearFilters={handleClearFilters}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFaculty.map((faculty) => (
                <FacultyCard
                  key={faculty.id}
                  faculty={faculty}
                  onSelect={setSelectedFaculty}
                />
              ))}
            </div>
          )}
        </section>

        {/* Profile Card Summary Banner */}
        <section className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-900 block">
              Academic Details on File
            </span>
            <span className="text-xs text-slate-500 block">
              {studentName} • {department} • {profile?.register_number || user?.user_metadata?.register_number || 'N/A'} • {yearOfStudy}
            </span>
          </div>

          <Link
            to="/student/profile-setup?edit=true"
            className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors whitespace-nowrap"
          >
            <span>Update My Details</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </section>
      </main>

      {/* Faculty Detail Modal */}
      <FacultyDetailModal
        faculty={selectedFaculty}
        onClose={() => setSelectedFaculty(null)}
      />

      {/* Footer */}
      <footer className="w-full text-center py-6 text-xs text-slate-400 border-t border-slate-200/80 bg-white">
        CampusConnect • College Staff Availability & Discovery System • Phase 3 Student Portal
      </footer>
    </div>
  );
};

export default StudentDashboard;
