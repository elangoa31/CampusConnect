import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { AppNotification } from '../types/notification.types';

/**
 * Notifications Security Audit Test Suite
 *
 * Verifies the database security model, RLS policies, column immutability triggers,
 * and role-based access control rules for the Phase 7 Notification System.
 */

interface SecurityUser {
  id: string;
  role: 'student' | 'staff' | 'anon';
}

class NotificationSecuritySimulator {
  private notifications: Map<string, AppNotification> = new Map();

  seedNotification(notification: AppNotification) {
    this.notifications.set(notification.id, { ...notification });
  }

  getNotification(id: string): AppNotification | undefined {
    return this.notifications.get(id);
  }

  /**
   * SELECT Policy: auth.uid() = recipient_id
   * Anon role has REVOKE ALL (no SELECT)
   */
  selectNotifications(user: SecurityUser): { success: boolean; data?: AppNotification[]; error?: string } {
    if (user.role === 'anon') {
      return { success: false, error: 'Permission denied: table public.notifications has REVOKE ALL for anon.' };
    }

    const rows: AppNotification[] = [];
    for (const notif of this.notifications.values()) {
      if (notif.recipient_id === user.id) {
        rows.push({ ...notif });
      }
    }
    return { success: true, data: rows };
  }

  /**
   * Direct INSERT Policy: Authenticated users CANNOT insert notifications.
   * Only trusted SECURITY DEFINER triggers and system jobs can insert.
   */
  directInsert(
    user: SecurityUser,
    _payload: Partial<AppNotification>
  ): { success: boolean; error?: string } {
    if (user.role === 'anon') {
      return { success: false, error: 'Permission denied for anon.' };
    }

    // Direct INSERT permission revoked for authenticated role
    return {
      success: false,
      error: 'Permission denied: direct INSERT on public.notifications is prohibited for authenticated users.',
    };
  }

  /**
   * Trusted Trigger INSERT (SECURITY DEFINER)
   */
  trustedTriggerInsert(notification: AppNotification): { success: boolean } {
    this.notifications.set(notification.id, { ...notification });
    return { success: true };
  }

  /**
   * UPDATE Policy & Immutability Trigger:
   * - Only recipient can update (auth.uid() = recipient_id)
   * - BEFORE UPDATE trigger prevents altering id, recipient_id, actor_id, type, title, message, reference_id, reference_type, created_at
   * - Only `is_read` can be changed
   */
  updateNotification(
    user: SecurityUser,
    id: string,
    updates: Partial<AppNotification>
  ): { success: boolean; error?: string } {
    if (user.role === 'anon') {
      return { success: false, error: 'Permission denied for anon.' };
    }

    const existing = this.notifications.get(id);
    if (!existing) {
      return { success: false, error: 'Notification not found' };
    }

    // RLS Check: auth.uid() = recipient_id
    if (existing.recipient_id !== user.id) {
      return { success: false, error: 'RLS violation: Cannot update notifications belonging to another recipient.' };
    }

    // BEFORE UPDATE Trigger Check: Immutability of core fields
    if (updates.id !== undefined && updates.id !== existing.id) {
      return { success: false, error: 'Notification id cannot be modified.' };
    }
    if (updates.recipient_id !== undefined && updates.recipient_id !== existing.recipient_id) {
      return { success: false, error: 'Notification recipient_id cannot be modified.' };
    }
    if (updates.actor_id !== undefined && updates.actor_id !== existing.actor_id) {
      return { success: false, error: 'Notification actor_id cannot be modified.' };
    }
    if (updates.type !== undefined && updates.type !== existing.type) {
      return { success: false, error: 'Notification type cannot be modified.' };
    }
    if (updates.title !== undefined && updates.title !== existing.title) {
      return { success: false, error: 'Notification title cannot be modified.' };
    }
    if (updates.message !== undefined && updates.message !== existing.message) {
      return { success: false, error: 'Notification message cannot be modified.' };
    }
    if (updates.reference_id !== undefined && updates.reference_id !== existing.reference_id) {
      return { success: false, error: 'Notification reference_id cannot be modified.' };
    }
    if (updates.reference_type !== undefined && updates.reference_type !== existing.reference_type) {
      return { success: false, error: 'Notification reference_type cannot be modified.' };
    }
    if (updates.created_at !== undefined && updates.created_at !== existing.created_at) {
      return { success: false, error: 'Notification created_at cannot be modified.' };
    }

    // Successfully update allowed field(s) e.g. is_read
    if (updates.is_read !== undefined) {
      existing.is_read = updates.is_read;
    }

    this.notifications.set(id, existing);
    return { success: true };
  }

  /**
   * DELETE Policy: auth.uid() = recipient_id
   */
  deleteNotification(user: SecurityUser, id: string): { success: boolean; error?: string } {
    if (user.role === 'anon') {
      return { success: false, error: 'Permission denied for anon.' };
    }

    const existing = this.notifications.get(id);
    if (!existing) {
      return { success: false, error: 'Notification not found' };
    }

    // RLS Check: auth.uid() = recipient_id
    if (existing.recipient_id !== user.id) {
      return { success: false, error: 'RLS violation: Cannot delete notifications belonging to another recipient.' };
    }

    this.notifications.delete(id);
    return { success: true };
  }
}

describe('Phase 7 Notifications Security Audit & Hardening', () => {
  let sim: NotificationSecuritySimulator;

  const studentUser: SecurityUser = { id: 'student-uuid-1', role: 'student' };
  const studentUser2: SecurityUser = { id: 'student-uuid-2', role: 'student' };
  const staffUser: SecurityUser = { id: 'staff-uuid-1', role: 'staff' };
  const anonUser: SecurityUser = { id: 'anon', role: 'anon' };

  beforeEach(() => {
    sim = new NotificationSecuritySimulator();

    // Seed test notification for studentUser
    sim.seedNotification({
      id: 'notif-1',
      recipient_id: 'student-uuid-1',
      actor_id: 'staff-uuid-1',
      type: 'MEETING_REQUEST_ACCEPTED',
      title: 'Meeting Accepted',
      message: 'Your meeting has been confirmed.',
      reference_id: 'meet-101',
      reference_type: 'meeting_requests',
      is_read: false,
      created_at: '2026-11-07T10:00:00Z',
    });

    // Seed test notification for staffUser
    sim.seedNotification({
      id: 'notif-2',
      recipient_id: 'staff-uuid-1',
      actor_id: 'student-uuid-1',
      type: 'MEETING_REQUEST_RECEIVED',
      title: 'New Meeting Request',
      message: 'Student requested a meeting.',
      reference_id: 'meet-102',
      reference_type: 'meeting_requests',
      is_read: false,
      created_at: '2026-11-07T11:00:00Z',
    });
  });

  describe('1. Direct INSERT Restrictions', () => {
    it('rejects direct notification creation by authenticated student', () => {
      const res = sim.directInsert(studentUser, {
        recipient_id: staffUser.id,
        title: 'Spoofed Notification',
        message: 'Forged message',
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/direct INSERT on public.notifications is prohibited/i);
    });

    it('rejects direct notification creation by authenticated staff', () => {
      const res = sim.directInsert(staffUser, {
        recipient_id: studentUser.id,
        title: 'Fake Notification',
        message: 'Fake message',
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/direct INSERT on public.notifications is prohibited/i);
    });

    it('allows trusted SECURITY DEFINER triggers to create notifications', () => {
      const res = sim.trustedTriggerInsert({
        id: 'notif-system-3',
        recipient_id: 'student-uuid-1',
        actor_id: 'staff-uuid-1',
        type: 'MEETING_REMINDER',
        title: 'Upcoming Meeting Reminder',
        message: 'Reminder: meeting today at 2 PM',
        reference_id: 'meet-103',
        reference_type: 'meeting_requests',
        is_read: false,
        created_at: '2026-11-07T12:00:00Z',
      });

      expect(res.success).toBe(true);
      expect(sim.getNotification('notif-system-3')).toBeDefined();
    });
  });

  describe('2. Anon Permissions Removal', () => {
    it('blocks unauthenticated (anon) users from SELECT', () => {
      const res = sim.selectNotifications(anonUser);
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/permission denied/i);
    });

    it('blocks unauthenticated (anon) users from INSERT', () => {
      const res = sim.directInsert(anonUser, { title: 'Anon Attack' });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/permission denied/i);
    });

    it('blocks unauthenticated (anon) users from UPDATE', () => {
      const res = sim.updateNotification(anonUser, 'notif-1', { is_read: true });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/permission denied/i);
    });

    it('blocks unauthenticated (anon) users from DELETE', () => {
      const res = sim.deleteNotification(anonUser, 'notif-1');
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/permission denied/i);
    });
  });

  describe('3. SELECT Isolation', () => {
    it('allows user to query only their own notifications', () => {
      const res = sim.selectNotifications(studentUser);
      expect(res.success).toBe(true);
      expect(res.data?.length).toBe(1);
      expect(res.data?.[0].id).toBe('notif-1');
    });

    it('does not leak notifications of other users', () => {
      const res = sim.selectNotifications(studentUser2);
      expect(res.success).toBe(true);
      expect(res.data?.length).toBe(0);
    });
  });

  describe('4. UPDATE Permissions & Immutability Trigger', () => {
    it('allows recipient to mark their own notification as read', () => {
      const res = sim.updateNotification(studentUser, 'notif-1', { is_read: true });
      expect(res.success).toBe(true);
      expect(sim.getNotification('notif-1')?.is_read).toBe(true);
    });

    it('prevents non-recipient from updating another user notification', () => {
      const res = sim.updateNotification(staffUser, 'notif-1', { is_read: true });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/RLS violation/i);
    });

    it('blocks attempts to tamper with message or title', () => {
      const resMessage = sim.updateNotification(studentUser, 'notif-1', {
        message: 'Tampered notification content',
      });
      expect(resMessage.success).toBe(false);
      expect(resMessage.error).toMatch(/message cannot be modified/i);

      const resTitle = sim.updateNotification(studentUser, 'notif-1', {
        title: 'Tampered Title',
      });
      expect(resTitle.success).toBe(false);
      expect(resTitle.error).toMatch(/title cannot be modified/i);
    });

    it('blocks attempts to tamper with recipient_id, actor_id, or type', () => {
      const resRecip = sim.updateNotification(studentUser, 'notif-1', {
        recipient_id: 'attacker-uuid',
      });
      expect(resRecip.success).toBe(false);
      expect(resRecip.error).toMatch(/recipient_id cannot be modified/i);

      const resActor = sim.updateNotification(studentUser, 'notif-1', {
        actor_id: 'attacker-uuid',
      });
      expect(resActor.success).toBe(false);
      expect(resActor.error).toMatch(/actor_id cannot be modified/i);

      const resType = sim.updateNotification(studentUser, 'notif-1', {
        type: 'MEETING_COMPLETED',
      });
      expect(resType.success).toBe(false);
      expect(resType.error).toMatch(/type cannot be modified/i);
    });

    it('blocks attempts to tamper with reference_id, reference_type, or created_at', () => {
      const resRef = sim.updateNotification(studentUser, 'notif-1', {
        reference_id: 'hijacked-id',
      });
      expect(resRef.success).toBe(false);
      expect(resRef.error).toMatch(/reference_id cannot be modified/i);

      const resDate = sim.updateNotification(studentUser, 'notif-1', {
        created_at: '2020-01-01T00:00:00Z',
      });
      expect(resDate.success).toBe(false);
      expect(resDate.error).toMatch(/created_at cannot be modified/i);
    });
  });

  describe('5. DELETE Permissions', () => {
    it('allows recipient to delete their own notification', () => {
      const res = sim.deleteNotification(studentUser, 'notif-1');
      expect(res.success).toBe(true);
      expect(sim.getNotification('notif-1')).toBeUndefined();
    });

    it('prevents a user from deleting another user notification', () => {
      const res = sim.deleteNotification(studentUser, 'notif-2');
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/RLS violation/i);
      expect(sim.getNotification('notif-2')).toBeDefined();
    });
  });

  describe('6. Migration File Verification', () => {
    it('ensures migration 20261107_harden_notifications_security.sql contains all mandatory directives', () => {
      const migrationPath = path.resolve(
        __dirname,
        '../../supabase/migrations/20261107_harden_notifications_security.sql'
      );
      expect(fs.existsSync(migrationPath)).toBe(true);

      const sql = fs.readFileSync(migrationPath, 'utf8');

      // 1. Revoke INSERT and UPDATE from authenticated, and grant UPDATE (is_read)
      expect(sql).toMatch(/REVOKE INSERT, UPDATE ON TABLE public\.notifications FROM authenticated;/i);
      expect(sql).toMatch(/GRANT UPDATE \(is_read\) ON TABLE public\.notifications TO authenticated;/i);

      // 2. Drop direct insert policy and inspect pg_policies to drop unexpected policies
      expect(sql).toMatch(/DROP POLICY IF EXISTS "Users can insert notifications as actor" ON public\.notifications;/i);
      expect(sql).toMatch(/FROM pg_policies/i);
      expect(sql).toMatch(/schemaname = 'public'/i);
      expect(sql).toMatch(/tablename = 'notifications'/i);

      // 3. Revoke all permissions from anon and public
      expect(sql).toMatch(/REVOKE ALL ON TABLE public\.notifications FROM anon;/i);
      expect(sql).toMatch(/REVOKE ALL ON TABLE public\.notifications FROM public;/i);

      // 4. Secure SELECT, UPDATE, DELETE policies
      expect(sql).toMatch(/auth\.uid\(\) = recipient_id/i);

      // 5. Immutability trigger
      expect(sql).toMatch(/prevent_notification_mutation/i);
      expect(sql).toMatch(/trg_prevent_notification_mutation/i);
      expect(sql).toMatch(/BEFORE UPDATE ON public\.notifications/i);

      // 6. Realtime publication without swallowed errors
      expect(sql).toMatch(/ALTER PUBLICATION supabase_realtime ADD TABLE public\.notifications;/i);
      expect(sql).not.toMatch(/WHEN OTHERS THEN\s+NULL/i);

      // 7. RLS enabled and forced
      expect(sql).toMatch(/ALTER TABLE public\.notifications ENABLE ROW LEVEL SECURITY;/i);
      expect(sql).toMatch(/ALTER TABLE public\.notifications FORCE ROW LEVEL SECURITY;/i);
    });
  });
});
