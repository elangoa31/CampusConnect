import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../context/auth-context-base';
import { StudentProfileSetupForm } from '../components/profile/StudentProfileSetupForm';
import { StudentDashboardPlaceholder } from '../pages/dashboard/StudentDashboardPlaceholder';
import type { UserProfile } from '../types/auth.types';

describe('Student Profile Completion & Management', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockIncompleteGoogleUser = {
    id: 'google-user-uuid-123',
    email: 'alex.google@college.edu',
    user_metadata: {
      name: 'Alex Google User',
      full_name: 'Alex Google User',
      role: 'student',
      // Incomplete fields after Google login:
      department: 'General',
      register_number: null,
      year_of_study: null,
    },
  };

  const mockCompleteStudentProfile: UserProfile = {
    id: 'google-user-uuid-123',
    email: 'alex.google@college.edu',
    full_name: 'Alex Google User',
    role: 'student',
    department: 'Computer Science & Engineering',
    register_number: '717821F101',
    year_of_study: '3rd Year',
  };

  describe('StudentDashboardPlaceholder redirection on incomplete profile', () => {
    it('redirects to /student/profile-setup when student profile is incomplete after Google login', () => {
      const mockAuthValue: any = {
        user: mockIncompleteGoogleUser,
        profile: null,
        isLoading: false,
        isConfigured: true,
        error: null,
        signOut: vi.fn(),
      };

      render(
        <AuthContext.Provider value={mockAuthValue}>
          <MemoryRouter initialEntries={['/student/dashboard']}>
            <Routes>
              <Route path="/student/dashboard" element={<StudentDashboardPlaceholder />} />
              <Route path="/student/profile-setup" element={<div>Profile Setup Screen</div>} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      );

      expect(screen.getByText('Profile Setup Screen')).toBeInTheDocument();
    });

    it('loads student dashboard directly on subsequent login when profile is complete', () => {
      const mockAuthValue: any = {
        user: mockIncompleteGoogleUser,
        profile: mockCompleteStudentProfile,
        isLoading: false,
        isConfigured: true,
        error: null,
        signOut: vi.fn(),
      };

      render(
        <AuthContext.Provider value={mockAuthValue}>
          <MemoryRouter initialEntries={['/student/dashboard']}>
            <Routes>
              <Route path="/student/dashboard" element={<StudentDashboardPlaceholder />} />
              <Route path="/student/profile-setup" element={<div>Profile Setup Screen</div>} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      );

      expect(screen.getByText(/Welcome, Alex Google User/i)).toBeInTheDocument();
      expect(screen.getByText('Computer Science & Engineering')).toBeInTheDocument();
      expect(screen.getByText('717821F101')).toBeInTheDocument();
      expect(screen.getByText('3rd Year')).toBeInTheDocument();
      expect(screen.queryByText('Profile Setup Screen')).not.toBeInTheDocument();
    });

    it('renders Edit Profile button on dashboard', () => {
      const mockAuthValue: any = {
        user: mockIncompleteGoogleUser,
        profile: mockCompleteStudentProfile,
        isLoading: false,
        isConfigured: true,
        error: null,
        signOut: vi.fn(),
      };

      render(
        <AuthContext.Provider value={mockAuthValue}>
          <MemoryRouter initialEntries={['/student/dashboard']}>
            <Routes>
              <Route path="/student/dashboard" element={<StudentDashboardPlaceholder />} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      );

      const editButtons = screen.getAllByRole('link', { name: /edit profile/i });
      expect(editButtons.length).toBeGreaterThanOrEqual(1);
      expect(editButtons[0]).toHaveAttribute('href', '/student/profile-setup?edit=true');
    });
  });

  describe('StudentProfileSetupForm', () => {
    it('pre-fills Google credentials (name and email) and displays verified identity badge', () => {
      const mockAuthValue: any = {
        user: mockIncompleteGoogleUser,
        profile: null,
        updateStudentProfile: vi.fn(),
        signOut: vi.fn(),
      };

      render(
        <AuthContext.Provider value={mockAuthValue}>
          <MemoryRouter initialEntries={['/student/profile-setup']}>
            <StudentProfileSetupForm />
          </MemoryRouter>
        </AuthContext.Provider>
      );

      expect(screen.getByPlaceholderText(/e\.g\. Alex Johnson/i)).toHaveValue('Alex Google User');
      expect(screen.getByDisplayValue('alex.google@college.edu')).toBeInTheDocument();
      expect(screen.getByDisplayValue('alex.google@college.edu')).toBeDisabled();
      expect(screen.getByText(/verified identity/i)).toBeInTheDocument();
    });

    it('validates all required fields and shows error alert when submitting empty required fields', async () => {
      const mockAuthValue: any = {
        user: { ...mockIncompleteGoogleUser, email: '', user_metadata: {} },
        profile: null,
        updateStudentProfile: vi.fn(),
        signOut: vi.fn(),
      };

      render(
        <AuthContext.Provider value={mockAuthValue}>
          <MemoryRouter initialEntries={['/student/profile-setup']}>
            <StudentProfileSetupForm />
          </MemoryRouter>
        </AuthContext.Provider>
      );

      const submitBtn = screen.getByRole('button', { name: /complete setup & continue/i });
      fireEvent.click(submitBtn);

      expect(await screen.findByText(/full name is required/i)).toBeInTheDocument();
      expect(await screen.findByText(/department is required/i)).toBeInTheDocument();
      expect(await screen.findByText(/register number is required/i)).toBeInTheDocument();
      expect(await screen.findByText(/please select a valid year of study/i)).toBeInTheDocument();
      expect(await screen.findByText(/please complete all required fields correctly before submitting/i)).toBeInTheDocument();
    });

    it('submits valid student profile, calls updateStudentProfile, and shows success message', async () => {
      const updateStudentProfileMock = vi.fn().mockResolvedValueOnce(mockCompleteStudentProfile);

      const mockAuthValue: any = {
        user: mockIncompleteGoogleUser,
        profile: null,
        updateStudentProfile: updateStudentProfileMock,
        signOut: vi.fn(),
      };

      render(
        <AuthContext.Provider value={mockAuthValue}>
          <MemoryRouter initialEntries={['/student/profile-setup']}>
            <StudentProfileSetupForm />
          </MemoryRouter>
        </AuthContext.Provider>
      );

      // Fill in department, register number, and year of study
      fireEvent.change(screen.getByPlaceholderText(/e\.g\. Computer Science & Engineering/i), {
        target: { value: 'Mechanical Engineering' },
      });
      fireEvent.change(screen.getByPlaceholderText(/e\.g\. 717821F101/i), {
        target: { value: '717821ME045' },
      });
      fireEvent.change(screen.getByRole('combobox'), {
        target: { value: '4th Year' },
      });

      const submitBtn = screen.getByRole('button', { name: /complete setup & continue/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(updateStudentProfileMock).toHaveBeenCalledWith({
          fullName: 'Alex Google User',
          department: 'Mechanical Engineering',
          registerNumber: '717821ME045',
          yearOfStudy: '4th Year',
        });
      });

      expect(await screen.findByText(/profile saved successfully!/i)).toBeInTheDocument();
    });

    it('renders in edit mode with pre-filled profile details and Save Changes button', () => {
      const mockAuthValue: any = {
        user: mockIncompleteGoogleUser,
        profile: mockCompleteStudentProfile,
        updateStudentProfile: vi.fn(),
        signOut: vi.fn(),
      };

      render(
        <AuthContext.Provider value={mockAuthValue}>
          <MemoryRouter initialEntries={['/student/profile-setup?edit=true']}>
            <StudentProfileSetupForm />
          </MemoryRouter>
        </AuthContext.Provider>
      );

      expect(screen.getByRole('heading', { name: /edit profile/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e\.g\. Computer Science & Engineering/i)).toHaveValue(
        'Computer Science & Engineering'
      );
      expect(screen.getByPlaceholderText(/e\.g\. 717821F101/i)).toHaveValue('717821F101');
      expect(screen.getByRole('combobox')).toHaveValue('3rd Year');
      expect(screen.getByRole('link', { name: /back to dashboard/i })).toBeInTheDocument();
    });
  });
});
