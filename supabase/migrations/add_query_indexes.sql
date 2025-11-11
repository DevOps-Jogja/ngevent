-- Performance indexes to speed common queries as data grows
-- Safe to run multiple times due to IF NOT EXISTS

-- 1) Optimize ordered form fields lookup per event
CREATE INDEX IF NOT EXISTS idx_form_fields_event_order
  ON public.form_fields (event_id, order_index);

-- 2) Optimize ordered speakers lookup per event
CREATE INDEX IF NOT EXISTS idx_speakers_event_order
  ON public.speakers (event_id, order_index);

-- 3) Optimize time-based filtering/sorting of events
CREATE INDEX IF NOT EXISTS idx_events_start_date
  ON public.events (start_date);
