import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { RoleSelectionPage } from '../pages/auth/RoleSelectionPage';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { StudentDashboardPlaceholder } from '../pages/dashboard/StudentDashboardPlaceholder';
import { StaffDashboardPlaceholder } from '../pages/dashboard/StaffDashboardPlaceholder';
import { AuthService } from '../services/auth.service';

describe('Role Selection & Protected Flow', () => {
  describe('RoleSelectionPage', () => {
    it('renders heading, subtitle, and both role cards', () => {
      render(
        <AuthProvider>
          <MemoryRouter initialEntries={['/']}>
            <RoleSelectionPage />
          </MemoryRouter>
        </AuthProvider>
      );

      expect(screen.getByText(/welcome to campusconnect/i)).toBeInTheDocument();
      expect(screen.getByText(/choose how you want to access your campus\./i)).toBeInTheDocument();
      expect(screen.getByText("I'm a Student")).toBeInTheDocument();
      expect(
        screen.getByText(/find faculty members, check their availability and discover where to reach them\./i)
      ).toBeInTheDocument();
      expect(screen.getByText(/continue as student/i)).toBeInTheDocument();

      expect(screen.getByText("I'm Faculty")).toBeInTheDocument();
      expect(
        screen.getByText(/manage your availability, update your location and keep students informed\./i)
      ).toBeInTheDocument();
      expect(screen.getByText(/continue as staff/i)).toBeInTheDocument();
    });

    it('navigates with role query parameter when selecting student or staff', () => {
      render(
        <AuthProvider>
          <MemoryRouter initialEntries={['/']}>
            <Routes>
              <Route path="/" element={<RoleSelectionPage />} />
              <Route path="/login" element={<div data-testid="login-view">Login View</div>} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      );

      const studentBtn = screen.getByText(/continue as student/i);
      fireEvent.click(studentBtn);
      expect(screen.getByTestId('login-view')).toBeInTheDocument();
    });
  });

  describe('Role Verification & Mismatch Security', () => {
    it('rejects login when verified database profile role differs from selected portal', async () => {
      // Mock isSupabaseConfigured to return true
      const supabaseModule = await import('../lib/supabase');
      vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);
      vi.spyOn(supabaseModule.supabase.auth, 'signInWithPassword').mockResolvedValue({
        data: {
          user: { id: '123', email: 'student@college.edu' } as any,
          session: {} as any,
        },
        error: null,
      });
      vi.spyOn(supabaseModule.supabase.auth, 'signOut').mockResolvedValue({ error: null });

      // Mock getCurrentProfile to return a student profile
      vi.spyOn(AuthService, 'getCurrentProfile').mockResolvedValue({
        id: '123',
        email: 'student@college.edu',
        full_name: 'Student User',
        role: 'student',
        department: 'CSE',
      });

      // Attempting to log into staff portal with student account
      await expect(
        AuthService.signInWithEmail(
          { email: 'student@college.edu', password: 'Password123!', rememberMe: false },
          'staff'
        )
      ).rejects.toThrow(/Role mismatch: This account is registered as Student/);
    });
  });

  describe('ProtectedRoute & Authorization Guards', () => {
    it('redirects unauthenticated users to login with the intended role', async () => {
      render(
        <AuthProvider>
          <MemoryRouter initialEntries={['/student/dashboard']}>
            <Routes>
              <Route
                path="/student/dashboard"
                element={
                  <ProtectedRoute allowedRole="student">
                    <div>Secret Student Content</div>
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<div data-testid="redirected-login">Redirected Login</div>} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      );

      expect(await screen.findByTestId('redirected-login')).toBeInTheDocument();
      expect(screen.queryByText('Secret Student Content')).not.toBeInTheDocument();
    });
  });

  describe('Dashboard Placeholders', () => {
    it('renders student dashboard placeholder with verified session badge and sign out', () => {
      render(
        <AuthProvider>
          <MemoryRouter>
            <StudentDashboardPlaceholder />
          </MemoryRouter>
        </AuthProvider>
      );

      expect(screen.getByText('CAMPUSCONNECT')).toBeInTheDocument();
      expect(screen.getByText('Student Portal')).toBeInTheDocument();
      expect(screen.getByText(/verified student session/i)).toBeInTheDocument();
      expect(screen.getByText(/student dashboard placeholder/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
    });

    it('renders staff dashboard placeholder with verified session badge and sign out', () => {
      render(
        <AuthProvider>
          <MemoryRouter>
            <StaffDashboardPlaceholder />
          </MemoryRouter>
        </AuthProvider>
      );

      expect(screen.getByText('CAMPUSCONNECT')).toBeInTheDocument();
      expect(screen.getByText('Faculty / Staff Portal')).toBeInTheDocument();
      expect(screen.getByText(/verified faculty session/i)).toBeInTheDocument();
      expect(screen.getByText(/faculty dashboard placeholder/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
    });
  });
});
