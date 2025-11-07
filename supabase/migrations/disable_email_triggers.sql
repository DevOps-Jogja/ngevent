-- ============================================
-- DISABLE DATABASE EMAIL TRIGGERS
-- ============================================
-- This migration disables database-level email triggers
-- because we're using client-side email integration instead.
-- 
-- Why disable triggers?
-- 1. Database triggers require pg_net extension + webhook configuration
-- 2. Client-side approach is more reliable and easier to debug
-- 3. Better error handling in application layer
-- 4. No database constraint violations
-- ============================================

-- ============================================
-- 1. Drop Email Triggers
-- ============================================

-- Drop welcome email trigger
DROP TRIGGER IF EXISTS on_profile_created_send_welcome_email ON public.profiles;

-- Drop registration confirmation email trigger  
DROP TRIGGER IF EXISTS on_registration_created_send_email ON public.registrations;

-- ============================================
-- 2. Keep Functions (for manual use if needed)
-- ============================================
-- We keep the functions in case you want to manually trigger emails
-- But they won't auto-fire anymore

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
    trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger
    WHERE tgname IN ('on_profile_created_send_welcome_email', 'on_registration_created_send_email');
    
    IF trigger_count = 0 THEN
        RAISE NOTICE '✅ Email triggers successfully disabled!';
        RAISE NOTICE '';
        RAISE NOTICE 'Email system now uses client-side integration:';
        RAISE NOTICE '  - Welcome emails: app/auth/callback/route.ts';
        RAISE NOTICE '  - Registration emails: app/events/[id]/page.tsx';
        RAISE NOTICE '';
        RAISE NOTICE 'Benefits:';
        RAISE NOTICE '  ✅ No database constraint errors';
        RAISE NOTICE '  ✅ Better error handling';
        RAISE NOTICE '  ✅ Easier to debug';
        RAISE NOTICE '  ✅ More reliable';
    ELSE
        RAISE NOTICE '⚠️ Warning: Some triggers still exist (count: %)', trigger_count;
    END IF;
END $$;
