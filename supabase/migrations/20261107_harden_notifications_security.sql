-- ==============================================================================
-- CampusConnect - Phase 7 Notification System Security Hardening Migration
-- Date: 2026-11-07
-- Objective: Audit and harden public.notifications security:
--   1. Revoke direct INSERT and table-level UPDATE privileges from authenticated users.
--   2. Grant column-level UPDATE strictly on `is_read` to authenticated users.
--   3. Revoke all permissions from anon and public roles.
--   4. Inspect pg_policies and purge any unexpected or legacy permissive policies.
--   5. Maintain strict RLS policies restricting users to their own notifications.
--   6. Enforce database-level immutability on core notification fields via BEFORE UPDATE trigger.
--   7. Add public.notifications to supabase_realtime without swallowing errors.
-- ==============================================================================

-- 1. REVOKE INSECURE PRIVILEGES & CONFIGURE STRICT PRIVILEGE BOUNDARIES
-- Remove all permissions granted to anon and public on notifications
REVOKE ALL ON TABLE public.notifications FROM anon;
REVOKE ALL ON TABLE public.notifications FROM public;

-- Revoke direct INSERT and full table-level UPDATE on notifications from authenticated users
REVOKE INSERT, UPDATE ON TABLE public.notifications FROM authenticated;

-- Restrict authenticated role strictly to SELECT, DELETE, and column-level UPDATE on is_read only
GRANT SELECT, DELETE ON TABLE public.notifications TO authenticated;
GRANT UPDATE (is_read) ON TABLE public.notifications TO authenticated;

-- Ensure service_role has full administrative privileges
GRANT ALL ON TABLE public.notifications TO service_role;


-- 2. INSPECT pg_policies AND DROP ANY UNEXPECTED OR LEGACY POLICIES
-- Drop direct client INSERT policy so authenticated users cannot fabricate or spoof notifications
DROP POLICY IF EXISTS "Users can insert notifications as actor" ON public.notifications;

-- Drop any policy on public.notifications that is not one of our three strict policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notifications'
      AND policyname NOT IN (
        'Users can view their own notifications',
        'Users can update their own notifications',
        'Users can delete their own notifications'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.notifications', pol.policyname);
  END LOOP;
END $$;

-- Drop and recreate our designated policies to ensure canonical definition
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;


-- 3. CREATE STRICT RLS POLICIES RESTRICTING USERS TO THEIR OWN NOTIFICATIONS

-- Policy 1: SELECT - Users can only view notifications where they are the recipient
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = recipient_id);

-- Policy 2: UPDATE - Users can only update notifications addressed to them
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);

-- Policy 3: DELETE - Users can only delete notifications addressed to them
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (auth.uid() = recipient_id);

-- (Note: Direct INSERT by authenticated users is prohibited.
-- Notifications are inserted exclusively via trusted SECURITY DEFINER triggers and jobs.)


-- 4. DATABASE-LEVEL IMMUTABILITY TRIGGER
-- Ensure users cannot alter recipient_id, actor_id, type, title, message,
-- reference_id, reference_type, created_at, or id even if permissions were misconfigured.
CREATE OR REPLACE FUNCTION public.prevent_notification_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.id <> OLD.id THEN
    RAISE EXCEPTION 'Notification id cannot be modified.';
  END IF;

  IF NEW.recipient_id <> OLD.recipient_id THEN
    RAISE EXCEPTION 'Notification recipient_id cannot be modified.';
  END IF;

  IF NEW.actor_id IS DISTINCT FROM OLD.actor_id THEN
    RAISE EXCEPTION 'Notification actor_id cannot be modified.';
  END IF;

  IF NEW.type <> OLD.type THEN
    RAISE EXCEPTION 'Notification type cannot be modified.';
  END IF;

  IF NEW.title <> OLD.title THEN
    RAISE EXCEPTION 'Notification title cannot be modified.';
  END IF;

  IF NEW.message <> OLD.message THEN
    RAISE EXCEPTION 'Notification message cannot be modified.';
  END IF;

  IF NEW.reference_id IS DISTINCT FROM OLD.reference_id THEN
    RAISE EXCEPTION 'Notification reference_id cannot be modified.';
  END IF;

  IF NEW.reference_type IS DISTINCT FROM OLD.reference_type THEN
    RAISE EXCEPTION 'Notification reference_type cannot be modified.';
  END IF;

  IF NEW.created_at <> OLD.created_at THEN
    RAISE EXCEPTION 'Notification created_at cannot be modified.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_notification_mutation ON public.notifications;
CREATE TRIGGER trg_prevent_notification_mutation
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_notification_mutation();


-- 5. ENSURE ROW LEVEL SECURITY IS STRICTLY ENFORCED
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications FORCE ROW LEVEL SECURITY;


-- 6. VERIFY REALTIME PUBLICATION INCLUSION (FAILS CLEARLY IF PUBLICATION SETUP FAILS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
