-- ============================================
-- MIGRATION: ADD ADMIN ROLE & UPDATE POLICIES
-- ============================================
-- 1. Update profiles role check constraint
-- Drop existing constraint (name might vary, standard is profiles_role_check)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
-- Add new constraint with 'admin' role
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check CHECK (role IN ('participant', 'organizer', 'admin'));
-- 2. Update Profiles Policies
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR
UPDATE USING (
        (
            SELECT auth.uid()
        ) = id
        OR (
            SELECT role
            FROM public.profiles
            WHERE id = (
                    SELECT auth.uid()
                )
        ) = 'admin'
    );
-- New admin policies
CREATE POLICY "Admins can update any profile" ON public.profiles FOR
UPDATE USING (
        (
            SELECT role
            FROM public.profiles
            WHERE id = (
                    SELECT auth.uid()
                )
        ) = 'admin'
    );
CREATE POLICY "Admins can delete any profile" ON public.profiles FOR DELETE USING (
    (
        SELECT role
        FROM public.profiles
        WHERE id = (
                SELECT auth.uid()
            )
    ) = 'admin'
);
-- 3. Update Events Policies
DROP POLICY IF EXISTS "Published events are viewable by everyone" ON public.events;
CREATE POLICY "Published events are viewable by everyone" ON public.events FOR
SELECT USING (
        status = 'published'
        OR organizer_id = (
            SELECT auth.uid()
        )
        OR (
            SELECT role
            FROM public.profiles
            WHERE id = (
                    SELECT auth.uid()
                )
        ) = 'admin'
    );
DROP POLICY IF EXISTS "Organizers can update their own events" ON public.events;
CREATE POLICY "Organizers can update their own events" ON public.events FOR
UPDATE USING (
        (
            SELECT auth.uid()
        ) = organizer_id
        OR (
            SELECT role
            FROM public.profiles
            WHERE id = (
                    SELECT auth.uid()
                )
        ) = 'admin'
    );
DROP POLICY IF EXISTS "Organizers can delete their own events" ON public.events;
CREATE POLICY "Organizers can delete their own events" ON public.events FOR DELETE USING (
    (
        SELECT auth.uid()
    ) = organizer_id
    OR (
        SELECT role
        FROM public.profiles
        WHERE id = (
                SELECT auth.uid()
            )
    ) = 'admin'
);
-- 4. Update Speakers Policies
DROP POLICY IF EXISTS "Organizers can manage their event speakers" ON public.speakers;
CREATE POLICY "Organizers can manage their event speakers" ON public.speakers FOR ALL USING (
    event_id IN (
        SELECT id
        FROM public.events
        WHERE organizer_id = (
                SELECT auth.uid()
            )
    )
    OR (
        SELECT role
        FROM public.profiles
        WHERE id = (
                SELECT auth.uid()
            )
    ) = 'admin'
);
-- 5. Update Registrations Policies
DROP POLICY IF EXISTS "Users can view their own registrations" ON public.registrations;
CREATE POLICY "Users can view their own registrations" ON public.registrations FOR
SELECT USING (
        (
            SELECT auth.uid()
        ) = user_id
        OR (
            SELECT auth.uid()
        ) IN (
            SELECT organizer_id
            FROM public.events
            WHERE id = event_id
        )
        OR (
            SELECT role
            FROM public.profiles
            WHERE id = (
                    SELECT auth.uid()
                )
        ) = 'admin'
    );
DROP POLICY IF EXISTS "Organizers can update registrations for their events" ON public.registrations;
CREATE POLICY "Organizers can update registrations for their events" ON public.registrations FOR
UPDATE USING (
        (
            SELECT auth.uid()
        ) IN (
            SELECT organizer_id
            FROM public.events
            WHERE id = event_id
        )
        OR (
            SELECT role
            FROM public.profiles
            WHERE id = (
                    SELECT auth.uid()
                )
        ) = 'admin'
    );
-- 6. Update Form Fields Policies
DROP POLICY IF EXISTS "Organizers can create form fields for their events" ON public.form_fields;
CREATE POLICY "Organizers can create form fields for their events" ON public.form_fields FOR
INSERT WITH CHECK (
        (
            SELECT auth.uid()
        ) IN (
            SELECT organizer_id
            FROM public.events
            WHERE id = event_id
        )
        OR (
            SELECT role
            FROM public.profiles
            WHERE id = (
                    SELECT auth.uid()
                )
        ) = 'admin'
    );
DROP POLICY IF EXISTS "Organizers can update form fields for their events" ON public.form_fields;
CREATE POLICY "Organizers can update form fields for their events" ON public.form_fields FOR
UPDATE USING (
        (
            SELECT auth.uid()
        ) IN (
            SELECT organizer_id
            FROM public.events
            WHERE id = event_id
        )
        OR (
            SELECT role
            FROM public.profiles
            WHERE id = (
                    SELECT auth.uid()
                )
        ) = 'admin'
    );
DROP POLICY IF EXISTS "Organizers can delete form fields for their events" ON public.form_fields;
CREATE POLICY "Organizers can delete form fields for their events" ON public.form_fields FOR DELETE USING (
    (
        SELECT auth.uid()
    ) IN (
        SELECT organizer_id
        FROM public.events
        WHERE id = event_id
    )
    OR (
        SELECT role
        FROM public.profiles
        WHERE id = (
                SELECT auth.uid()
            )
    ) = 'admin'
);