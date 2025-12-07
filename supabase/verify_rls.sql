-- ============================================
-- RLS VERIFICATION SCRIPT
-- ============================================
-- Run this in Supabase SQL Editor to verify RLS is properly configured
-- ============================================
-- 1. Check if RLS is enabled on all tables
SELECT schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
-- Expected: All tables should have rls_enabled = true
-- ============================================
-- 2. List all RLS policies
SELECT schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename,
    policyname;
-- Expected: Should see policies for all tables
-- ============================================
-- 3. Check tables WITHOUT RLS (DANGEROUS!)
SELECT schemaname,
    tablename
FROM pg_tables
WHERE schemaname = 'public'
    AND rowsecurity = false;
-- Expected: Should return NO rows (empty result)
-- ============================================
-- 4. Count policies per table
SELECT tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
-- Expected: Each table should have at least 1 policy
-- ============================================
-- 5. Test RLS with anonymous user
-- This simulates what an unauthenticated user can see
SET ROLE anon;
-- Try to select from events (should only see published)
SELECT COUNT(*) as published_events_count
FROM events
WHERE status = 'published';
-- Try to select draft events (should return 0)
SELECT COUNT(*) as draft_events_count
FROM events
WHERE status = 'draft';
-- Try to select from profiles (should fail or return 0)
SELECT COUNT(*) as profiles_count
FROM profiles;
-- Reset role
RESET ROLE;
-- ============================================
-- 6. Verify auth.uid() is used in policies
SELECT tablename,
    policyname,
    qual::text as using_clause,
    with_check::text as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
    AND (
        qual::text LIKE '%auth.uid()%'
        OR with_check::text LIKE '%auth.uid()%'
    )
ORDER BY tablename;
-- Expected: Most policies should use auth.uid()
-- ============================================
-- 7. Check for policies using auth.role()
SELECT tablename,
    policyname,
    qual::text as using_clause
FROM pg_policies
WHERE schemaname = 'public'
    AND (
        qual::text LIKE '%auth.role()%'
        OR with_check::text LIKE '%auth.role()%'
    )
ORDER BY tablename;
-- Expected: Should see service_role policies for admin tables
-- ============================================
-- 8. Summary Report
DO $$
DECLARE total_tables INTEGER;
tables_with_rls INTEGER;
tables_without_rls INTEGER;
total_policies INTEGER;
BEGIN -- Count tables
SELECT COUNT(*) INTO total_tables
FROM pg_tables
WHERE schemaname = 'public';
SELECT COUNT(*) INTO tables_with_rls
FROM pg_tables
WHERE schemaname = 'public'
    AND rowsecurity = true;
SELECT COUNT(*) INTO tables_without_rls
FROM pg_tables
WHERE schemaname = 'public'
    AND rowsecurity = false;
SELECT COUNT(*) INTO total_policies
FROM pg_policies
WHERE schemaname = 'public';
RAISE NOTICE '========================================';
RAISE NOTICE 'RLS SECURITY AUDIT SUMMARY';
RAISE NOTICE '========================================';
RAISE NOTICE 'Total tables: %',
total_tables;
RAISE NOTICE 'Tables with RLS enabled: %',
tables_with_rls;
RAISE NOTICE 'Tables WITHOUT RLS: % ⚠️',
tables_without_rls;
RAISE NOTICE 'Total RLS policies: %',
total_policies;
RAISE NOTICE '========================================';
IF tables_without_rls > 0 THEN RAISE WARNING 'SECURITY RISK: % tables do not have RLS enabled!',
tables_without_rls;
ELSE RAISE NOTICE '✅ All tables have RLS enabled';
END IF;
IF total_policies < total_tables THEN RAISE WARNING 'Some tables may not have policies defined';
ELSE RAISE NOTICE '✅ All tables have policies';
END IF;
END $$;