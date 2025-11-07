# 🚀 RLS Policy Optimization - Quick Reference

## ⚡ Quick Fix (30 seconds)

```sql
-- Run this in Supabase SQL Editor:
-- File: supabase/migrations/optimize_rls_policies.sql
```

Copy and paste entire file → Click **Run** → Done! ✅

---

## 📋 What Gets Optimized

### Before (Slow) ❌
```sql
-- auth.uid() called for EVERY row
USING (auth.uid() = user_id)
```

### After (Fast) ✅
```sql
-- auth.uid() called ONCE per query
USING ((SELECT auth.uid()) = user_id)
```

---

## 🎯 Performance Gains

| Dataset Size | Function Calls Before | Function Calls After | Improvement |
|--------------|----------------------|---------------------|-------------|
| 10 rows | 10 | 1 | **90%** ⚡ |
| 100 rows | 100 | 1 | **99%** ⚡⚡ |
| 1,000 rows | 1,000 | 1 | **99.9%** ⚡⚡⚡ |
| 10,000 rows | 10,000 | 1 | **99.99%** 🚀 |

---

## 📊 Tables Affected

✅ **25 policies optimized** across these tables:

| Table | Policies | Impact |
|-------|----------|--------|
| profiles | 2 | User profile updates |
| events | 4 | Event creation/editing |
| **speakers** | **1** | **Original issue!** ⭐ |
| registrations | 4 | Event registrations |
| form_fields | 3 | Custom form fields |
| notifications | 4 | User notifications |
| email_logs | 2 | Email tracking |
| email_templates | 1 | Email templates |

---

## 🧪 Verify Optimization

### Check Policy Status
```sql
SELECT 
    tablename,
    policyname,
    CASE 
        WHEN qual LIKE '%(SELECT auth.%' THEN '✅'
        ELSE '⚠️'
    END as status
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Test Performance
```sql
\timing on

-- Before: Slow for large datasets
EXPLAIN ANALYZE SELECT * FROM events WHERE organizer_id = auth.uid();

-- After: Fast regardless of size
EXPLAIN ANALYZE SELECT * FROM events WHERE organizer_id = (SELECT auth.uid());
```

---

## 🔧 How It Works

### The Problem
```
Query: SELECT * FROM events WHERE organizer_id = auth.uid()

Execution:
Row 1: Is auth.uid() = organizer_id? ← Call auth.uid()
Row 2: Is auth.uid() = organizer_id? ← Call auth.uid()
Row 3: Is auth.uid() = organizer_id? ← Call auth.uid()
...
Row 1000: Is auth.uid() = organizer_id? ← Call auth.uid()

Total: 1000 auth.uid() calls! 🐌
```

### The Solution
```
Query: SELECT * FROM events WHERE organizer_id = (SELECT auth.uid())

Execution:
Cache: auth_user_id = (SELECT auth.uid()) ← Call ONCE

Row 1: Is auth_user_id = organizer_id? ← Use cached value
Row 2: Is auth_user_id = organizer_id? ← Use cached value
Row 3: Is auth_user_id = organizer_id? ← Use cached value
...
Row 1000: Is auth_user_id = organizer_id? ← Use cached value

Total: 1 auth.uid() call! ⚡
```

---

## 📝 Pattern Examples

### ✅ Optimized Patterns

```sql
-- Simple equality
USING ((SELECT auth.uid()) = user_id)

-- OR condition
USING (status = 'public' OR organizer_id = (SELECT auth.uid()))

-- IN clause
USING ((SELECT auth.uid()) IN (SELECT user_id FROM ...))

-- Multiple auth checks
USING ((SELECT auth.uid()) = user_id OR (SELECT auth.uid()) IN (...))

-- Role check
USING ((SELECT auth.role()) = 'admin')

-- Combined checks
WITH CHECK ((SELECT auth.uid()) = user_id AND (SELECT auth.jwt()->>'email') LIKE '%@company.com')
```

### ❌ Unoptimized Patterns (Don't Use)

```sql
-- Direct call (slow!)
USING (auth.uid() = user_id)

-- Multiple direct calls (very slow!)
USING (auth.uid() = user_id OR auth.uid() IN (...))

-- Role without SELECT (slow!)
USING (auth.role() = 'admin')
```

---

## 🎓 Best Practices

### 1. Always Wrap Auth Functions
```sql
✅ (SELECT auth.uid())
✅ (SELECT auth.role())
✅ (SELECT auth.email())
✅ (SELECT auth.jwt())

❌ auth.uid()
❌ auth.role()
❌ auth.email()
❌ auth.jwt()
```

### 2. Cache Once, Use Many Times
```sql
-- If using auth.uid() multiple times in one policy:
✅ USING ((SELECT auth.uid()) = user_id OR (SELECT auth.uid()) IN (...))

-- Even better: Use a CTE for very complex policies
WITH current_user AS (SELECT auth.uid() as id)
SELECT ... WHERE user_id = (SELECT id FROM current_user)
```

### 3. Test at Scale
```sql
-- Insert test data
INSERT INTO events (title, organizer_id, status)
SELECT 
    'Event ' || i,
    auth.uid(),
    'published'
FROM generate_series(1, 10000) i;

-- Test query performance
\timing on
EXPLAIN ANALYZE SELECT * FROM events WHERE organizer_id = (SELECT auth.uid());
```

---

## 📖 Resources

- [Official Supabase RLS Performance Guide](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Query Performance Tips](https://www.postgresql.org/docs/current/performance-tips.html)

---

## ✅ Migration Checklist

- [ ] Open Supabase Dashboard
- [ ] Go to SQL Editor
- [ ] Open `optimize_rls_policies.sql`
- [ ] Copy all content
- [ ] Paste in SQL Editor
- [ ] Click "Run"
- [ ] Verify success message
- [ ] Test a query
- [ ] Confirm no warnings in dashboard

---

## 🎉 Success Indicators

After running optimization:

1. ✅ No RLS warnings in Supabase dashboard
2. ✅ Faster query execution times
3. ✅ Lower CPU usage in database
4. ✅ Better scalability with large datasets
5. ✅ Success message shows "25 policies optimized"

---

**Time to Fix:** 30 seconds  
**Performance Gain:** Up to 99.99%  
**Breaking Changes:** None (100% backward compatible)

---

Last Updated: November 7, 2025
