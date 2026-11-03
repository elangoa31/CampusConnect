import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/auth-context-base';
import { StaffService } from '../services/staff.service';
import { StaffProfileCard } from '../components/staff/StaffProfileCard';
import { StaffAvailabilityManager } from '../components/staff/StaffAvailabilityManager';
import { StaffTimetableManager } from '../components/staff/StaffTimetableManager';
import { StaffEditProfileModal } from '../components/staff/StaffEditProfileModal';
import { StaffDashboard } from '../pages/dashboard/StaffDashboard';
import { validateStaffProfileForm, validateTimetableEntryForm } from '../utils/validation';
import type { StaffProfile, TimetableEntry } from '../types/staff.types';

describe('Phase 4: Staff Dashboard & Availability Management', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const sampleStaffProfile: StaffProfile = {
    id: 'staff-uuid-101',
    email: 'dr.smith@college.edu',
    full_name: 'Dr. John Smith',
    role: 'staff',
    department: 'Computer Science & Engineering',
    employee_id: 'EMP-9021',
    designation: 'Professor & HOD',
    availability_status: 'AVAILABLE',
    location: 'Department Office - Cabin 304',
    status_message: 'Available for consultations until 4 PM',
    status_start_time: '10:00',
    status_end_time: '16:00',
    avatar_url: null,
    availability_updated_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const sampleTimetable: TimetableEntry[] = [
    {
      id: 'tt-1',
      user_id: 'staff-uuid-101',
      day_of_week: 'Monday',
      start_time: '09:00',
      end_time: '10:30',
      subject: 'Data Structures & Algorithms',
      classroom: 'Hall 301, CS Block',
      department: 'Computer Science & Engineering',
    },
    {
      id: 'tt-2',
      user_id: 'staff-uuid-101',
      day_of_week: 'Monday',
      start_time: '11:00',
      end_time: '12:30',
      subject: 'Advanced Database Systems',
      classroom: 'Hall 205',
      department: 'Computer Science & Engineering',
    },
    {
      id: 'tt-3',
      user_id: 'staff-uuid-101',
      day_of_week: 'Wednesday',
      start_time: '14:00',
      end_time: '16:00',
      subject: 'Algorithms Lab Session',
      classroom: 'Systems Lab 2',
      department: 'Computer Science & Engineering',
    },
  ];

  describe('1. StaffService & Data Sanitization', () => {
    it('sanitizes employee ID and prevents emails or placeholder values from displaying', () => {
      // Email as employee ID
      expect(StaffService.sanitizeEmployeeId('dr.smith@college.edu', 'dr.smith@college.edu')).toBe('Not provided');
      expect(StaffService.sanitizeEmployeeId('other@college.edu', 'dr.smith@college.edu')).toBe('Not provided');
      // Jane fallback
      expect(StaffService.sanitizeEmployeeId('jane', 'test@college.edu')).toBe('Not provided');
      expect(StaffService.sanitizeEmployeeId('Jane', 'test@college.edu')).toBe('Not provided');
      // Empty, null, N/A
      expect(StaffService.sanitizeEmployeeId('', 'test@college.edu')).toBe('Not provided');
      expect(StaffService.sanitizeEmployeeId(null, 'test@college.edu')).toBe('Not provided');
      expect(StaffService.sanitizeEmployeeId('N/A', 'test@college.edu')).toBe('Not provided');
      // Valid employee ID
      expect(StaffService.sanitizeEmployeeId('EMP-1042', 'test@college.edu')).toBe('EMP-1042');
    });

    it('getTodaySchedule returns correctly filtered and sorted classes for the given day', () => {
      // Reference Monday: Nov 2, 2026 is Monday
      const mondayDate = new Date('2026-11-02T10:00:00Z');
      const { dayName, todayClasses } = StaffService.getTodaySchedule(sampleTimetable, mondayDate);

      expect(dayName).toBe('Monday');
      expect(todayClasses.length).toBe(2);
      expect(todayClasses[0].subject).toBe('Data Structures & Algorithms');
      expect(todayClasses[1].subject).toBe('Advanced Database Systems');

      // Reference Tuesday: Nov 3, 2026 is Tuesday (0 classes in sample)
      const tuesdayDate = new Date('2026-11-03T10:00:00Z');
      const tuesdayResult = StaffService.getTodaySchedule(sampleTimetable, tuesdayDate);
      expect(tuesdayResult.dayName).toBe('Tuesday');
      expect(tuesdayResult.todayClasses.length).toBe(0);
    });
  });

  describe('2. Validation Rules', () => {
    it('validates staff profile update form', () => {
      // Missing / short name
      const err1 = validateStaffProfileForm({
        fullName: 'J',
        department: 'CS',
        employeeId: 'EMP-1',
        designation: 'Professor',
      });
      expect(err1.fullName).toBeDefined();

      // Email as employee ID
      const err2 = validateStaffProfileForm({
        fullName: 'Dr. John',
        department: 'CS',
        employeeId: 'john@college.edu',
        designation: 'Professor',
        email: 'john@college.edu',
      });
      expect(err2.employeeId).toBe('Employee ID cannot be an email address');

      // 'jane' as employee ID
      const err3 = validateStaffProfileForm({
        fullName: 'Dr. John',
        department: 'CS',
        employeeId: 'jane',
        designation: 'Professor',
      });
      expect(err3.employeeId).toBe('Please enter your real college employee ID');

      // Valid form
      const errValid = validateStaffProfileForm({
        fullName: 'Dr. John Smith',
        department: 'Computer Science',
        employeeId: 'EMP-2041',
        designation: 'Professor & HOD',
      });
      expect(Object.keys(errValid).length).toBe(0);
    });

    it('validates timetable entry form', () => {
      // End time before start time
      const err1 = validateTimetableEntryForm({
        subject: 'Algorithms',
        classroom: 'Room 101',
        department: 'CS',
        start_time: '11:00',
        end_time: '10:00',
      });
      expect(err1.end_time).toBe('End time must be after start time');

      // Missing subject & classroom
      const err2 = validateTimetableEntryForm({
        subject: '',
        classroom: '',
        department: '',
        start_time: '09:00',
        end_time: '10:00',
      });
      expect(err2.subject).toBeDefined();
      expect(err2.classroom).toBeDefined();
      expect(err2.department).toBeDefined();
    });
  });

  describe('3. StaffProfileCard Component', () => {
    it('renders real staff profile details and handles edit click', () => {
      const onEditMock = vi.fn();
      render(
        <StaffProfileCard
          profile={sampleStaffProfile}
          onEditProfile={onEditMock}
        />
      );

      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
      expect(screen.getByText('dr.smith@college.edu')).toBeInTheDocument();
      expect(screen.getByText('Computer Science & Engineering')).toBeInTheDocument();
      expect(screen.getByText('EMP-9021')).toBeInTheDocument();
      expect(screen.getByText('Professor & HOD')).toBeInTheDocument();
      expect(screen.getByText(/verified faculty session/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));
      expect(onEditMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('4. StaffAvailabilityManager Component', () => {
    it('renders availability status options, presets, and allows updating status', async () => {
      const onUpdatedMock = vi.fn();
      vi.spyOn(StaffService, 'updateAvailability').mockResolvedValueOnce({
        ...sampleStaffProfile,
        availability_status: 'BUSY',
        location: 'Laboratory - Lab 3',
        status_message: 'In meeting with researchers',
      });

      render(
        <StaffAvailabilityManager
          profile={sampleStaffProfile}
          onAvailabilityUpdated={onUpdatedMock}
        />
      );

      // Verify all status cards render
      expect(screen.getAllByText('AVAILABLE').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('BUSY')).toBeInTheDocument();
      expect(screen.getByText('IN CLASS')).toBeInTheDocument();
      expect(screen.getByText('ON LEAVE')).toBeInTheDocument();

      // Click 'BUSY'
      fireEvent.click(screen.getByText('BUSY'));

      // Click location preset 'Laboratory'
      fireEvent.click(screen.getByRole('button', { name: 'Laboratory' }));

      // Type details in room input
      const roomInput = screen.getByPlaceholderText(/specify room \/ cabin details/i);
      fireEvent.change(roomInput, { target: { value: 'Lab 3' } });

      // Click Save & Broadcast Status
      const saveBtn = screen.getByRole('button', { name: /save & broadcast status/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(onUpdatedMock).toHaveBeenCalledWith(
          expect.objectContaining({
            availability_status: 'BUSY',
            location: 'Laboratory - Lab 3',
          })
        );
      });
    });
  });

  describe('5. StaffTimetableManager Component', () => {
    it('renders timetable entries with disclaimer and opens add session modal', async () => {
      const onTimetableUpdatedMock = vi.fn();
      vi.spyOn(StaffService, 'createTimetableEntry').mockResolvedValueOnce({
        id: 'tt-new',
        user_id: 'staff-uuid-101',
        day_of_week: 'Tuesday',
        start_time: '14:00',
        end_time: '15:30',
        subject: 'Machine Learning',
        classroom: 'Room 402',
        department: 'Computer Science & Engineering',
      });

      render(
        <StaffTimetableManager
          userId="staff-uuid-101"
          defaultDepartment="Computer Science & Engineering"
          timetable={sampleTimetable}
          onTimetableUpdated={onTimetableUpdatedMock}
        />
      );

      // Estimated schedule disclaimer
      expect(screen.getByText(/estimated schedule notice/i)).toBeInTheDocument();

      // Displays timetable cards
      expect(screen.getByText('Data Structures & Algorithms')).toBeInTheDocument();
      expect(screen.getByText('Advanced Database Systems')).toBeInTheDocument();

      // Open Add Modal
      fireEvent.click(screen.getByRole('button', { name: /add class session/i }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Fill in modal
      fireEvent.change(screen.getByPlaceholderText(/e\.g\. Data Structures/i), {
        target: { value: 'Machine Learning' },
      });
      fireEvent.change(screen.getByPlaceholderText(/e\.g\. Hall 302/i), {
        target: { value: 'Room 402' },
      });

      // Submit modal
      fireEvent.click(screen.getByRole('button', { name: 'Add Session' }));

      await waitFor(() => {
        expect(onTimetableUpdatedMock).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('6. StaffEditProfileModal Component', () => {
    it('validates and updates staff profile', async () => {
      const onCloseMock = vi.fn();
      const onUpdatedMock = vi.fn();

      vi.spyOn(StaffService, 'updateStaffProfile').mockResolvedValueOnce({
        ...sampleStaffProfile,
        full_name: 'Dr. Arthur Pendelton',
        employee_id: 'EMP-7788',
      });

      render(
        <StaffEditProfileModal
          profile={sampleStaffProfile}
          onClose={onCloseMock}
          onProfileUpdated={onUpdatedMock}
        />
      );

      const nameInput = screen.getByPlaceholderText(/e\.g\. Dr\. Arthur Pendelton/i);
      fireEvent.change(nameInput, { target: { value: 'Dr. Arthur Pendelton' } });

      const empInput = screen.getByPlaceholderText(/e\.g\. EMP-2024-041/i);
      fireEvent.change(empInput, { target: { value: 'EMP-7788' } });

      fireEvent.click(screen.getByRole('button', { name: /save profile/i }));

      await waitFor(() => {
        expect(onUpdatedMock).toHaveBeenCalledWith(
          expect.objectContaining({
            full_name: 'Dr. Arthur Pendelton',
            employee_id: 'EMP-7788',
          })
        );
      });
    });
  });

  describe('7. StaffDashboard Full Integration', () => {
    it('renders Welcome section, Profile overview, Today Schedule, and Availability controls', async () => {
      vi.spyOn(StaffService, 'getStaffProfile').mockResolvedValueOnce(sampleStaffProfile);
      vi.spyOn(StaffService, 'getStaffTimetable').mockResolvedValueOnce(sampleTimetable);

      const mockAuthValue: any = {
        user: { id: 'staff-uuid-101', email: 'dr.smith@college.edu' },
        profile: sampleStaffProfile,
        isLoading: false,
        isConfigured: true,
        error: null,
        signOut: vi.fn(),
      };

      render(
        <AuthContext.Provider value={mockAuthValue}>
          <MemoryRouter initialEntries={['/staff/dashboard']}>
            <StaffDashboard />
          </MemoryRouter>
        </AuthContext.Provider>
      );

      // Verify Welcome Header
      expect(screen.getByText(/Welcome, Dr. John Smith/i)).toBeInTheDocument();
      expect(screen.getAllByText('CAMPUSCONNECT').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Faculty / Staff Portal').length).toBeGreaterThanOrEqual(1);

      // Verify Real Profile details
      await waitFor(() => {
        expect(screen.getAllByText('EMP-9021').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Professor & HOD').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Today\'s Schedule')).toBeInTheDocument();
      });

      // Verify Availability Controls
      expect(screen.getByText(/Availability & Location Broadcasting/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save & broadcast status/i })).toBeInTheDocument();

      // Verify Weekly Timetable
      expect(screen.getByText(/Weekly Timetable Schedule/i)).toBeInTheDocument();
      expect(screen.getByText(/estimated schedule notice/i)).toBeInTheDocument();
    });
  });
});
