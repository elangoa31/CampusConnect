-- ==============================================================================
-- Migration: 20261104_create_notifications_system.sql
-- Description: Phase 7 — Real-Time Notification & Alert System
-- 
-- 1. Creates public.notifications table with constraints & indexes
-- 2. Configures Row Level Security (RLS) for notification isolation
-- 3. Enables Supabase Realtime for instant notification streaming
-- 4. Creates atomic trigger public.handle_meeting_notification() on meeting_requests
--    to automatically dispatch in-app notifications on meeting events
-- ==============================================================================

-- 1. Create public.notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN (
    'MEETING_REQUEST_RECEIVED',
    'MEETING_REQUEST_ACCEPTED',
    'MEETING_REQUEST_REJECTED',
    'MEETING_REQUEST_CANCELLED',
    'MEETING_COMPLETED',
    'MEETING_REMINDER'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  reference_id UUID,
  reference_type TEXT DEFAULT 'meeting_requests',
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Foreign keys to profiles table for relational queries in PostgREST
  CONSTRAINT fk_notification_recipient_profile FOREIGN KEY (recipient_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_notification_actor_profile FOREIGN KEY (actor_id) REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON public.notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created ON public.notifications(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_reference ON public.notifications(reference_id, reference_type);

-- Validation Constraints
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS chk_notifications_title_not_empty;
ALTER TABLE public.notifications
  ADD CONSTRAINT chk_notifications_title_not_empty CHECK (length(trim(title)) >= 2);

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS chk_notifications_message_not_empty;
ALTER TABLE public.notifications
  ADD CONSTRAINT chk_notifications_message_not_empty CHECK (length(trim(message)) >= 3);

-- 2. Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications FORCE ROW LEVEL SECURITY;

-- SELECT: Users can only read notifications addressed to them
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = recipient_id);

-- UPDATE: Users can only mark their own notifications as read
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = recipient_id)
WITH CHECK (
  auth.uid() = recipient_id AND
  recipient_id = (SELECT n.recipient_id FROM public.notifications n WHERE n.id = id)
);

-- INSERT: Authenticated users can insert notifications where they are the actor
DROP POLICY IF EXISTS "Users can insert notifications as actor" ON public.notifications;
CREATE POLICY "Users can insert notifications as actor"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = actor_id AND recipient_id <> auth.uid()
);

-- DELETE: Users can delete their own notifications
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (auth.uid() = recipient_id);

-- Table Permissions
GRANT ALL ON TABLE public.notifications TO authenticated;
GRANT ALL ON TABLE public.notifications TO service_role;
GRANT SELECT ON TABLE public.notifications TO anon;

-- 3. Enable Supabase Realtime
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
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Safe fallback if supabase_realtime publication is not configured in local environment
END $$;

-- 4. Automatic Notification Dispatch Trigger Function
CREATE OR REPLACE FUNCTION public.handle_meeting_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_student_name TEXT;
  v_staff_name TEXT;
  v_type TEXT;
  v_recipient_id UUID;
  v_actor_id UUID;
  v_title TEXT;
  v_message TEXT;
BEGIN
  -- Fetch actor and participant names from profiles table
  SELECT full_name INTO v_student_name FROM public.profiles WHERE id = NEW.student_id;
  SELECT full_name INTO v_staff_name FROM public.profiles WHERE id = NEW.staff_id;

  v_student_name := COALESCE(v_student_name, 'A student');
  v_staff_name := COALESCE(v_staff_name, 'A faculty member');

  -- Case A: New meeting request created (status: PENDING)
  IF TG_OP = 'INSERT' AND NEW.status = 'PENDING' THEN
    v_type := 'MEETING_REQUEST_RECEIVED';
    v_recipient_id := NEW.staff_id;
    v_actor_id := NEW.student_id;
    v_title := 'New Meeting Request';
    v_message := v_student_name || ' requested a meeting on ' || to_char(NEW.requested_date, 'Mon DD, YYYY') || ' at ' || NEW.requested_time || '.';

  -- Case B: Meeting request updated (status changed)
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    
    -- 1. Staff accepts meeting
    IF NEW.status = 'ACCEPTED' AND OLD.status = 'PENDING' THEN
      v_type := 'MEETING_REQUEST_ACCEPTED';
      v_recipient_id := NEW.student_id;
      v_actor_id := NEW.staff_id;
      v_title := 'Meeting Request Accepted';
      v_message := v_staff_name || ' accepted your meeting scheduled for ' || to_char(NEW.requested_date, 'Mon DD, YYYY') || ' at ' || NEW.requested_time || '.';
      
      IF NEW.staff_response IS NOT NULL AND length(trim(NEW.staff_response)) > 0 THEN
        v_message := v_message || ' Note: "' || trim(NEW.staff_response) || '"';
      END IF;

    -- 2. Staff rejects meeting
    ELSIF NEW.status = 'REJECTED' AND OLD.status = 'PENDING' THEN
      v_type := 'MEETING_REQUEST_REJECTED';
      v_recipient_id := NEW.student_id;
      v_actor_id := NEW.staff_id;
      v_title := 'Meeting Request Declined';
      v_message := v_staff_name || ' declined your meeting request for ' || to_char(NEW.requested_date, 'Mon DD, YYYY') || '.';

      IF NEW.staff_response IS NOT NULL AND length(trim(NEW.staff_response)) > 0 THEN
        v_message := v_message || ' Reason: "' || trim(NEW.staff_response) || '"';
      END IF;

    -- 3. Student cancels pending meeting
    ELSIF NEW.status = 'CANCELLED' AND OLD.status = 'PENDING' THEN
      v_type := 'MEETING_REQUEST_CANCELLED';
      v_recipient_id := NEW.staff_id;
      v_actor_id := NEW.student_id;
      v_title := 'Meeting Request Cancelled';
      v_message := v_student_name || ' cancelled their meeting request scheduled for ' || to_char(NEW.requested_date, 'Mon DD, YYYY') || '.';

    -- 4. Staff completes accepted meeting
    ELSIF NEW.status = 'COMPLETED' AND OLD.status = 'ACCEPTED' THEN
      v_type := 'MEETING_COMPLETED';
      v_recipient_id := NEW.student_id;
      v_actor_id := NEW.staff_id;
      v_title := 'Meeting Completed';
      v_message := 'Your meeting with ' || v_staff_name || ' on ' || to_char(NEW.requested_date, 'Mon DD, YYYY') || ' has been marked as completed.';

    ELSE
      RETURN NEW;
    END IF;

  ELSE
    RETURN NEW;
  END IF;

  -- Prevent duplicate notifications for the same meeting reference, type, and recipient
  IF NOT EXISTS (
    SELECT 1 FROM public.notifications
    WHERE reference_id = NEW.id
      AND type = v_type
      AND recipient_id = v_recipient_id
  ) THEN
    INSERT INTO public.notifications (
      recipient_id,
      actor_id,
      type,
      title,
      message,
      reference_id,
      reference_type,
      is_read,
      created_at
    )
    VALUES (
      v_recipient_id,
      v_actor_id,
      v_type,
      v_title,
      v_message,
      NEW.id,
      'meeting_requests',
      FALSE,
      timezone('utc'::text, now())
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create Trigger on meeting_requests
DROP TRIGGER IF EXISTS trg_meeting_notification ON public.meeting_requests;
CREATE TRIGGER trg_meeting_notification
  AFTER INSERT OR UPDATE OF status ON public.meeting_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_meeting_notification();

-- 5. Upcoming Meeting Reminder Dispatcher Function
-- Can be called via pg_cron extension or an external scheduler every 15 minutes
CREATE OR REPLACE FUNCTION public.dispatch_upcoming_meeting_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_student_name TEXT;
  v_staff_name TEXT;
BEGIN
  -- Look for ACCEPTED meetings happening today (ignoring CANCELLED, REJECTED, COMPLETED)
  FOR r IN
    SELECT 
      m.id,
      m.student_id,
      m.staff_id,
      m.requested_date,
      m.requested_time
    FROM public.meeting_requests m
    WHERE m.status = 'ACCEPTED'
      AND m.requested_date = CURRENT_DATE
  LOOP
    SELECT full_name INTO v_student_name FROM public.profiles WHERE id = r.student_id;
    SELECT full_name INTO v_staff_name FROM public.profiles WHERE id = r.staff_id;

    -- Reminder for Student
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications 
      WHERE reference_id = r.id AND recipient_id = r.student_id AND type = 'MEETING_REMINDER'
    ) THEN
      INSERT INTO public.notifications (
        recipient_id,
        actor_id,
        type,
        title,
        message,
        reference_id,
        reference_type,
        is_read,
        created_at
      ) VALUES (
        r.student_id,
        r.staff_id,
        'MEETING_REMINDER',
        'Upcoming Meeting Reminder',
        'Reminder: You have an upcoming consultation with ' || COALESCE(v_staff_name, 'your faculty member') || ' today at ' || r.requested_time || '.',
        r.id,
        'meeting_requests',
        FALSE,
        timezone('utc'::text, now())
      );
    END IF;

    -- Reminder for Staff
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications 
      WHERE reference_id = r.id AND recipient_id = r.staff_id AND type = 'MEETING_REMINDER'
    ) THEN
      INSERT INTO public.notifications (
        recipient_id,
        actor_id,
        type,
        title,
        message,
        reference_id,
        reference_type,
        is_read,
        created_at
      ) VALUES (
        r.staff_id,
        r.student_id,
        'MEETING_REMINDER',
        'Upcoming Meeting Reminder',
        'Reminder: You have an upcoming consultation with ' || COALESCE(v_student_name, 'a student') || ' today at ' || r.requested_time || '.',
        r.id,
        'meeting_requests',
        FALSE,
        timezone('utc'::text, now())
      );
    END IF;
  END LOOP;
END;
$$;

