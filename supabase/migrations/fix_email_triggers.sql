-- ============================================
-- FIX: Email System Trigger Functions
-- ============================================
-- This migration fixes the NULL URL error in http_request_queue
-- by adding proper validation and error handling to email triggers.
-- 
-- Issue: "null value in column 'url' of relation 'http_request_queue' violates not-null constraint"
-- Cause: Webhook URL not configured, causing net.http_post() to receive NULL
-- Solution: Check if URL exists before calling net.http_post()
-- ============================================

-- ============================================
-- 1. Fix Welcome Email Function
-- ============================================
CREATE OR REPLACE FUNCTION send_welcome_email()
RETURNS TRIGGER AS $$
DECLARE
    user_email TEXT;
    user_name TEXT;
    webhook_url TEXT;
    service_key TEXT;
BEGIN
    -- Get webhook URL and service key
    webhook_url := current_setting('app.settings.webhook_url', true);
    service_key := current_setting('app.settings.service_role_key', true);

    -- Skip if webhook URL is not configured
    IF webhook_url IS NULL OR webhook_url = '' THEN
        RAISE NOTICE 'Email webhook not configured, skipping welcome email for user %', NEW.id;
        RETURN NEW;
    END IF;

    -- Get user email from auth.users
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = NEW.id;

    -- Get user name from profile (if exists)
    user_name := COALESCE(NEW.full_name, split_part(user_email, '@', 1));

    -- Send email using Supabase's pg_net extension
    -- Note: This requires pg_net extension to be enabled in Supabase
    BEGIN
        PERFORM
            net.http_post(
                url := webhook_url,
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || COALESCE(service_key, '')
                ),
                body := jsonb_build_object(
                    'type', 'welcome_email',
                    'user_id', NEW.id,
                    'email', user_email,
                    'name', user_name,
                    'timestamp', NOW()
                )
            );
    EXCEPTION WHEN OTHERS THEN
        -- Log error but don't fail the transaction
        RAISE WARNING 'Failed to send welcome email for user %: %', NEW.id, SQLERRM;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. Fix Registration Confirmation Email Function
-- ============================================
CREATE OR REPLACE FUNCTION send_registration_confirmation_email()
RETURNS TRIGGER AS $$
DECLARE
    user_email TEXT;
    user_name TEXT;
    event_title TEXT;
    event_date TIMESTAMP WITH TIME ZONE;
    event_location TEXT;
    organizer_name TEXT;
    webhook_url TEXT;
    service_key TEXT;
BEGIN
    -- Get webhook URL and service key
    webhook_url := current_setting('app.settings.webhook_url', true);
    service_key := current_setting('app.settings.service_role_key', true);

    -- Skip if webhook URL is not configured
    IF webhook_url IS NULL OR webhook_url = '' THEN
        RAISE NOTICE 'Email webhook not configured, skipping registration confirmation for registration %', NEW.id;
        RETURN NEW;
    END IF;

    -- Get user details
    SELECT 
        u.email,
        p.full_name
    INTO user_email, user_name
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    WHERE u.id = NEW.user_id;

    -- Get event details
    SELECT 
        e.title,
        e.start_date,
        e.location,
        po.full_name
    INTO event_title, event_date, event_location, organizer_name
    FROM public.events e
    LEFT JOIN public.profiles po ON po.id = e.organizer_id
    WHERE e.id = NEW.event_id;

    -- Send confirmation email
    BEGIN
        PERFORM
            net.http_post(
                url := webhook_url,
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || COALESCE(service_key, '')
                ),
                body := jsonb_build_object(
                    'type', 'registration_confirmation',
                    'user_id', NEW.user_id,
                    'email', user_email,
                    'user_name', COALESCE(user_name, split_part(user_email, '@', 1)),
                    'event_id', NEW.event_id,
                    'event_title', event_title,
                    'event_date', event_date,
                    'event_location', COALESCE(event_location, 'TBA'),
                    'organizer_name', COALESCE(organizer_name, 'Event Organizer'),
                    'registration_id', NEW.id,
                    'registered_at', NEW.registered_at,
                    'timestamp', NOW()
                )
            );
    EXCEPTION WHEN OTHERS THEN
        -- Log error but don't fail the transaction
        RAISE WARNING 'Failed to send registration confirmation for registration %: %', NEW.id, SQLERRM;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Email trigger functions updated successfully!';
    RAISE NOTICE 'Functions now include:';
    RAISE NOTICE '  - NULL URL validation';
    RAISE NOTICE '  - Proper error handling';
    RAISE NOTICE '  - Non-blocking email failures';
    RAISE NOTICE '';
    RAISE NOTICE 'Registration will now work even if email webhook is not configured.';
END $$;
