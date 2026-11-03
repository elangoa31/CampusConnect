import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MeetingService } from '../services/meeting.service';
import { validateMeetingRequestForm } from '../utils/validation';
import { MeetingStatusBadge } from '../components/meetings/MeetingStatusBadge';
import { RequestMeetingModal } from '../components/meetings/RequestMeetingModal';
import { StudentMeetingList } from '../components/meetings/StudentMeetingList';
import { StaffMeetingRequestsManager } from '../components/meetings/StaffMeetingRequestsManager';
import type { FacultyMember } from '../types/faculty.types';
import type { MeetingRequest } from '../types/meeting.types';

describe('Phase 6: Student-to-Faculty Meeting Request System', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockFaculty: FacultyMember = {
    id: 'faculty-uuid-1',
    email: 'dr.smith@college.edu',
    full_name: 'Dr. John Smith',
    role: 'staff',
    department: 'Computer Science',
    designation: 'Professor & HOD',
    employee_id: 'EMP-101',
    availability_status: 'AVAILABLE',
    location: 'Cabin 304, CS Block',
    availability_updated_at: new Date().toISOString(),
  };

  const tomorrowDateStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();

  const yesterdayDateStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  })();

  const sampleStudentMeetings: MeetingRequest[] = [
    {
      id: 'meeting-1',
      student_id: 'student-uuid-1',
      staff_id: 'faculty-uuid-1',
      requested_date: tomorrowDateStr,
      requested_time: '11:00',
      meeting_type: 'IN_PERSON',
      purpose: 'Doubt clearing on Data Structures and Trees',
      status: 'PENDING',
      created_at: new Date().toISOString(),
      staff: {
        full_name: 'Dr. John Smith',
        email: 'dr.smith@college.edu',
        department: 'Computer Science',
        designation: 'Professor & HOD',
        location: 'Cabin 304',
      },
    },
    {
      id: 'meeting-2',
      student_id: 'student-uuid-1',
      staff_id: 'faculty-uuid-2',
      requested_date: tomorrowDateStr,
      requested_time: '14:30',
      meeting_type: 'ONLINE',
      purpose: 'Discussion regarding Final Year Project proposal',
      status: 'ACCEPTED',
      staff_response: 'Accepted. Please join the Google Meet link 5 mins prior.',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      staff: {
        full_name: 'Dr. Sarah Davis',
        email: 'dr.davis@college.edu',
        department: 'Mechanical Engineering',
        designation: 'Associate Professor',
      },
    },
  ];

  const sampleStaffMeetings: MeetingRequest[] = [
    {
      id: 'meeting-staff-1',
      student_id: 'student-uuid-1',
      staff_id: 'faculty-uuid-1',
      requested_date: tomorrowDateStr,
      requested_time: '10:00',
      meeting_type: 'IN_PERSON',
      purpose: 'Guidance on machine learning paper submission',
      status: 'PENDING',
      created_at: new Date().toISOString(),
      student: {
        full_name: 'Alex Johnson',
        email: 'alex@college.edu',
        department: 'Computer Science',
        register_number: 'CS2026-042',
        year_of_study: '3rd Year',
      },
    },
    {
      id: 'meeting-staff-2',
      student_id: 'student-uuid-2',
      staff_id: 'faculty-uuid-1',
      requested_date: tomorrowDateStr,
      requested_time: '15:00',
      meeting_type: 'ONLINE',
      purpose: 'Internship evaluation sign-off',
      status: 'ACCEPTED',
      created_at: new Date().toISOString(),
      student: {
        full_name: 'Emily Watson',
        email: 'emily@college.edu',
        department: 'Computer Science',
        register_number: 'CS2026-088',
        year_of_study: '4th Year',
      },
    },
  ];

  describe('1. Form Validation (validateMeetingRequestForm)', () => {
    it('catches missing required fields', () => {
      const errors = validateMeetingRequestForm({});
      expect(errors.requested_date).toBe('Preferred date is required');
      expect(errors.requested_time).toBe('Preferred time is required');
      expect(errors.meeting_type).toBe('Please select a meeting type (In Person or Online)');
      expect(errors.purpose).toBe('Please describe the meeting purpose (at least 5 characters)');
    });

    it('rejects dates in the past', () => {
      const errors = validateMeetingRequestForm({
        requested_date: yesterdayDateStr,
        requested_time: '10:00',
        meeting_type: 'IN_PERSON',
        purpose: 'Valid purpose statement',
      });
      expect(errors.requested_date).toBe('Meeting date cannot be in the past');
    });

    it('rejects purpose that is too short or too long', () => {
      const shortErr = validateMeetingRequestForm({
        requested_date: tomorrowDateStr,
        requested_time: '10:00',
        meeting_type: 'IN_PERSON',
        purpose: 'Hi',
      });
      expect(shortErr.purpose).toBe('Please describe the meeting purpose (at least 5 characters)');

      const longErr = validateMeetingRequestForm({
        requested_date: tomorrowDateStr,
        requested_time: '10:00',
        meeting_type: 'ONLINE',
        purpose: 'a'.repeat(501),
      });
      expect(longErr.purpose).toBe('Purpose must not exceed 500 characters');
    });

    it('passes for a valid meeting request payload', () => {
      const errors = validateMeetingRequestForm({
        requested_date: tomorrowDateStr,
        requested_time: '14:00',
        meeting_type: 'IN_PERSON',
        purpose: 'Clarification regarding algorithm design project',
      });
      expect(Object.keys(errors).length).toBe(0);
    });
  });

  describe('2. MeetingStatusBadge Component', () => {
    it('renders all statuses with distinct visual styles', () => {
      const { rerender } = render(<MeetingStatusBadge status="PENDING" />);
      expect(screen.getByText('Pending')).toBeInTheDocument();

      rerender(<MeetingStatusBadge status="ACCEPTED" />);
      expect(screen.getByText('Accepted')).toBeInTheDocument();

      rerender(<MeetingStatusBadge status="REJECTED" />);
      expect(screen.getByText('Declined')).toBeInTheDocument();

      rerender(<MeetingStatusBadge status="CANCELLED" />);
      expect(screen.getByText('Cancelled')).toBeInTheDocument();

      rerender(<MeetingStatusBadge status="COMPLETED" />);
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

  describe('3. Student Request Creation (RequestMeetingModal)', () => {
    it('renders faculty summary, date, time, format buttons, and purpose fields', () => {
      render(
        <RequestMeetingModal
          faculty={mockFaculty}
          studentId="student-uuid-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByRole('heading', { name: /Request a Faculty Meeting/i })).toBeInTheDocument();
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
      expect(screen.getByText(/Professor & HOD • Computer Science/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Preferred Date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Preferred Time/i)).toBeInTheDocument();
      expect(screen.getByText('In Person')).toBeInTheDocument();
      expect(screen.getByText('Online')).toBeInTheDocument();
      expect(screen.getByLabelText(/Purpose of Meeting/i)).toBeInTheDocument();
    });

    it('submits valid request and displays success screen', async () => {
      const createSpy = vi.spyOn(MeetingService, 'createMeetingRequest').mockResolvedValue({
        id: 'new-req-123',
        student_id: 'student-uuid-1',
        staff_id: mockFaculty.id,
        requested_date: tomorrowDateStr,
        requested_time: '11:00',
        meeting_type: 'IN_PERSON',
        purpose: 'Discuss dissertation chapter 2',
        status: 'PENDING',
      });

      render(
        <RequestMeetingModal
          faculty={mockFaculty}
          studentId="student-uuid-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const purposeInput = screen.getByLabelText(/Purpose of Meeting/i);
      fireEvent.change(purposeInput, { target: { value: 'Discuss dissertation chapter 2' } });

      const submitButton = screen.getByRole('button', { name: /Submit Request/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(createSpy).toHaveBeenCalledWith(
          'student-uuid-1',
          expect.objectContaining({
            staff_id: mockFaculty.id,
            purpose: 'Discuss dissertation chapter 2',
            meeting_type: 'IN_PERSON',
          })
        );
      });

      expect(await screen.findByText(/Meeting Request Submitted!/i)).toBeInTheDocument();
    });
  });

  describe('4. Student Meeting List & Cancellation (StudentMeetingList)', () => {
    it('displays student meetings with status badges and details', async () => {
      vi.spyOn(MeetingService, 'getStudentMeetings').mockResolvedValue(sampleStudentMeetings);
      vi.spyOn(MeetingService, 'subscribeToStudentMeetings').mockReturnValue(() => {});

      render(<StudentMeetingList studentId="student-uuid-1" />);

      expect(await screen.findByText('Dr. John Smith')).toBeInTheDocument();
      expect(screen.getByText('Dr. Sarah Davis')).toBeInTheDocument();
      expect(screen.getByText('Doubt clearing on Data Structures and Trees')).toBeInTheDocument();
      expect(screen.getByText(/Accepted. Please join the Google Meet link 5 mins prior./i)).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Accepted')).toBeInTheDocument();
    });

    it('allows student to cancel a pending request with confirmation', async () => {
      vi.spyOn(MeetingService, 'getStudentMeetings').mockResolvedValue(sampleStudentMeetings);
      vi.spyOn(MeetingService, 'subscribeToStudentMeetings').mockReturnValue(() => {});
      const cancelSpy = vi.spyOn(MeetingService, 'cancelMeetingRequest').mockResolvedValue();

      render(<StudentMeetingList studentId="student-uuid-1" />);

      // Find Cancel Request button for pending request
      const cancelBtn = await screen.findByRole('button', { name: /Cancel Request/i });
      fireEvent.click(cancelBtn);

      // Confirmation modal should appear
      expect(screen.getByRole('heading', { name: /Cancel Meeting Request\?/i })).toBeInTheDocument();

      // Click confirmation button
      const confirmBtn = screen.getByRole('button', { name: /Yes, Cancel Request/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(cancelSpy).toHaveBeenCalledWith('student-uuid-1', 'meeting-1');
      });
    });
  });

  describe('5. Staff Meeting Requests Manager (StaffMeetingRequestsManager)', () => {
    it('displays incoming student requests with academic info', async () => {
      vi.spyOn(MeetingService, 'getStaffMeetings').mockResolvedValue(sampleStaffMeetings);
      vi.spyOn(MeetingService, 'subscribeToStaffMeetings').mockReturnValue(() => {});

      render(<StaffMeetingRequestsManager staffId="faculty-uuid-1" />);

      expect(await screen.findByText('Alex Johnson')).toBeInTheDocument();
      expect(screen.getByText(/Reg:/i)).toBeInTheDocument();
      expect(screen.getByText('CS2026-042')).toBeInTheDocument();
      expect(screen.getByText('Guidance on machine learning paper submission')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Accept Request/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Decline/i })).toBeInTheDocument();
    });

    it('allows staff to accept request with optional note', async () => {
      vi.spyOn(MeetingService, 'getStaffMeetings').mockResolvedValue(sampleStaffMeetings);
      vi.spyOn(MeetingService, 'subscribeToStaffMeetings').mockReturnValue(() => {});
      const respondSpy = vi.spyOn(MeetingService, 'respondToMeetingRequest').mockResolvedValue();

      render(<StaffMeetingRequestsManager staffId="faculty-uuid-1" />);

      const acceptBtn = await screen.findByRole('button', { name: /Accept Request/i });
      fireEvent.click(acceptBtn);

      // Modal appears
      expect(screen.getByRole('heading', { name: /Accept Meeting Request/i })).toBeInTheDocument();

      const noteInput = screen.getByPlaceholderText(/Please bring your lab report/i);
      fireEvent.change(noteInput, { target: { value: 'Approved, see you in Cabin 304.' } });

      const confirmBtn = screen.getByRole('button', { name: /Confirm Acceptance/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(respondSpy).toHaveBeenCalledWith(
          'faculty-uuid-1',
          'meeting-staff-1',
          'ACCEPTED',
          'Approved, see you in Cabin 304.'
        );
      });
    });

    it('allows staff to mark accepted meetings as completed', async () => {
      vi.spyOn(MeetingService, 'getStaffMeetings').mockResolvedValue(sampleStaffMeetings);
      vi.spyOn(MeetingService, 'subscribeToStaffMeetings').mockReturnValue(() => {});
      const completeSpy = vi.spyOn(MeetingService, 'completeMeetingRequest').mockResolvedValue();

      render(<StaffMeetingRequestsManager staffId="faculty-uuid-1" />);

      // Switch to Upcoming Accepted tab
      const acceptedTab = await screen.findByRole('button', { name: /Upcoming Accepted/i });
      fireEvent.click(acceptedTab);

      const completeBtn = await screen.findByRole('button', { name: /Mark as Completed/i });
      fireEvent.click(completeBtn);

      await waitFor(() => {
        expect(completeSpy).toHaveBeenCalledWith('faculty-uuid-1', 'meeting-staff-2');
      });
    });
  });

  describe('6. Realtime Subscriptions & Edge Cases', () => {
    it('sets up and tears down student meeting realtime subscription', () => {
      const unsubSpy = vi.fn();
      const subSpy = vi.spyOn(MeetingService, 'subscribeToStudentMeetings').mockReturnValue(unsubSpy);
      vi.spyOn(MeetingService, 'getStudentMeetings').mockResolvedValue([]);

      const { unmount } = render(<StudentMeetingList studentId="student-uuid-1" />);

      expect(subSpy).toHaveBeenCalledWith('student-uuid-1', expect.any(Function));
      unmount();
      expect(unsubSpy).toHaveBeenCalled();
    });

    it('sets up and tears down staff meeting realtime subscription', () => {
      const unsubSpy = vi.fn();
      const subSpy = vi.spyOn(MeetingService, 'subscribeToStaffMeetings').mockReturnValue(unsubSpy);
      vi.spyOn(MeetingService, 'getStaffMeetings').mockResolvedValue([]);

      const { unmount } = render(<StaffMeetingRequestsManager staffId="faculty-uuid-1" />);

      expect(subSpy).toHaveBeenCalledWith('faculty-uuid-1', expect.any(Function));
      unmount();
      expect(unsubSpy).toHaveBeenCalled();
    });
  });
});
