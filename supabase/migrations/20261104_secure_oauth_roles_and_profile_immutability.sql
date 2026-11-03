-- ==============================================================================
-- Migration: 20261104_secure_oauth_roles_and_profile_immutability.sql
-- Description:
--   1. Enforces role immutability on public.profiles via BEFORE UPDATE trigger.
--   2. Prevents users from escalating or modifying their role via ordinary profile updates.
--   3. Updates handle_new_user() trigger so OAuth signups without role metadata do not
--      get defaulted to 'student', and existing profiles are NEVER overwritten (DO NOTHING on conflict).
-- ==============================================================================

-- 1. Trigger Function to Prevent Role Modification on Existing Profiles
CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If the profile already has a role assigned, reject any attempt to modify it
  IF OLD.role IS NOT NULL AND NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Role modification is not permitted. Once set, an account role (student/staff) cannot be altered.';
  END IF;
  RETURN NEW;
END;
$$;

-- Drop trigger if it already exists and recreate
DROP TRIGGER IF EXISTS trg_prevent_role_change ON public.profiles;
CREATE TRIGGER trg_prevent_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_role_change();

-- 2. Update Auth User Creation Trigger Function
-- For email/password signups with verified role metadata, auto-create the profile.
-- For OAuth signups where role is not present in raw_user_meta_data, skip auto-creation so
-- the application's secure OAuth callback handler provisions the profile with the user's intended role.
-- Never overwrite an existing profile (ON CONFLICT DO NOTHING).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  v_role := NEW.raw_user_meta_data->>'role';

  -- Only auto-insert if a valid role was explicitly provided in user metadata
  IF v_role IN ('student', 'staff') THEN
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
    ON CONFLICT (id) DO NOTHING; -- Strictly preserve existing account role
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Ensure Row Level Security Policy for Profile Updates
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
