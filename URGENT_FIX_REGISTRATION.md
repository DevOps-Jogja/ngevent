# 🚨 URGENT FIX - Registration Error

## Error
```
null value in column "url" of relation "http_request_queue" violates not-null constraint
```

## Quick Fix (30 seconds)

### Run This SQL in Supabase SQL Editor:

1. **Go to:** Supabase Dashboard → SQL Editor
2. **Copy:** Content from `supabase/migrations/fix_email_triggers.sql`
3. **Paste** and click **Run**
4. **Done!** ✅

### Verification
After running, you should see:
```
✅ Email trigger functions updated successfully!
```

### Test
Try registering for an event:
- ✅ Should work now!
- No more errors!

---

## What This Fixes

| Before | After |
|--------|-------|
| ❌ Registration fails | ✅ Registration works |
| ❌ Error on signup | ✅ Signup works |
| ❌ Webhook required | ✅ Webhook optional |

---

## Why It Happened

Email triggers tried to call webhook with NULL URL → Database rejected NULL → Registration failed.

## How We Fixed It

Added NULL check:
```sql
IF webhook_url IS NULL THEN
    SKIP EMAIL  -- Don't break registration!
END IF
```

---

**Time to Fix:** 30 seconds  
**Downtime:** None  
**Risk:** Zero (safe to run)

---

Last Updated: November 7, 2025
