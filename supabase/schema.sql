-- ==============================================================================
-- CampusConnect - Database Schema for Authentication & Profiles
-- Role Constraints: ONLY 'student' AND 'staff' (NO admin role allowed)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'staff')),
  department TEXT NOT NULL,
  
  -- Student-specific fields
  register_number TEXT,
  year_of_study TEXT,
  
  -- Staff-specific fields
  employee_id TEXT,
  designation TEXT,
  
  -- Availability & Location Tracking (Phase 3)
  availability_status TEXT DEFAULT 'UNKNOWN' CHECK (availability_status IN ('AVAILABLE', 'BUSY', 'IN CLASS', 'ON LEAVE', 'UNKNOWN')),
  location TEXT,
  avatar_url TEXT,
  availability_updated_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Extensions for existing databases
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'UNKNOWN';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS availability_updated_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status_message TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status_start_time TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status_end_time TEXT;

-- Index for fast lookup by role, department, email, or availability
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON public.profiles(department);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_availability ON public.profiles(availability_status);
CREATE INDEX IF NOT EXISTS idx_profiles_staff_lookup ON public.profiles(role, availability_status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Public profiles are viewable by authenticated users"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
DROP POLICY IF EXISTS "Users can update their own profile without escalating role" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Table Permissions
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;
GRANT SELECT ON TABLE public.profiles TO anon;

-- Automatic Profile Creation Trigger via auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Validate role is either 'student' or 'staff'
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  IF v_role NOT IN ('student', 'staff') THEN
    v_role := 'student';
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    department,
    register_number,
    year_of_study,
    employee_id,
    designation
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    v_role,
    COALESCE(NEW.raw_user_meta_data->>'department', 'General'),
    NEW.raw_user_meta_data->>'register_number',
    NEW.raw_user_meta_data->>'year_of_study',
    NEW.raw_user_meta_data->>'employee_id',
    NEW.raw_user_meta_data->>'designation'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    register_number = COALESCE(EXCLUDED.register_number, profiles.register_number),
    year_of_study = COALESCE(EXCLUDED.year_of_study, profiles.year_of_study),
    employee_id = COALESCE(EXCLUDED.employee_id, profiles.employee_id),
    designation = COALESCE(EXCLUDED.designation, profiles.designation),
    updated_at = timezone('utc'::text, now());

  RETURN NEW;
END;
$$;

-- Trigger to call the function on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- CampusConnect - Staff Weekly Timetables (Phase 4)
-- Note: Timetable information represents an estimated schedule, not confirmed physical availability.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.staff_timetables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  subject TEXT NOT NULL,
  classroom TEXT NOT NULL,
  department TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_timetables_user ON public.staff_timetables(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_timetables_day ON public.staff_timetables(day_of_week);
CREATE INDEX IF NOT EXISTS idx_staff_timetables_lookup ON public.staff_timetables(user_id, day_of_week);

-- Enable RLS for timetables
ALTER TABLE public.staff_timetables ENABLE ROW LEVEL SECURITY;

-- 1. All authenticated users (including students in faculty discovery) can read timetables
DROP POLICY IF EXISTS "Timetables are viewable by authenticated users" ON public.staff_timetables;
CREATE POLICY "Timetables are viewable by authenticated users"
ON public.staff_timetables
FOR SELECT
TO authenticated
USING (true);

-- 2. Staff can insert their own timetable entries
DROP POLICY IF EXISTS "Staff can insert their own timetable entries" ON public.staff_timetables;
CREATE POLICY "Staff can insert their own timetable entries"
ON public.staff_timetables
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Staff can update their own timetable entries
DROP POLICY IF EXISTS "Staff can update their own timetable entries" ON public.staff_timetables;
CREATE POLICY "Staff can update their own timetable entries"
ON public.staff_timetables
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Staff can delete their own timetable entries
DROP POLICY IF EXISTS "Staff can delete their own timetable entries" ON public.staff_timetables;
CREATE POLICY "Staff can delete their own timetable entries"
ON public.staff_timetables
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Grants
GRANT ALL ON TABLE public.staff_timetables TO authenticated;
GRANT ALL ON TABLE public.staff_timetables TO service_role;
GRANT SELECT ON TABLE public.staff_timetables TO anon;

-- ==============================================================================
-- CampusConnect - Student-to-Faculty Meeting Request System (Phase 6)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.meeting_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_date DATE NOT NULL,
  requested_time TEXT NOT NULL,
  meeting_type TEXT NOT NULL CHECK (meeting_type IN ('IN_PERSON', 'ONLINE')),
  purpose TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED')),
  staff_response TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Foreign key constraints to profiles table for relation embedding in PostgREST
  CONSTRAINT fk_meeting_student_profile FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_meeting_staff_profile FOREIGN KEY (staff_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_meeting_requests_student ON public.meeting_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_meeting_requests_staff ON public.meeting_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_meeting_requests_status ON public.meeting_requests(status);
CREATE INDEX IF NOT EXISTS idx_meeting_requests_date ON public.meeting_requests(requested_date);
CREATE INDEX IF NOT EXISTS idx_meeting_requests_created_at ON public.meeting_requests(created_at DESC);

-- Data Integrity & Validation Constraints
ALTER TABLE public.meeting_requests
  DROP CONSTRAINT IF EXISTS chk_meeting_purpose_not_empty;
ALTER TABLE public.meeting_requests
  ADD CONSTRAINT chk_meeting_purpose_not_empty CHECK (length(trim(purpose)) >= 5);

ALTER TABLE public.meeting_requests
  DROP CONSTRAINT IF EXISTS chk_meeting_time_not_empty;
ALTER TABLE public.meeting_requests
  ADD CONSTRAINT chk_meeting_time_not_empty CHECK (length(trim(requested_time)) >= 3);

-- Trigger Function: Prevent Past Dates and Ensure Immutability of Core Fields
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

-- Enable and Force Row Level Security (RLS)
ALTER TABLE public.meeting_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_requests FORCE ROW LEVEL SECURITY;

-- 1. SELECT: Users can view requests they authored as a student or received as staff
DROP POLICY IF EXISTS "Users can view their own or addressed meeting requests" ON public.meeting_requests;
CREATE POLICY "Users can view their own or addressed meeting requests"
ON public.meeting_requests
FOR SELECT
TO authenticated
USING (auth.uid() = student_id OR auth.uid() = staff_id);

-- 2. INSERT: Only verified students can create requests, and recipient must be a verified staff member
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

-- 3. UPDATE by Student: Students can cancel their own pending requests only
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

-- 4a. UPDATE by Staff: Staff can accept or reject only PENDING requests assigned to them
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

-- 4b. UPDATE by Staff: Staff can complete ONLY ACCEPTED requests assigned to them
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

-- Table Grants
GRANT ALL ON TABLE public.meeting_requests TO authenticated;
GRANT ALL ON TABLE public.meeting_requests TO service_role;



