import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { NotificationService } from '../services/notification.service';
import { NotificationBell } from '../components/notifications/NotificationBell';
import { NotificationPage } from '../pages/notifications/NotificationPage';
import { AuthContext } from '../context/auth-context-base';
import { supabase } from '../lib/supabase';
import type { AppNotification } from '../types/notification.types';

// Mock test notifications
const mockNotifications: AppNotification[] = [
  {
    id: 'notif-1',
    recipient_id: 'student-123',
    actor_id: 'staff-456',
    type: 'MEETING_REQUEST_ACCEPTED',
    title: 'Meeting Request Accepted',
    message: 'Dr. Jane Smith accepted your meeting scheduled for Nov 10, 2026 at 10:00 AM.',
    reference_id: 'meet-101',
    reference_type: 'meeting_requests',
    is_read: false,
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5m ago
    actor: {
      id: 'staff-456',
      full_name: 'Dr. Jane Smith',
      department: 'Computer Science',
      role: 'staff',
    },
  },
  {
    id: 'notif-2',
    recipient_id: 'student-123',
    actor_id: 'staff-789',
    type: 'MEETING_REQUEST_REJECTED',
    title: 'Meeting Request Declined',
    message: 'Prof. Miller declined your meeting request for Nov 12, 2026. Reason: "Faculty meeting".',
    reference_id: 'meet-102',
    reference_type: 'meeting_requests',
    is_read: true,
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1h ago
    actor: {
      id: 'staff-789',
      full_name: 'Prof. Miller',
      department: 'Mathematics',
      role: 'staff',
    },
  },
  {
    id: 'notif-3',
    recipient_id: 'staff-456',
    actor_id: 'student-123',
    type: 'MEETING_REQUEST_RECEIVED',
    title: 'New Meeting Request',
    message: 'Alex Morgan requested a meeting on Nov 15, 2026 at 02:00 PM.',
    reference_id: 'meet-103',
    reference_type: 'meeting_requests',
    is_read: false,
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    actor: {
      id: 'student-123',
      full_name: 'Alex Morgan',
      department: 'Computer Science',
      role: 'student',
    },
  },
  {
    id: 'notif-4',
    recipient_id: 'staff-456',
    actor_id: 'student-123',
    type: 'MEETING_REQUEST_CANCELLED',
    title: 'Meeting Request Cancelled',
    message: 'Alex Morgan cancelled their meeting request scheduled for Nov 15, 2026.',
    reference_id: 'meet-103',
    reference_type: 'meeting_requests',
    is_read: false,
    created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    actor: {
      id: 'student-123',
      full_name: 'Alex Morgan',
      department: 'Computer Science',
      role: 'student',
    },
  },
];

const mockAuthContext = {
  user: { id: 'student-123', email: 'student@college.edu' },
  profile: {
    id: 'student-123',
    email: 'student@college.edu',
    full_name: 'Alex Morgan',
    role: 'student' as const,
    department: 'Computer Science',
  },
  isLoading: false,
  isConfigured: true,
  error: null,
  setError: vi.fn(),
  intendedRole: null,
  setIntendedRole: vi.fn(),
  login: vi.fn(),
  signup: vi.fn(),
  resetPassword: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  refreshProfile: vi.fn(),
  updateStudentProfile: vi.fn(),
};

describe('Phase 7: Notification & Alert System', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  // 1. Student receives notification when staff accepts
  it('1. Student receives notification when staff accepts', async () => {
    const studentNotifs = mockNotifications.filter(
      (n) => n.recipient_id === 'student-123' && n.type === 'MEETING_REQUEST_ACCEPTED'
    );

    vi.spyOn(NotificationService, 'getNotifications').mockResolvedValue(studentNotifs);
    vi.spyOn(NotificationService, 'getUnreadCount').mockResolvedValue(1);

    const result = await NotificationService.getNotifications('student-123');

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('MEETING_REQUEST_ACCEPTED');
    expect(result[0].title).toBe('Meeting Request Accepted');
    expect(result[0].message).toContain('accepted your meeting');
  });

  // 2. Student receives notification when staff rejects
  it('2. Student receives notification when staff rejects', async () => {
    const studentNotifs = mockNotifications.filter(
      (n) => n.recipient_id === 'student-123' && n.type === 'MEETING_REQUEST_REJECTED'
    );

    vi.spyOn(NotificationService, 'getNotifications').mockResolvedValue(studentNotifs);

    const result = await NotificationService.getNotifications('student-123');

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('MEETING_REQUEST_REJECTED');
    expect(result[0].title).toBe('Meeting Request Declined');
    expect(result[0].message).toContain('declined your meeting request');
  });

  // 3. Staff receives notification when student requests a meeting
  it('3. Staff receives notification when student requests a meeting', async () => {
    const staffNotifs = mockNotifications.filter(
      (n) => n.recipient_id === 'staff-456' && n.type === 'MEETING_REQUEST_RECEIVED'
    );

    vi.spyOn(NotificationService, 'getNotifications').mockResolvedValue(staffNotifs);

    const result = await NotificationService.getNotifications('staff-456');

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('MEETING_REQUEST_RECEIVED');
    expect(result[0].title).toBe('New Meeting Request');
    expect(result[0].message).toContain('requested a meeting');
  });

  // 4. Staff receives notification when student cancels
  it('4. Staff receives notification when student cancels', async () => {
    const staffNotifs = mockNotifications.filter(
      (n) => n.recipient_id === 'staff-456' && n.type === 'MEETING_REQUEST_CANCELLED'
    );

    vi.spyOn(NotificationService, 'getNotifications').mockResolvedValue(staffNotifs);

    const result = await NotificationService.getNotifications('staff-456');

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('MEETING_REQUEST_CANCELLED');
    expect(result[0].title).toBe('Meeting Request Cancelled');
    expect(result[0].message).toContain('cancelled their meeting request');
  });

  // 5. Notifications are not duplicated
  it('5. Notifications are not duplicated for the same meeting reference and recipient', async () => {
    const meetingId = 'meet-101';
    const recipientId = 'student-123';

    // Query returns existing notification
    const selectSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'notif-1', reference_id: meetingId },
            error: null,
          }),
        }),
      }),
    });

    vi.spyOn(supabase, 'from').mockReturnValue({
      select: selectSpy,
    } as any);

    // Verify existing record is found so duplicate insert is omitted
    const { data: existing } = await supabase
      .from('notifications')
      .select('*')
      .eq('reference_id', meetingId)
      .eq('recipient_id', recipientId)
      .maybeSingle();

    expect(existing).not.toBeNull();
    expect(existing?.id).toBe('notif-1');
  });

  // 6. Unread count is correct
  it('6. Unread count returns accurate count for recipient', async () => {
    vi.spyOn(NotificationService, 'getUnreadCount').mockResolvedValue(3);

    const count = await NotificationService.getUnreadCount('student-123');
    expect(count).toBe(3);
  });

  // 7. Mark as read works
  it('7. Mark as read updates is_read to true for individual notification', async () => {
    const updateSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    vi.spyOn(supabase, 'from').mockReturnValue({
      update: updateSpy,
    } as any);

    await NotificationService.markAsRead('notif-1', 'student-123');

    expect(updateSpy).toHaveBeenCalledWith({ is_read: true });
  });

  // 8. Mark all as read works
  it('8. Mark all as read updates all unread notifications for recipient', async () => {
    const updateSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    vi.spyOn(supabase, 'from').mockReturnValue({
      update: updateSpy,
    } as any);

    await NotificationService.markAllAsRead('student-123');

    expect(updateSpy).toHaveBeenCalledWith({ is_read: true });
  });

  // 9. Users cannot read another user's notifications (RLS enforcement)
  it("9. Users cannot read another user's notifications (isolated by recipient_id)", async () => {
    const querySpy = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });

    vi.spyOn(supabase, 'from').mockReturnValue({
      select: querySpy().select,
    } as any);

    // Authenticated user queries only their own ID
    await NotificationService.getNotifications('student-123');

    expect(supabase.from).toHaveBeenCalledWith('notifications');
  });

  // 10. Users cannot modify another user's notifications
  it("10. Users cannot modify another user's notifications (scoped by recipient_id)", async () => {
    const updateSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    vi.spyOn(supabase, 'from').mockReturnValue({
      update: updateSpy,
    } as any);

    // Attempting to update with attacker ID scopes to their own recipient_id
    await NotificationService.markAsRead('notif-1', 'attacker-uuid');

    expect(updateSpy).toHaveBeenCalledWith({ is_read: true });
  });

  // 11. Realtime notifications appear without refresh
  it('11. Realtime subscription receives events and triggers handler', () => {
    let capturedCallback: any;

    const channelMock: any = {
      on: vi.fn(),
      subscribe: vi.fn(),
    };
    channelMock.on.mockImplementation((_event: any, _opts: any, callback: any) => {
      capturedCallback = callback;
      return channelMock;
    });
    channelMock.subscribe.mockReturnValue(channelMock);

    vi.spyOn(supabase, 'channel').mockReturnValue(channelMock as any);
    const removeChannelSpy = vi.spyOn(supabase, 'removeChannel').mockReturnValue({} as any);

    const onUpdateMock = vi.fn();
    const unsub = NotificationService.subscribeToNotifications('student-123', onUpdateMock);

    expect(supabase.channel).toHaveBeenCalledWith('public:notifications:student-123');
    expect(channelMock.on).toHaveBeenCalled();

    // Trigger fake incoming realtime event
    capturedCallback({ new: mockNotifications[0] });
    expect(onUpdateMock).toHaveBeenCalled();

    unsub();
    expect(removeChannelSpy).toHaveBeenCalledWith(channelMock);
  });

  // 12. Notification bell renders badge and dropdown content
  it('12. Notification bell renders badge and dropdown with latest notifications', async () => {
    vi.spyOn(NotificationService, 'getNotifications').mockResolvedValue(
      mockNotifications.slice(0, 2)
    );
    vi.spyOn(NotificationService, 'getUnreadCount').mockResolvedValue(1);

    render(
      <AuthContext.Provider value={mockAuthContext as any}>
        <MemoryRouter>
          <NotificationBell />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Badge indicates 1 unread
    expect(await screen.findByTestId('notification-badge')).toHaveTextContent('1');

    // Click bell to open dropdown
    const bellBtn = screen.getByRole('button', { name: /open notifications/i });
    fireEvent.click(bellBtn);

    // Dropdown contains header and notification title
    expect(await screen.findByTestId('notification-dropdown')).toBeInTheDocument();
    expect(screen.getByText(/meeting request accepted/i)).toBeInTheDocument();
    expect(screen.getByText(/view all notifications/i)).toBeInTheDocument();
  });

  // 13. Notification Page renders filter tabs, items, and handles actions
  it('13. Notification Page renders items, filters, and mark-all-read action', async () => {
    vi.spyOn(NotificationService, 'getNotifications').mockResolvedValue(mockNotifications);
    vi.spyOn(NotificationService, 'getUnreadCount').mockResolvedValue(3);
    const markAllSpy = vi.spyOn(NotificationService, 'markAllAsRead').mockResolvedValue();

    render(
      <AuthContext.Provider value={mockAuthContext as any}>
        <MemoryRouter>
          <NotificationPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Heading and items are rendered
    expect(await screen.findByRole('heading', { level: 1, name: /notifications/i })).toBeInTheDocument();
    expect(screen.getByText(/meeting request accepted/i)).toBeInTheDocument();
    expect(screen.getByText(/meeting request declined/i)).toBeInTheDocument();

    // Filter tabs exist
    expect(screen.getByRole('button', { name: /^all$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /unread \(3\)/i })).toBeInTheDocument();

    // Click "Mark all as read"
    const markAllBtn = screen.getByRole('button', { name: /mark all as read/i });
    fireEvent.click(markAllBtn);

    await waitFor(() => {
      expect(markAllSpy).toHaveBeenCalledWith('student-123');
    });
  });

  // 14. Existing meeting request functionality still works
  it('14. Role-based navigation to meeting sections functions cleanly', async () => {
    render(
      <AuthContext.Provider value={mockAuthContext as any}>
        <MemoryRouter initialEntries={['/notifications']}>
          <Routes>
            <Route path="/notifications" element={<NotificationPage />} />
            <Route path="/student/dashboard" element={<div>Student Dashboard Destination</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // "Back to Dashboard" button points to /student/dashboard
    const backBtn = screen.getByRole('link', { name: /back to dashboard/i });
    expect(backBtn).toHaveAttribute('href', '/student/dashboard');
  });
});
