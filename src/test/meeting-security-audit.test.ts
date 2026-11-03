import { describe, it, expect, beforeEach } from 'vitest';
import type { MeetingRequest } from '../types/meeting.types';

/**
 * Security Rule Simulation Engine
 *
 * This test suite models and verifies the exact RLS policies, trigger rules,
 * and database security constraints specified in the audit.
 */
interface SecurityUser {
  id: string;
  role: 'student' | 'staff';
  email: string;
}

interface SecurityDatabaseState {
  profiles: Map<string, SecurityUser>;
  meeting_requests: Map<string, MeetingRequest>;
}

class SecurityPolicySimulator {
  private state: SecurityDatabaseState = {
    profiles: new Map(),
    meeting_requests: new Map(),
  };

  registerUser(user: SecurityUser) {
    this.state.profiles.set(user.id, user);
  }

  seedMeeting(meeting: MeetingRequest) {
    this.state.meeting_requests.set(meeting.id, { ...meeting });
  }

  getMeeting(id: string): MeetingRequest | undefined {
    return this.state.meeting_requests.get(id);
  }

  /**
   * Evaluates Policy 1: SELECT
   * auth.uid() = student_id OR auth.uid() = staff_id
   */
  selectMeetings(authUser: SecurityUser): MeetingRequest[] {
    const results: MeetingRequest[] = [];
    for (const req of this.state.meeting_requests.values()) {
      if (authUser.id === req.student_id || authUser.id === req.staff_id) {
        results.push({ ...req });
      }
    }
    return results;
  }

  /**
   * Evaluates Policy 2 + Triggers: INSERT
   * - auth.uid() = student_id
   * - status = 'PENDING'
   * - student_id != staff_id
   * - authUser is verified student
   * - target staff_id is verified staff
   * - requested_date >= CURRENT_DATE
   * - length(trim(purpose)) >= 5
   * - length(trim(requested_time)) >= 3
   */
  insertMeeting(
    authUser: SecurityUser,
    payload: {
      id: string;
      student_id: string;
      staff_id: string;
      requested_date: string;
      requested_time: string;
      meeting_type: 'IN_PERSON' | 'ONLINE';
      purpose: string;
      status?: string;
    }
  ): { success: boolean; error?: string } {
    // 1. Column constraints
    if (!payload.purpose || payload.purpose.trim().length < 5) {
      return { success: false, error: 'chk_meeting_purpose_not_empty constraint violation' };
    }
    if (!payload.requested_time || payload.requested_time.trim().length < 3) {
      return { success: false, error: 'chk_meeting_time_not_empty constraint violation' };
    }

    // 2. Trigger check: date cannot be in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const parts = payload.requested_date.split('-');
    const reqDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (isNaN(reqDate.getTime()) || reqDate < today) {
      return { success: false, error: 'Meeting date cannot be in the past' };
    }

    // 3. RLS Check: auth.uid() = student_id
    if (authUser.id !== payload.student_id) {
      return { success: false, error: 'RLS violation: Cannot create request under another student ID' };
    }

    // 4. RLS Check: status must be PENDING
    if (payload.status && payload.status !== 'PENDING') {
      return { success: false, error: 'RLS violation: Initial status must be PENDING' };
    }

    // 5. RLS Check: student_id != staff_id
    if (payload.student_id === payload.staff_id) {
      return { success: false, error: 'RLS violation: Cannot request meeting with yourself' };
    }

    // 6. RLS Check: authUser must have role = 'student'
    const studentProfile = this.state.profiles.get(authUser.id);
    if (!studentProfile || studentProfile.role !== 'student') {
      return { success: false, error: 'RLS violation: Only verified students can create meeting requests' };
    }

    // 7. RLS Check: target staff_id must exist and have role = 'staff'
    const staffProfile = this.state.profiles.get(payload.staff_id);
    if (!staffProfile || staffProfile.role !== 'staff') {
      return { success: false, error: 'RLS violation: Recipient must be an actual staff account' };
    }

    // Insert into state
    this.state.meeting_requests.set(payload.id, {
      id: payload.id,
      student_id: payload.student_id,
      staff_id: payload.staff_id,
      requested_date: payload.requested_date,
      requested_time: payload.requested_time,
      meeting_type: payload.meeting_type,
      purpose: payload.purpose.trim(),
      status: 'PENDING',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return { success: true };
  }

  /**
   * Evaluates Policy 3, 4a, 4b + Immutability Triggers: UPDATE
   */
  updateMeeting(
    authUser: SecurityUser,
    meetingId: string,
    updates: Partial<MeetingRequest>
  ): { success: boolean; error?: string } {
    const existing = this.state.meeting_requests.get(meetingId);
    if (!existing) {
      return { success: false, error: 'Meeting not found' };
    }

    // Immutability Trigger Check: core fields can NEVER change
    if (updates.student_id !== undefined && updates.student_id !== existing.student_id) {
      return { success: false, error: 'Trigger violation: student_id cannot be modified after creation' };
    }
    if (updates.staff_id !== undefined && updates.staff_id !== existing.staff_id) {
      return { success: false, error: 'Trigger violation: staff_id cannot be modified after creation' };
    }
    if (updates.requested_date !== undefined && updates.requested_date !== existing.requested_date) {
      return { success: false, error: 'Trigger violation: requested_date cannot be modified after creation' };
    }
    if (updates.requested_time !== undefined && updates.requested_time !== existing.requested_time) {
      return { success: false, error: 'Trigger violation: requested_time cannot be modified after creation' };
    }
    if (updates.meeting_type !== undefined && updates.meeting_type !== existing.meeting_type) {
      return { success: false, error: 'Trigger violation: meeting_type cannot be modified after creation' };
    }
    if (updates.purpose !== undefined && updates.purpose !== existing.purpose) {
      return { success: false, error: 'Trigger violation: purpose cannot be modified after creation' };
    }

    // RLS Policy Evaluation:
    // Policy 3: Student can cancel their own PENDING requests only
    const isStudent = authUser.id === existing.student_id;
    const isStaff = authUser.id === existing.staff_id;

    if (isStudent) {
      if (existing.status !== 'PENDING') {
        return { success: false, error: 'RLS violation: Students can only cancel PENDING requests' };
      }
      if (updates.status !== 'CANCELLED') {
        return { success: false, error: 'RLS violation: Students cannot change status to anything other than CANCELLED' };
      }

      this.state.meeting_requests.set(meetingId, {
        ...existing,
        status: 'CANCELLED',
        updated_at: new Date().toISOString(),
      });
      return { success: true };
    }

    if (isStaff) {
      const staffProfile = this.state.profiles.get(authUser.id);
      if (!staffProfile || staffProfile.role !== 'staff') {
        return { success: false, error: 'RLS violation: Only verified staff can update requests' };
      }

      // Policy 4a: Staff accept or reject PENDING requests
      if (existing.status === 'PENDING') {
        if (updates.status !== 'ACCEPTED' && updates.status !== 'REJECTED') {
          return { success: false, error: 'RLS violation: Pending requests can only be updated to ACCEPTED or REJECTED' };
        }
        this.state.meeting_requests.set(meetingId, {
          ...existing,
          status: updates.status,
          staff_response: updates.staff_response !== undefined ? updates.staff_response : existing.staff_response,
          updated_at: new Date().toISOString(),
        });
        return { success: true };
      }

      // Policy 4b: Staff complete ACCEPTED requests
      if (existing.status === 'ACCEPTED') {
        if (updates.status !== 'COMPLETED') {
          return { success: false, error: 'RLS violation: Accepted requests can only be transitioned to COMPLETED' };
        }
        this.state.meeting_requests.set(meetingId, {
          ...existing,
          status: 'COMPLETED',
          updated_at: new Date().toISOString(),
        });
        return { success: true };
      }

      // Terminal statuses cannot be modified
      return { success: false, error: `RLS violation: Cannot update meeting with status ${existing.status}` };
    }

    return { success: false, error: 'RLS violation: User has no permission to update this meeting' };
  }
}

describe('CampusConnect Phase 6 — Security Audit Verification Suite', () => {
  let sim: SecurityPolicySimulator;

  const studentA: SecurityUser = {
    id: 'student-uuid-aaa',
    role: 'student',
    email: 'student.a@college.edu',
  };

  const studentB: SecurityUser = {
    id: 'student-uuid-bbb',
    role: 'student',
    email: 'student.b@college.edu',
  };

  const staffA: SecurityUser = {
    id: 'staff-uuid-111',
    role: 'staff',
    email: 'dr.smith@college.edu',
  };

  const staffB: SecurityUser = {
    id: 'staff-uuid-222',
    role: 'staff',
    email: 'prof.davis@college.edu',
  };

  const tomorrowStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();

  const yesterdayStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  })();

  beforeEach(() => {
    sim = new SecurityPolicySimulator();
    sim.registerUser(studentA);
    sim.registerUser(studentB);
    sim.registerUser(staffA);
    sim.registerUser(staffB);
  });

  describe('STUDENT SECURITY CONTROLS', () => {
    it('enforces that students can create meeting requests ONLY under their own ID', () => {
      // Valid creation
      const valid = sim.insertMeeting(studentA, {
        id: 'meet-1',
        student_id: studentA.id,
        staff_id: staffA.id,
        requested_date: tomorrowStr,
        requested_time: '10:00',
        meeting_type: 'IN_PERSON',
        purpose: 'Valid consultation purpose',
      });
      expect(valid.success).toBe(true);

      // Attempt to spoof another student ID
      const spoofed = sim.insertMeeting(studentA, {
        id: 'meet-2',
        student_id: studentB.id, // Attacker studentA attempts to act as studentB
        staff_id: staffA.id,
        requested_date: tomorrowStr,
        requested_time: '10:00',
        meeting_type: 'IN_PERSON',
        purpose: 'Impersonation attempt',
      });
      expect(spoofed.success).toBe(false);
      expect(spoofed.error).toMatch(/Cannot create request under another student ID/i);
    });

    it('enforces that students can view ONLY their own requests (no data leakage)', () => {
      sim.seedMeeting({
        id: 'meet-student-a',
        student_id: studentA.id,
        staff_id: staffA.id,
        requested_date: tomorrowStr,
        requested_time: '10:00',
        meeting_type: 'IN_PERSON',
        purpose: 'Secret student A inquiry',
        status: 'PENDING',
      });

      sim.seedMeeting({
        id: 'meet-student-b',
        student_id: studentB.id,
        staff_id: staffA.id,
        requested_date: tomorrowStr,
        requested_time: '11:00',
        meeting_type: 'ONLINE',
        purpose: 'Private student B inquiry',
        status: 'PENDING',
      });

      const studentAVisible = sim.selectMeetings(studentA);
      expect(studentAVisible.length).toBe(1);
      expect(studentAVisible[0].id).toBe('meet-student-a');
      expect(studentAVisible.some((m) => m.id === 'meet-student-b')).toBe(false);
    });

    it('allows students to cancel ONLY their own PENDING requests', () => {
      sim.seedMeeting({
        id: 'meet-pending',
        student_id: studentA.id,
        staff_id: staffA.id,
        requested_date: tomorrowStr,
        requested_time: '10:00',
        meeting_type: 'IN_PERSON',
        purpose: 'Pending discussion',
        status: 'PENDING',
      });

      sim.seedMeeting({
        id: 'meet-accepted',
        student_id: studentA.id,
        staff_id: staffA.id,
        requested_date: tomorrowStr,
        requested_time: '14:00',
        meeting_type: 'IN_PERSON',
        purpose: 'Accepted session',
        status: 'ACCEPTED',
      });

      // Cancellation of pending succeeds
      const cancelPending = sim.updateMeeting(studentA, 'meet-pending', { status: 'CANCELLED' });
      expect(cancelPending.success).toBe(true);
      expect(sim.getMeeting('meet-pending')?.status).toBe('CANCELLED');

      // Cancellation of already accepted request fails
      const cancelAccepted = sim.updateMeeting(studentA, 'meet-accepted', { status: 'CANCELLED' });
      expect(cancelAccepted.success).toBe(false);
      expect(cancelAccepted.error).toMatch(/Students can only cancel PENDING requests/i);
    });

    it('strictly PREVENTS students from accepting, rejecting, or completing requests', () => {
      sim.seedMeeting({
        id: 'meet-test',
        student_id: studentA.id,
        staff_id: staffA.id,
        requested_date: tomorrowStr,
        requested_time: '10:00',
        meeting_type: 'IN_PERSON',
        purpose: 'Attempting escalation',
        status: 'PENDING',
      });

      const acceptAttempt = sim.updateMeeting(studentA, 'meet-test', { status: 'ACCEPTED' });
      expect(acceptAttempt.success).toBe(false);

      const rejectAttempt = sim.updateMeeting(studentA, 'meet-test', { status: 'REJECTED' });
      expect(rejectAttempt.success).toBe(false);

      const completeAttempt = sim.updateMeeting(studentA, 'meet-test', { status: 'COMPLETED' });
      expect(completeAttempt.success).toBe(false);
    });

    it('strictly PREVENTS students from modifying date, time, purpose, or IDs during cancellation', () => {
      sim.seedMeeting({
        id: 'meet-immutable-check',
        student_id: studentA.id,
        staff_id: staffA.id,
        requested_date: tomorrowStr,
        requested_time: '10:00',
        meeting_type: 'IN_PERSON',
        purpose: 'Original purpose statement',
        status: 'PENDING',
      });

      // Tampering attempt during cancellation
      const tamperPurpose = sim.updateMeeting(studentA, 'meet-immutable-check', {
        status: 'CANCELLED',
        purpose: 'Tampered purpose statement',
      });
      expect(tamperPurpose.success).toBe(false);
      expect(tamperPurpose.error).toMatch(/purpose cannot be modified after creation/i);

      const tamperDate = sim.updateMeeting(studentA, 'meet-immutable-check', {
        status: 'CANCELLED',
        requested_date: '2099-12-31',
      });
      expect(tamperDate.success).toBe(false);
      expect(tamperDate.error).toMatch(/requested_date cannot be modified after creation/i);
    });
  });

  describe('STAFF SECURITY CONTROLS', () => {
    it('enforces that staff can view ONLY requests assigned to them', () => {
      sim.seedMeeting({
        id: 'meet-staff-a',
        student_id: studentA.id,
        staff_id: staffA.id,
        requested_date: tomorrowStr,
        requested_time: '10:00',
        meeting_type: 'IN_PERSON',
        purpose: 'Meeting for Dr. Smith',
        status: 'PENDING',
      });

      sim.seedMeeting({
        id: 'meet-staff-b',
        student_id: studentA.id,
        staff_id: staffB.id,
        requested_date: tomorrowStr,
        requested_time: '14:00',
        meeting_type: 'ONLINE',
        purpose: 'Meeting for Prof. Davis',
        status: 'PENDING',
      });

      const staffAVisible = sim.selectMeetings(staffA);
      expect(staffAVisible.length).toBe(1);
      expect(staffAVisible[0].id).toBe('meet-staff-a');
      expect(staffAVisible.some((m) => m.id === 'meet-staff-b')).toBe(false);
    });

    it('allows staff to accept or reject ONLY requests assigned to them (and from PENDING)', () => {
      sim.seedMeeting({
        id: 'meet-assigned',
        student_id: studentA.id,
        staff_id: staffA.id,
        requested_date: tomorrowStr,
        requested_time: '10:00',
        meeting_type: 'IN_PERSON',
        purpose: 'Pending consultation',
        status: 'PENDING',
      });

      // Staff B (unauthorized staff) tries to accept Staff A's meeting
      const unauthAccept = sim.updateMeeting(staffB, 'meet-assigned', { status: 'ACCEPTED' });
      expect(unauthAccept.success).toBe(false);
      expect(unauthAccept.error).toMatch(/User has no permission to update this meeting/i);

      // Staff A (authorized) accepts
      const authAccept = sim.updateMeeting(staffA, 'meet-assigned', {
        status: 'ACCEPTED',
        staff_response: 'See you in Room 101',
      });
      expect(authAccept.success).toBe(true);
      expect(sim.getMeeting('meet-assigned')?.status).toBe('ACCEPTED');
      expect(sim.getMeeting('meet-assigned')?.staff_response).toBe('See you in Room 101');
    });

    it('allows staff to complete ONLY accepted requests assigned to them (not PENDING, REJECTED, or CANCELLED)', () => {
      sim.seedMeeting({
        id: 'meet-pending-direct-complete',
        student_id: studentA.id,
        staff_id: staffA.id,
        requested_date: tomorrowStr,
        requested_time: '10:00',
        meeting_type: 'IN_PERSON',
        purpose: 'Pending consultation',
        status: 'PENDING',
      });

      sim.seedMeeting({
        id: 'meet-cancelled',
        student_id: studentA.id,
        staff_id: staffA.id,
        requested_date: tomorrowStr,
        requested_time: '10:00',
        meeting_type: 'IN_PERSON',
        purpose: 'Cancelled consultation',
        status: 'CANCELLED',
      });

      sim.seedMeeting({
        id: 'meet-accepted-valid',
        student_id: studentA.id,
        staff_id: staffA.id,
        requested_date: tomorrowStr,
        requested_time: '10:00',
        meeting_type: 'IN_PERSON',
        purpose: 'Accepted consultation',
        status: 'ACCEPTED',
      });

      // Staff cannot complete PENDING directly without accepting
      const completePending = sim.updateMeeting(staffA, 'meet-pending-direct-complete', {
        status: 'COMPLETED',
      });
      expect(completePending.success).toBe(false);

      // Staff cannot complete a CANCELLED meeting
      const completeCancelled = sim.updateMeeting(staffA, 'meet-cancelled', {
        status: 'COMPLETED',
      });
      expect(completeCancelled.success).toBe(false);

      // Staff can complete an ACCEPTED meeting
      const completeAccepted = sim.updateMeeting(staffA, 'meet-accepted-valid', {
        status: 'COMPLETED',
      });
      expect(completeAccepted.success).toBe(true);
      expect(sim.getMeeting('meet-accepted-valid')?.status).toBe('COMPLETED');
    });

    it('strictly PREVENTS staff from modifying student_id, staff_id, purpose, date, or time', () => {
      sim.seedMeeting({
        id: 'meet-staff-tamper-check',
        student_id: studentA.id,
        staff_id: staffA.id,
        requested_date: tomorrowStr,
        requested_time: '10:00',
        meeting_type: 'IN_PERSON',
        purpose: 'Original inquiry',
        status: 'PENDING',
      });

      // Staff tries to change date or purpose while accepting
      const tamperDate = sim.updateMeeting(staffA, 'meet-staff-tamper-check', {
        status: 'ACCEPTED',
        requested_date: '2026-12-25',
      });
      expect(tamperDate.success).toBe(false);
      expect(tamperDate.error).toMatch(/requested_date cannot be modified after creation/i);

      const tamperStudent = sim.updateMeeting(staffA, 'meet-staff-tamper-check', {
        status: 'ACCEPTED',
        student_id: studentB.id,
      });
      expect(tamperStudent.success).toBe(false);
      expect(tamperStudent.error).toMatch(/student_id cannot be modified after creation/i);
    });
  });

  describe('DATABASE LEVEL INTEGRITY & INVARIANTS', () => {
    it('enforces that ONLY actual staff accounts can receive meeting requests', () => {
      // Student tries to send a meeting request targeting another student
      const invalidRecipient = sim.insertMeeting(studentA, {
        id: 'meet-to-student',
        student_id: studentA.id,
        staff_id: studentB.id, // studentB is NOT a staff member!
        requested_date: tomorrowStr,
        requested_time: '10:00',
        meeting_type: 'IN_PERSON',
        purpose: 'Attempting to meet a peer via faculty meeting table',
      });
      expect(invalidRecipient.success).toBe(false);
      expect(invalidRecipient.error).toMatch(/Recipient must be an actual staff account/i);
    });

    it('prevents invalid meeting dates in the past at database level', () => {
      const pastDateResult = sim.insertMeeting(studentA, {
        id: 'meet-past',
        student_id: studentA.id,
        staff_id: staffA.id,
        requested_date: yesterdayStr,
        requested_time: '10:00',
        meeting_type: 'IN_PERSON',
        purpose: 'Inquiry with date in the past',
      });
      expect(pastDateResult.success).toBe(false);
      expect(pastDateResult.error).toMatch(/Meeting date cannot be in the past/i);
    });

    it('prevents empty required fields or whitespace-only inputs', () => {
      const emptyPurpose = sim.insertMeeting(studentA, {
        id: 'meet-empty-purpose',
        student_id: studentA.id,
        staff_id: staffA.id,
        requested_date: tomorrowStr,
        requested_time: '10:00',
        meeting_type: 'IN_PERSON',
        purpose: '   ',
      });
      expect(emptyPurpose.success).toBe(false);
      expect(emptyPurpose.error).toMatch(/chk_meeting_purpose_not_empty/i);

      const emptyTime = sim.insertMeeting(studentA, {
        id: 'meet-empty-time',
        student_id: studentA.id,
        staff_id: staffA.id,
        requested_date: tomorrowStr,
        requested_time: '  ',
        meeting_type: 'IN_PERSON',
        purpose: 'Valid purpose statement',
      });
      expect(emptyTime.success).toBe(false);
      expect(emptyTime.error).toMatch(/chk_meeting_time_not_empty/i);
    });
  });
});
