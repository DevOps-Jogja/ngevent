-- ============================================
-- NOTIFICATIONS TABLE
-- Sistem notifikasi untuk users
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('registration', 'event_update', 'reminder', 'general', 'payment')) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);

-- RLS Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING ((SELECT auth.uid()) = user_id);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING ((SELECT auth.uid()) = user_id);

-- Policy: System/Organizers can create notifications
CREATE POLICY "Authenticated users can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON public.notifications
FOR DELETE
USING ((SELECT auth.uid()) = user_id);

-- Function untuk auto-create notifications saat ada registrasi baru
CREATE OR REPLACE FUNCTION create_registration_notification()
RETURNS TRIGGER AS $$
DECLARE
  event_record RECORD;
  organizer_id UUID;
BEGIN
  -- Ambil data event dan organizer
  SELECT e.id, e.title, e.organizer_id INTO event_record
  FROM public.events e
  WHERE e.id = NEW.event_id;

  -- Buat notifikasi untuk organizer
  INSERT INTO public.notifications (user_id, event_id, type, title, message)
  VALUES (
    event_record.organizer_id,
    NEW.event_id,
    'registration',
    'New Registration',
    'Someone just registered for your event "' || event_record.title || '"'
  );

  -- Buat notifikasi untuk participant
  INSERT INTO public.notifications (user_id, event_id, type, title, message)
  VALUES (
    NEW.user_id,
    NEW.event_id,
    'registration',
    'Registration Confirmed',
    'You have successfully registered for "' || event_record.title || '"'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger untuk auto-create notifications saat registrasi
DROP TRIGGER IF EXISTS on_registration_created ON public.registrations;
CREATE TRIGGER on_registration_created
  AFTER INSERT ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION create_registration_notification();

-- Function untuk auto-create notifications saat event di-update
CREATE OR REPLACE FUNCTION create_event_update_notification()
RETURNS TRIGGER AS $$
DECLARE
  participant_record RECORD;
BEGIN
  -- Skip jika event baru dibuat (bukan update)
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Skip jika tidak ada perubahan penting
  IF OLD.title = NEW.title 
    AND OLD.start_date = NEW.start_date 
    AND OLD.end_date = NEW.end_date 
    AND OLD.location = NEW.location 
    AND OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Buat notifikasi untuk semua peserta yang terdaftar
  FOR participant_record IN 
    SELECT user_id FROM public.registrations WHERE event_id = NEW.id
  LOOP
    INSERT INTO public.notifications (user_id, event_id, type, title, message)
    VALUES (
      participant_record.user_id,
      NEW.id,
      'event_update',
      'Event Updated',
      'The event "' || NEW.title || '" has been updated by the organizer'
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger untuk auto-create notifications saat event update
DROP TRIGGER IF EXISTS on_event_updated ON public.events;
CREATE TRIGGER on_event_updated
  AFTER UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION create_event_update_notification();

-- Function untuk create event reminder (1 hari sebelum event)
-- Ini bisa dipanggil via cron job atau scheduled function
CREATE OR REPLACE FUNCTION create_event_reminders()
RETURNS void AS $$
DECLARE
  event_record RECORD;
  participant_record RECORD;
BEGIN
  -- Cari events yang akan dimulai dalam 24 jam
  FOR event_record IN 
    SELECT id, title, start_date, organizer_id
    FROM public.events
    WHERE start_date BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
      AND status = 'published'
  LOOP
    -- Reminder untuk organizer
    INSERT INTO public.notifications (user_id, event_id, type, title, message)
    VALUES (
      event_record.organizer_id,
      event_record.id,
      'reminder',
      'Event Starting Soon',
      'Your event "' || event_record.title || '" will start in less than 24 hours'
    )
    ON CONFLICT DO NOTHING;

    -- Reminder untuk semua participants
    FOR participant_record IN
      SELECT user_id FROM public.registrations WHERE event_id = event_record.id
    LOOP
      INSERT INTO public.notifications (user_id, event_id, type, title, message)
      VALUES (
        participant_record.user_id,
        event_record.id,
        'reminder',
        'Event Reminder',
        'The event "' || event_record.title || '" will start soon!'
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function untuk auto-delete old notifications (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE created_at < NOW() - INTERVAL '30 days'
    AND read = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

COMMENT ON TABLE public.notifications IS 'Stores user notifications for events, registrations, and updates';
COMMENT ON FUNCTION create_registration_notification() IS 'Auto-creates notifications when a new registration is made';
COMMENT ON FUNCTION create_event_update_notification() IS 'Auto-creates notifications when an event is updated';
COMMENT ON FUNCTION create_event_reminders() IS 'Creates reminder notifications for upcoming events (should be called by cron)';
COMMENT ON FUNCTION cleanup_old_notifications() IS 'Deletes old read notifications to keep table clean';
