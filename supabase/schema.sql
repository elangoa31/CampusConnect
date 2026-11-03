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
  
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast lookup by role, department, or email
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON public.profiles(department);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

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

-- Users can only update their own profile, but CANNOT change their role column
DROP POLICY IF EXISTS "Users can update their own profile without escalating role" ON public.profiles;
CREATE POLICY "Users can update their own profile without escalating role"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
);

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
