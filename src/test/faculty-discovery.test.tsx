import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/auth-context-base';
import { FacultyService, formatRelativeTime } from '../services/faculty.service';
import { FacultyStatusBadge } from '../components/dashboard/FacultyStatusBadge';
import { FacultyCard } from '../components/dashboard/FacultyCard';
import { FacultyFiltersBar } from '../components/dashboard/FacultyFiltersBar';
import { FacultyDetailModal } from '../components/dashboard/FacultyDetailModal';
import { StudentDashboard } from '../pages/dashboard/StudentDashboard';
import type { FacultyMember } from '../types/faculty.types';

describe('Phase 3 & Phase 5: Faculty Discovery, Search & Dashboard', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const sampleFaculty: FacultyMember[] = [
    {
      id: 'fac-1',
      email: 'dr.smith@college.edu',
      full_name: 'Dr. John Smith',
      role: 'staff',
      department: 'Computer Science',
      designation: 'Professor & HOD',
      employee_id: 'EMP-101',
      availability_status: 'AVAILABLE',
      location: 'Cabin 304, CS Block',
      status_message: 'Available for project discussions',
      subjects: ['Data Structures', 'Operating Systems'],
      avatar_url: null,
      availability_updated_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    },
    {
      id: 'fac-2',
      email: 'dr.davis@college.edu',
      full_name: 'Dr. Sarah Davis',
      role: 'staff',
      department: 'Mechanical Engineering',
      designation: 'Associate Professor',
      employee_id: 'EMP-102',
      availability_status: 'BUSY',
      location: 'CAD Lab 2',
      status_message: 'In research meeting',
      subjects: ['Thermodynamics', 'Fluid Mechanics'],
      avatar_url: null,
      availability_updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    },
    {
      id: 'fac-3',
      email: 'prof.kumar@college.edu',
      full_name: 'Prof. Rajesh Kumar',
      role: 'staff',
      department: 'Electrical Engineering',
      designation: 'Assistant Professor',
      employee_id: 'EMP-103',
      availability_status: 'IN CLASS',
      location: 'Lecture Hall 102',
      subjects: ['Digital Signal Processing', 'Circuit Theory'],
      avatar_url: null,
      availability_updated_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: 'fac-4',
      email: 'dr.lee@college.edu',
      full_name: 'Dr. Amy Lee',
      role: 'staff',
      department: 'Computer Science',
      designation: 'Associate Professor',
      employee_id: 'EMP-104',
      availability_status: 'UNKNOWN',
      location: null,
      subjects: ['Artificial Intelligence'],
      avatar_url: null,
      availability_updated_at: null,
    },
    {
      id: 'fac-5',
      email: 'prof.allen@college.edu',
      full_name: 'Prof. Mark Allen',
      role: 'staff',
      department: 'Civil Engineering',
      designation: 'Assistant Professor',
      employee_id: 'EMP-105',
      availability_status: 'ON LEAVE',
      location: null,
      subjects: ['Structural Analysis'],
      avatar_url: null,
      availability_updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    },
  ];

  describe('FacultyService', () => {
    it('computes overview statistics accurately from real records', () => {
      const stats = FacultyService.computeStats(sampleFaculty);
      expect(stats.total).toBe(5);
      expect(stats.available).toBe(1); // Dr. John Smith
      expect(stats.busy).toBe(2); // Dr. Sarah Davis (BUSY) + Prof. Rajesh Kumar (IN CLASS)
      expect(stats.unknown).toBe(1); // Dr. Amy Lee (UNKNOWN)
      expect(stats.recentlyUpdated).toBeGreaterThanOrEqual(1);
    });

    it('filters faculty by search query across name, department, designation, and location', () => {
      // By name
      const byName = FacultyService.filterFaculty(sampleFaculty, {
        searchQuery: 'Smith',
      });
      expect(byName).toHaveLength(1);
      expect(byName[0].full_name).toBe('Dr. John Smith');

      // By department
      const byDept = FacultyService.filterFaculty(sampleFaculty, {
        searchQuery: 'Mechanical',
      });
      expect(byDept).toHaveLength(1);
      expect(byDept[0].full_name).toBe('Dr. Sarah Davis');

      // By location
      const byLocation = FacultyService.filterFaculty(sampleFaculty, {
        searchQuery: 'Lecture Hall',
      });
      expect(byLocation).toHaveLength(1);
      expect(byLocation[0].full_name).toBe('Prof. Rajesh Kumar');
    });

    it('Phase 5 Requirement 3: searches faculty by subject and employee ID', () => {
      // Search by subject
      const bySubject = FacultyService.filterFaculty(sampleFaculty, {
        searchQuery: 'Operating Systems',
      });
      expect(bySubject).toHaveLength(1);
      expect(bySubject[0].full_name).toBe('Dr. John Smith');

      const bySubjectPartial = FacultyService.filterFaculty(sampleFaculty, {
        searchQuery: 'Thermodynamics',
      });
      expect(bySubjectPartial).toHaveLength(1);
      expect(bySubjectPartial[0].full_name).toBe('Dr. Sarah Davis');

      // Search by employee ID
      const byEmpId = FacultyService.filterFaculty(sampleFaculty, {
        searchQuery: 'EMP-103',
      });
      expect(byEmpId).toHaveLength(1);
      expect(byEmpId[0].full_name).toBe('Prof. Rajesh Kumar');
    });

    it('Phase 5 Requirement 4: filters by campus location and sorts correctly', () => {
      // Filter by campus location
      const byLoc = FacultyService.filterFaculty(sampleFaculty, {
        location: 'CAD Lab 2',
      });
      expect(byLoc).toHaveLength(1);
      expect(byLoc[0].full_name).toBe('Dr. Sarah Davis');

      // Sort: Available first
      const sortedAvailable = FacultyService.filterFaculty(sampleFaculty, {
        sortBy: 'available_first',
      });
      expect(sortedAvailable[0].availability_status).toBe('AVAILABLE');
      expect(sortedAvailable[0].full_name).toBe('Dr. John Smith');

      // Sort: Recently updated first
      const sortedRecent = FacultyService.filterFaculty(sampleFaculty, {
        sortBy: 'recently_updated',
      });
      expect(sortedRecent[0].full_name).toBe('Dr. John Smith'); // 15 mins ago
      expect(sortedRecent[1].full_name).toBe('Prof. Rajesh Kumar'); // 45 mins ago

      // Sort: Alphabetical order
      const sortedAlpha = FacultyService.filterFaculty(sampleFaculty, {
        sortBy: 'alphabetical',
      });
      expect(sortedAlpha[0].full_name).toBe('Dr. Amy Lee');
      expect(sortedAlpha[1].full_name).toBe('Dr. John Smith');
      expect(sortedAlpha[2].full_name).toBe('Dr. Sarah Davis');
    });

    it('filters faculty by department, designation, and availability filters', () => {
      // Department filter
      const csOnly = FacultyService.filterFaculty(sampleFaculty, {
        searchQuery: '',
        department: 'Computer Science',
      });
      expect(csOnly).toHaveLength(2);

      // Availability filter
      const availableOnly = FacultyService.filterFaculty(sampleFaculty, {
        searchQuery: '',
        availability: 'AVAILABLE',
      });
      expect(availableOnly).toHaveLength(1);
      expect(availableOnly[0].full_name).toBe('Dr. John Smith');

      // Designation filter
      const associateOnly = FacultyService.filterFaculty(sampleFaculty, {
        searchQuery: '',
        designation: 'Associate Professor',
      });
      expect(associateOnly).toHaveLength(2);
    });
  });

  describe('FacultyStatusBadge', () => {
    it('renders correct labels and color indicators according to status specification', () => {
      const { rerender } = render(<FacultyStatusBadge status="AVAILABLE" />);
      expect(screen.getByText('AVAILABLE')).toBeInTheDocument();

      rerender(<FacultyStatusBadge status="BUSY" />);
      expect(screen.getByText('BUSY')).toBeInTheDocument();

      rerender(<FacultyStatusBadge status="IN CLASS" />);
      expect(screen.getByText('IN CLASS')).toBeInTheDocument();

      rerender(<FacultyStatusBadge status="ON LEAVE" />);
      expect(screen.getByText('ON LEAVE')).toBeInTheDocument();

      rerender(<FacultyStatusBadge status="UNKNOWN" />);
      expect(screen.getByText('UNKNOWN')).toBeInTheDocument();
    });
  });

  describe('FacultyCard', () => {
    it('renders faculty card details, availability message, and taught subjects', () => {
      const onSelect = vi.fn();
      render(<FacultyCard faculty={sampleFaculty[0]} onSelect={onSelect} />);

      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
      expect(screen.getByText('Professor & HOD')).toBeInTheDocument();
      expect(screen.getByText('Computer Science')).toBeInTheDocument();
      expect(screen.getByText('Cabin 304, CS Block')).toBeInTheDocument();
      expect(screen.getByText('AVAILABLE')).toBeInTheDocument();
      expect(screen.getByText('15m ago')).toBeInTheDocument();

      // Availability message
      expect(screen.getByText(/"Available for project discussions"/i)).toBeInTheDocument();

      // Taught subjects
      expect(screen.getByText(/Data Structures/i)).toBeInTheDocument();

      fireEvent.click(screen.getByText('Dr. John Smith'));
      expect(onSelect).toHaveBeenCalledWith(sampleFaculty[0]);
    });

    it('formats relative timestamps correctly', () => {
      expect(formatRelativeTime(null)).toBe('No updates recorded');
      expect(formatRelativeTime(undefined)).toBe('No updates recorded');
      expect(formatRelativeTime('invalid-date')).toBe('No updates recorded');
      expect(formatRelativeTime(new Date().toISOString())).toBe('Just now');
    });
  });

  describe('FacultyFiltersBar', () => {
    it('renders search input and dropdowns and triggers onChange', () => {
      const onChange = vi.fn();
      render(
        <FacultyFiltersBar
          filters={{
            searchQuery: '',
            department: 'ALL',
            designation: 'ALL',
            availability: 'ALL',
            location: 'ALL',
            sortBy: 'available_first',
          }}
          onChange={onChange}
          departments={['Computer Science', 'Mechanical Engineering']}
          designations={['Professor', 'Associate Professor']}
          locations={['Cabin 304, CS Block', 'CAD Lab 2']}
          totalResults={5}
          totalFaculty={5}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search faculty by name/i);
      fireEvent.change(searchInput, { target: { value: 'Smith' } });

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          searchQuery: 'Smith',
        })
      );
    });

    it('shows and handles Clear Filters button when filters are active', () => {
      const onChange = vi.fn();
      render(
        <FacultyFiltersBar
          filters={{
            searchQuery: 'Smith',
            department: 'Computer Science',
            designation: 'ALL',
            availability: 'AVAILABLE',
            location: 'ALL',
            sortBy: 'available_first',
          }}
          onChange={onChange}
          departments={['Computer Science']}
          designations={['Professor']}
          totalResults={1}
          totalFaculty={5}
        />
      );

      const clearBtn = screen.getByRole('button', { name: /clear filters/i });
      expect(clearBtn).toBeInTheDocument();

      fireEvent.click(clearBtn);
      expect(onChange).toHaveBeenCalledWith({
        searchQuery: '',
        department: 'ALL',
        designation: 'ALL',
        availability: 'ALL',
        location: 'ALL',
        sortBy: 'available_first',
      });
    });
  });

  describe('FacultyDetailModal', () => {
    it('displays comprehensive faculty details, availability note, and email button', () => {
      const onClose = vi.fn();
      render(<FacultyDetailModal faculty={sampleFaculty[0]} onClose={onClose} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
      expect(screen.getByText('Professor & HOD')).toBeInTheDocument();
      expect(screen.getByText('Computer Science')).toBeInTheDocument();
      expect(screen.getByText('Cabin 304, CS Block')).toBeInTheDocument();
      expect(screen.getByText('EMP-101')).toBeInTheDocument();
      expect(screen.getByText('dr.smith@college.edu')).toBeInTheDocument();
      expect(screen.getByText(/"Available for project discussions"/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /send email/i })).toHaveAttribute(
        'href',
        'mailto:dr.smith@college.edu?subject=CampusConnect Inquiry'
      );
    });
  });

  describe('StudentDashboard Integration', () => {
    const mockStudentUser = {
      id: 'student-uuid-999',
      email: 'student@college.edu',
      user_metadata: {
        full_name: 'Jordan Lee',
        role: 'student',
        department: 'Information Technology',
        register_number: 'IT-2026-089',
        year_of_study: '3rd Year',
      },
    };

    const mockStudentProfile = {
      id: 'student-uuid-999',
      email: 'student@college.edu',
      full_name: 'Jordan Lee',
      role: 'student' as const,
      department: 'Information Technology',
      register_number: 'IT-2026-089',
      year_of_study: '3rd Year',
    };

    it('renders Top Navigation, Welcome section, Overview cards, and Faculty Directory', async () => {
      vi.spyOn(FacultyService, 'getFacultyList').mockResolvedValueOnce(sampleFaculty);

      const mockAuthValue: any = {
        user: mockStudentUser,
        profile: mockStudentProfile,
        isLoading: false,
        isConfigured: true,
        error: null,
        signOut: vi.fn(),
      };

      render(
        <AuthContext.Provider value={mockAuthValue}>
          <MemoryRouter initialEntries={['/student/dashboard']}>
            <StudentDashboard />
          </MemoryRouter>
        </AuthContext.Provider>
      );

      // Top Navbar elements
      expect(screen.getByText('CAMPUSCONNECT')).toBeInTheDocument();
      expect(screen.getByText('Student Portal')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /find faculty/i }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole('link', { name: /my profile/i }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();

      // Welcome Section
      expect(screen.getByText(/Welcome, Jordan Lee/i)).toBeInTheDocument();
      expect(screen.getByText('Information Technology')).toBeInTheDocument();
      expect(screen.getByText('IT-2026-089')).toBeInTheDocument();
      expect(screen.getByText('3rd Year')).toBeInTheDocument();

      // Real statistics cards
      await waitFor(() => {
        expect(screen.getAllByText('5').length).toBeGreaterThanOrEqual(1); // Total faculty count
        expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
        expect(screen.getByText('Dr. Sarah Davis')).toBeInTheDocument();
        expect(screen.getByText('Prof. Rajesh Kumar')).toBeInTheDocument();
      });
    });

    it('opens detailed faculty modal when faculty card is clicked', async () => {
      vi.spyOn(FacultyService, 'getFacultyList').mockResolvedValueOnce(sampleFaculty);

      const mockAuthValue: any = {
        user: mockStudentUser,
        profile: mockStudentProfile,
        isLoading: false,
        isConfigured: true,
        error: null,
        signOut: vi.fn(),
      };

      render(
        <AuthContext.Provider value={mockAuthValue}>
          <MemoryRouter initialEntries={['/student/dashboard']}>
            <StudentDashboard />
          </MemoryRouter>
        </AuthContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Dr. John Smith'));

      // Modal appears
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('dr.smith@college.edu')).toBeInTheDocument();
    });

    it('displays professional empty state when 0 faculty records exist', async () => {
      vi.spyOn(FacultyService, 'getFacultyList').mockResolvedValueOnce([]);

      const mockAuthValue: any = {
        user: mockStudentUser,
        profile: mockStudentProfile,
        isLoading: false,
        isConfigured: true,
        error: null,
        signOut: vi.fn(),
      };

      render(
        <AuthContext.Provider value={mockAuthValue}>
          <MemoryRouter initialEntries={['/student/dashboard']}>
            <StudentDashboard />
          </MemoryRouter>
        </AuthContext.Provider>
      );

      await waitFor(() => {
        expect(
          screen.getByText(/no faculty members registered yet/i)
        ).toBeInTheDocument();
      });
    });
  });
});
