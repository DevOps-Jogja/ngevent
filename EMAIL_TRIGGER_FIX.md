# 🔧 Email Trigger Fix - Registration Error

## ❌ Error Fixed

**Error Message:**
```
null value in column "url" of relation "http_request_queue" violates not-null constraint
```

**When it happened:**
- During user registration for events
- When new user signs up

---

## 🔍 Root Cause

### The Problem
Email system triggers (`send_welcome_email()` and `send_registration_confirmation_email()`) were calling `net.http_post()` with NULL URL when webhook settings were not configured.

### Why It Failed
```sql
-- Old code (broken)
PERFORM net.http_post(
    url := current_setting('app.settings.webhook_url', true),  -- Returns NULL if not set!
    ...
);
```

When `app.settings.webhook_url` is not configured:
1. `current_setting()` returns `NULL`
2. `net.http_post()` receives `NULL` as URL
3. PostgreSQL tries to insert NULL into `http_request_queue.url` (NOT NULL column)
4. ❌ **Constraint violation error!**
5. 💥 **Registration fails!**

---

## ✅ Solution Applied

### 1. **NULL Validation**
Check if webhook URL exists before calling `net.http_post()`:

```sql
-- Get webhook URL
webhook_url := current_setting('app.settings.webhook_url', true);

-- Skip if not configured
IF webhook_url IS NULL OR webhook_url = '' THEN
    RAISE NOTICE 'Email webhook not configured, skipping email';
    RETURN NEW;  -- Continue without error
END IF;
```

### 2. **Error Handling**
Wrap `net.http_post()` in exception handler:

```sql
BEGIN
    PERFORM net.http_post(url := webhook_url, ...);
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Failed to send email: %', SQLERRM;
END;
```

### 3. **Non-Blocking Behavior**
Email failures won't break registration:
- ✅ Registration succeeds even if email fails
- ⚠️ Warning logged for debugging
- 📝 Notice logged if webhook not configured

---

## 📋 Files Updated

### 1. Migration File
**File:** `supabase/migrations/create_email_system.sql`
- ✅ Updated `send_welcome_email()` function
- ✅ Updated `send_registration_confirmation_email()` function
- ✅ Added NULL validation
- ✅ Added error handling

### 2. Fix Migration (For Existing Database)
**File:** `supabase/migrations/fix_email_triggers.sql`
- ✅ Recreates both functions with fixes
- ✅ Can be run on existing database
- ✅ Safe to run multiple times

---

## 🚀 How to Apply Fix

### For Existing Database (Run This!)

```bash
# 1. Go to Supabase Dashboard → SQL Editor
# 2. Open: supabase/migrations/fix_email_triggers.sql
# 3. Copy all content
# 4. Paste and click "Run"
```

**Expected output:**
```
NOTICE: ✅ Email trigger functions updated successfully!
NOTICE: Functions now include:
NOTICE:   - NULL URL validation
NOTICE:   - Proper error handling
NOTICE:   - Non-blocking email failures
NOTICE: 
NOTICE: Registration will now work even if email webhook is not configured.
```

### For New Database

Migration file `create_email_system.sql` already includes the fix.

---

## 🧪 Test After Fix

### Test 1: Registration Without Webhook (Should Work)
```typescript
// Register for an event
// Expected: ✅ Registration succeeds
// Console: "Email webhook not configured, skipping..."
```

### Test 2: Registration With Webhook (Should Work)
```sql
-- First configure webhook URL
ALTER DATABASE postgres SET app.settings.webhook_url = 'https://your-domain.com/api/webhooks/email';
ALTER DATABASE postgres SET app.settings.service_role_key = 'your_service_role_key';

-- Then register
-- Expected: ✅ Registration succeeds + Email sent
```

### Test 3: Verify Function Updates
```sql
-- Check function exists and has error handling
SELECT 
    proname, 
    prosrc 
FROM pg_proc 
WHERE proname IN ('send_welcome_email', 'send_registration_confirmation_email');

-- Should see "IF webhook_url IS NULL" in the source
```

---

## 🎯 Behavior Comparison

### Before Fix ❌

```
User registers for event
    ↓
Trigger fires: send_registration_confirmation_email()
    ↓
current_setting('app.settings.webhook_url') → NULL
    ↓
net.http_post(url := NULL, ...)
    ↓
❌ ERROR: null value violates not-null constraint
    ↓
💥 Registration FAILS
    ↓
User sees error
```

### After Fix ✅

```
User registers for event
    ↓
Trigger fires: send_registration_confirmation_email()
    ↓
webhook_url := current_setting(...) → NULL
    ↓
IF webhook_url IS NULL → TRUE
    ↓
RAISE NOTICE 'Webhook not configured, skipping'
    ↓
RETURN NEW
    ↓
✅ Registration SUCCEEDS
    ↓
User registered successfully!
```

---

## 📝 Configuration (Optional)

To enable actual email sending via webhooks:

### Step 1: Set Webhook URL
```sql
ALTER DATABASE postgres SET app.settings.webhook_url = 'https://your-domain.com/api/webhooks/email';
```

### Step 2: Set Service Role Key
```sql
ALTER DATABASE postgres SET app.settings.service_role_key = 'your_supabase_service_role_key';
```

### Step 3: Verify Settings
```sql
SELECT 
    current_setting('app.settings.webhook_url', true) as webhook_url,
    CASE 
        WHEN current_setting('app.settings.service_role_key', true) IS NOT NULL 
        THEN '✅ Set' 
        ELSE '❌ Not set' 
    END as service_key_status;
```

### Step 4: Test
Register for an event and check:
- ✅ Registration succeeds
- 📧 Email logged in `email_logs` table
- 🌐 HTTP request sent to webhook

---

## 🛡️ Safeguards Added

### 1. **NULL Check**
```sql
IF webhook_url IS NULL OR webhook_url = '' THEN
    RETURN NEW;  -- Skip email but continue
END IF;
```

### 2. **Exception Handling**
```sql
BEGIN
    PERFORM net.http_post(...);
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Email failed: %', SQLERRM;
    -- Don't propagate error
END;
```

### 3. **Graceful Degradation**
- Registration always succeeds
- Email is optional, not critical
- Errors logged for debugging
- No user-facing errors

---

## 🎓 Lessons Learned

### 1. Always Validate External Dependencies
```sql
✅ Check if webhook URL exists before using
❌ Assume webhook is always configured
```

### 2. Use Try-Catch for External Calls
```sql
✅ Wrap net.http_post() in exception handler
❌ Let external call failures break core flow
```

### 3. Core Functionality First
```sql
✅ Registration works even without email
❌ Email required for registration to succeed
```

### 4. Fail Gracefully
```sql
✅ Log warnings, continue processing
❌ Throw errors, stop everything
```

---

## 📊 Impact

| Aspect | Before | After |
|--------|--------|-------|
| **Registration Success** | ❌ Fails if webhook not set | ✅ Always succeeds |
| **Email Sending** | ❌ Crashes on NULL | ✅ Skips gracefully |
| **User Experience** | ❌ Error message | ✅ Smooth registration |
| **Error Handling** | ❌ None | ✅ Comprehensive |
| **Logging** | ❌ Silent failure | ✅ Clear notices/warnings |

---

## ✅ Checklist

After applying fix, verify:

- [ ] Run `fix_email_triggers.sql` in Supabase SQL Editor
- [ ] See success notice in query results
- [ ] Test event registration (should work!)
- [ ] Check PostgreSQL logs for notices (not errors)
- [ ] Optional: Configure webhook for actual email sending
- [ ] Optional: Test with configured webhook

---

## 🎉 Result

**Before:**
```
❌ null value in column "url" violates not-null constraint
💥 Registration fails
😞 User can't register
```

**After:**
```
✅ Registration succeeds
📧 Email skipped (or sent if configured)
😊 User registered successfully
```

---

**Status:** ✅ Fixed  
**Breaking Changes:** None  
**User Impact:** Positive (registration now works!)  
**Email System:** Optional (works with or without configuration)

Last Updated: November 7, 2025
