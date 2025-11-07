-- ============================================
-- EMAIL NOTIFICATION SYSTEM
-- Sistem email otomatis menggunakan Supabase Auth
-- ============================================

-- ============================================
-- 1. FUNCTION: Send Welcome Email to New User
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

-- Trigger for welcome email when profile is created
DROP TRIGGER IF EXISTS on_profile_created_send_welcome_email ON public.profiles;
CREATE TRIGGER on_profile_created_send_welcome_email
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION send_welcome_email();

-- ============================================
-- 2. FUNCTION: Send Event Registration Confirmation Email
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

-- Trigger for registration confirmation email
DROP TRIGGER IF EXISTS on_registration_created_send_email ON public.registrations;
CREATE TRIGGER on_registration_created_send_email
    AFTER INSERT ON public.registrations
    FOR EACH ROW
    EXECUTE FUNCTION send_registration_confirmation_email();

-- ============================================
-- 3. EMAIL TEMPLATES TABLE
-- Store email templates for customization
-- ============================================
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_type TEXT NOT NULL CHECK (template_type IN ('welcome', 'registration_confirmation', 'event_reminder', 'event_update')),
    subject TEXT NOT NULL,
    html_body TEXT NOT NULL,
    text_body TEXT,
    variables JSONB, -- Available variables for template
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(template_type)
);

-- Insert default templates
INSERT INTO public.email_templates (template_type, subject, html_body, text_body, variables) VALUES
(
    'welcome',
    'Welcome to NGEvent! 🎉',
    '<html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4F46E5;">Welcome to NGEvent!</h1>
            <p>Hi {{user_name}},</p>
            <p>Thank you for joining NGEvent! We''re excited to have you as part of our community.</p>
            <p>With NGEvent, you can:</p>
            <ul>
                <li>Discover amazing events</li>
                <li>Register for events easily</li>
                <li>Organize your own events</li>
                <li>Connect with other participants</li>
            </ul>
            <p>Get started by exploring our upcoming events:</p>
            <a href="{{base_url}}/events" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Browse Events</a>
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p>Best regards,<br>The NGEvent Team</p>
        </body>
    </html>',
    'Welcome to NGEvent! Thank you for joining us. Start exploring events at {{base_url}}/events',
    '{"user_name": "User full name", "base_url": "Application base URL"}'
),
(
    'registration_confirmation',
    'Event Registration Confirmed: {{event_title}}',
    '<html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4F46E5;">Registration Confirmed! ✅</h1>
            <p>Hi {{user_name}},</p>
            <p>Your registration for <strong>{{event_title}}</strong> has been confirmed!</p>
            <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="margin-top: 0; color: #1F2937;">Event Details:</h2>
                <p><strong>📅 Date:</strong> {{event_date}}</p>
                <p><strong>📍 Location:</strong> {{event_location}}</p>
                <p><strong>👤 Organizer:</strong> {{organizer_name}}</p>
            </div>
            <p>We''re looking forward to seeing you there!</p>
            <a href="{{base_url}}/events/{{event_id}}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">View Event Details</a>
            <p>If you need to make any changes to your registration, please visit your dashboard.</p>
            <p>Best regards,<br>The NGEvent Team</p>
        </body>
    </html>',
    'Registration Confirmed! You are registered for {{event_title}} on {{event_date}} at {{event_location}}. View details: {{base_url}}/events/{{event_id}}',
    '{"user_name": "User full name", "event_title": "Event title", "event_date": "Event date", "event_location": "Event location", "organizer_name": "Organizer name", "event_id": "Event ID", "base_url": "Application base URL"}'
)
ON CONFLICT (template_type) DO UPDATE SET
    subject = EXCLUDED.subject,
    html_body = EXCLUDED.html_body,
    text_body = EXCLUDED.text_body,
    variables = EXCLUDED.variables,
    updated_at = NOW();

-- RLS Policies for email_templates
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Anyone can read templates (for preview purposes)
CREATE POLICY "Anyone can read email templates"
ON public.email_templates
FOR SELECT
USING (active = true);

-- Only service role can modify templates
CREATE POLICY "Service role can modify templates"
ON public.email_templates
FOR ALL
USING ((SELECT auth.role()) = 'service_role');

-- ============================================
-- 4. EMAIL LOG TABLE
-- Track all sent emails for debugging
-- ============================================
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email_type TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'sent', 'failed')) DEFAULT 'pending',
    error_message TEXT,
    metadata JSONB,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON public.email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at DESC);

-- RLS Policies
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own email logs
CREATE POLICY "Users can view own email logs"
ON public.email_logs
FOR SELECT
USING ((SELECT auth.uid()) = user_id);

-- Service role can do anything
CREATE POLICY "Service role can manage email logs"
ON public.email_logs
FOR ALL
USING ((SELECT auth.role()) = 'service_role');

-- Grant permissions
GRANT ALL ON public.email_templates TO authenticated;
GRANT ALL ON public.email_templates TO service_role;
GRANT ALL ON public.email_logs TO authenticated;
GRANT ALL ON public.email_logs TO service_role;

COMMENT ON TABLE public.email_templates IS 'Email templates for automated notifications';
COMMENT ON TABLE public.email_logs IS 'Log of all emails sent by the system';
COMMENT ON FUNCTION send_welcome_email() IS 'Sends welcome email when new profile is created';
COMMENT ON FUNCTION send_registration_confirmation_email() IS 'Sends confirmation email when user registers for an event';
