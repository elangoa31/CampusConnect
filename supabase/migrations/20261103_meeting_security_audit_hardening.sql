-- ==============================================================================
-- CampusConnect - Phase 6 Meeting Request Security Audit Hardening Migration
-- Date: 2026-11-03
-- Objective: Fix confirmed RLS policy vulnerabilities and enforce database-level immutability
-- ==============================================================================

-- 1. Enforce Column Level Constraints (Prevent empty strings and invalid formats)
ALTER TABLE public.meeting_requests
  DROP CONSTRAINT IF EXISTS chk_meeting_purpose_not_empty;
ALTER TABLE public.meeting_requests
  ADD CONSTRAINT chk_meeting_purpose_not_empty CHECK (length(trim(purpose)) >= 5);

ALTER TABLE public.meeting_requests
  DROP CONSTRAINT IF EXISTS chk_meeting_time_not_empty;
ALTER TABLE public.meeting_requests
  ADD CONSTRAINT chk_meeting_time_not_empty CHECK (length(trim(requested_time)) >= 3);

-- 2. Trigger to Prevent Past Dates and Ensure Immutability of Core Fields
CREATE OR REPLACE FUNCTION public.check_meeting_security_constraints()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- On INSERT: prevent past dates (must be >= CURRENT_DATE)
  IF TG_OP = 'INSERT' THEN
    IF NEW.requested_date < CURRENT_DATE THEN
      RAISE EXCEPTION 'Meeting date cannot be in the past (requested: %, current: %)', NEW.requested_date, CURRENT_DATE;
    END IF;
  END IF;

  -- On UPDATE: core fields must remain strictly immutable
  IF TG_OP = 'UPDATE' THEN
    IF NEW.student_id <> OLD.student_id THEN
      RAISE EXCEPTION 'student_id cannot be modified after creation';
    END IF;

    IF NEW.staff_id <> OLD.staff_id THEN
      RAISE EXCEPTION 'staff_id cannot be modified after creation';
    END IF;

    IF NEW.requested_date <> OLD.requested_date THEN
      RAISE EXCEPTION 'requested_date cannot be modified after creation';
    END IF;

    IF NEW.requested_time <> OLD.requested_time THEN
      RAISE EXCEPTION 'requested_time cannot be modified after creation';
    END IF;

    IF NEW.meeting_type <> OLD.meeting_type THEN
      RAISE EXCEPTION 'meeting_type cannot be modified after creation';
    END IF;

    IF NEW.purpose <> OLD.purpose THEN
      RAISE EXCEPTION 'purpose cannot be modified after creation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_meeting_security_constraints ON public.meeting_requests;
CREATE TRIGGER trg_meeting_security_constraints
  BEFORE INSERT OR UPDATE ON public.meeting_requests
  FOR EACH ROW EXECUTE FUNCTION public.check_meeting_security_constraints();

-- 3. Hardened RLS Policies

-- Policy 1: SELECT (Students can only view their authored requests, Staff only their assigned requests)
DROP POLICY IF EXISTS "Users can view their own or addressed meeting requests" ON public.meeting_requests;
CREATE POLICY "Users can view their own or addressed meeting requests"
ON public.meeting_requests
FOR SELECT
TO authenticated
USING (auth.uid() = student_id OR auth.uid() = staff_id);

-- Policy 2: INSERT (Hardened - Only verified students can create, and recipient must be a verified staff member)
DROP POLICY IF EXISTS "Students can create meeting requests" ON public.meeting_requests;
CREATE POLICY "Students can create meeting requests"
ON public.meeting_requests
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = student_id
  AND status = 'PENDING'
  AND student_id != staff_id
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'student'
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = staff_id AND role = 'staff'
  )
);

-- Policy 3: UPDATE by Student (Students can only cancel their own PENDING requests)
DROP POLICY IF EXISTS "Students can cancel their own pending requests" ON public.meeting_requests;
CREATE POLICY "Students can cancel their own pending requests"
ON public.meeting_requests
FOR UPDATE
TO authenticated
USING (
  auth.uid() = student_id 
  AND status = 'PENDING'
)
WITH CHECK (
  auth.uid() = student_id 
  AND status = 'CANCELLED'
);

-- Policy 4a: UPDATE by Staff (Staff can accept or reject only PENDING requests assigned to them)
DROP POLICY IF EXISTS "Staff can respond to and complete their incoming requests" ON public.meeting_requests;
DROP POLICY IF EXISTS "Staff can respond to pending requests" ON public.meeting_requests;
CREATE POLICY "Staff can respond to pending requests"
ON public.meeting_requests
FOR UPDATE
TO authenticated
USING (
  auth.uid() = staff_id
  AND status = 'PENDING'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'staff'
  )
)
WITH CHECK (
  auth.uid() = staff_id
  AND status IN ('ACCEPTED', 'REJECTED')
);

-- Policy 4b: UPDATE by Staff (Staff can complete ONLY ACCEPTED requests assigned to them)
DROP POLICY IF EXISTS "Staff can complete accepted requests" ON public.meeting_requests;
CREATE POLICY "Staff can complete accepted requests"
ON public.meeting_requests
FOR UPDATE
TO authenticated
USING (
  auth.uid() = staff_id
  AND status = 'ACCEPTED'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'staff'
  )
)
WITH CHECK (
  auth.uid() = staff_id
  AND status = 'COMPLETED'
);

-- Ensure RLS is active and enforced
ALTER TABLE public.meeting_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_requests FORCE ROW LEVEL SECURITY;
