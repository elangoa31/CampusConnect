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

