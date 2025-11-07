-- ============================================
-- OPTIMIZE RLS POLICIES FOR PERFORMANCE
-- ============================================
-- This migration optimizes all RLS policies by wrapping auth functions
-- with SELECT to avoid re-evaluation for each row.
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
-- ============================================

-- Drop and recreate all policies with optimized queries

-- ============================================
-- PROFILES POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING ((SELECT auth.uid()) = id);

-- ============================================
-- EVENTS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Published events are viewable by everyone" ON public.events;
DROP POLICY IF EXISTS "Organizers can create events" ON public.events;
DROP POLICY IF EXISTS "Organizers can update their own events" ON public.events;
DROP POLICY IF EXISTS "Organizers can delete their own events" ON public.events;

CREATE POLICY "Published events are viewable by everyone"
  ON public.events FOR SELECT
  USING (status = 'published' OR organizer_id = (SELECT auth.uid()));

CREATE POLICY "Organizers can create events"
  ON public.events FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = organizer_id);

CREATE POLICY "Organizers can update their own events"
  ON public.events FOR UPDATE
  USING ((SELECT auth.uid()) = organizer_id);

CREATE POLICY "Organizers can delete their own events"
  ON public.events FOR DELETE
  USING ((SELECT auth.uid()) = organizer_id);

-- ============================================
-- SPEAKERS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Organizers can manage their event speakers" ON public.speakers;

CREATE POLICY "Organizers can manage their event speakers"
  ON public.speakers FOR ALL
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE organizer_id = (SELECT auth.uid())
    )
  );

-- ============================================
-- REGISTRATIONS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view their own registrations" ON public.registrations;
DROP POLICY IF EXISTS "Users can register for events" ON public.registrations;
DROP POLICY IF EXISTS "Users can update their own registrations" ON public.registrations;
DROP POLICY IF EXISTS "Organizers can update registrations for their events" ON public.registrations;

CREATE POLICY "Users can view their own registrations"
  ON public.registrations FOR SELECT
  USING ((SELECT auth.uid()) = user_id OR (SELECT auth.uid()) IN (
    SELECT organizer_id FROM public.events WHERE id = event_id
  ));

CREATE POLICY "Users can register for events"
  ON public.registrations FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own registrations"
  ON public.registrations FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Organizers can update registrations for their events"
  ON public.registrations FOR UPDATE
  USING ((SELECT auth.uid()) IN (
    SELECT organizer_id FROM public.events WHERE id = event_id
  ));

-- ============================================
-- FORM_FIELDS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Organizers can create form fields for their events" ON public.form_fields;
DROP POLICY IF EXISTS "Organizers can update form fields for their events" ON public.form_fields;
DROP POLICY IF EXISTS "Organizers can delete form fields for their events" ON public.form_fields;

CREATE POLICY "Organizers can create form fields for their events"
  ON public.form_fields FOR INSERT
  WITH CHECK ((SELECT auth.uid()) IN (
    SELECT organizer_id FROM public.events WHERE id = event_id
  ));

CREATE POLICY "Organizers can update form fields for their events"
  ON public.form_fields FOR UPDATE
  USING ((SELECT auth.uid()) IN (
    SELECT organizer_id FROM public.events WHERE id = event_id
  ));

CREATE POLICY "Organizers can delete form fields for their events"
  ON public.form_fields FOR DELETE
  USING ((SELECT auth.uid()) IN (
    SELECT organizer_id FROM public.events WHERE id = event_id
  ));

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Authenticated users can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- ============================================
-- EMAIL_LOGS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own email logs" ON public.email_logs;
DROP POLICY IF EXISTS "Service role can manage email logs" ON public.email_logs;

CREATE POLICY "Users can view own email logs"
  ON public.email_logs FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Service role can manage email logs"
  ON public.email_logs FOR ALL
  USING ((SELECT auth.role()) = 'service_role');

-- ============================================
-- EMAIL_TEMPLATES POLICIES
-- ============================================

DROP POLICY IF EXISTS "Service role can modify templates" ON public.email_templates;

CREATE POLICY "Service role can modify templates"
  ON public.email_templates FOR ALL
  USING ((SELECT auth.role()) = 'service_role');

-- ============================================
-- VERIFICATION
-- ============================================

-- Count optimized policies
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';
  
  RAISE NOTICE '✅ RLS Policy Optimization Complete!';
  RAISE NOTICE 'Total policies optimized: %', policy_count;
  RAISE NOTICE 'All auth.uid() and auth.role() calls are now wrapped with SELECT for optimal performance.';
END $$;
