# 🔧 Email System Troubleshooting

## ❌ Error: "Registration error: {}"

### What's Happening?
- ✅ **Registration WORKS** - User successfully registered
- ⚠️ **Email NOT sent** - Email system not configured yet
- 📝 **Empty error** - Graceful fallback (won't break app)

### Root Cause
Email system needs 3 things to work:
1. ✅ Code files (already created)
2. ❌ Database tables (need to run migration)
3. ❌ Environment variables (need to configure)

---

## ✅ Solution: 3-Step Setup

### Step 1: Get Service Role Key (30 seconds)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to: **Settings** → **API** → **Project API Keys**
4. Find **service_role** key (the secret one, NOT anon key)
5. Click **Reveal** and copy it

⚠️ **IMPORTANT:** Never commit this key to git!

---

### Step 2: Add Environment Variables (30 seconds)

Create or update `.env.local` in project root:

```env
# Existing Supabase keys
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Add these NEW lines:
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: For actual email sending (later)
# RESEND_API_KEY=your_resend_key_here
```

---

### Step 3: Run Database Migration (1 minute)

#### Option A: Supabase Dashboard (Easiest)
1. Go to Supabase Dashboard → **SQL Editor**
2. Click **New Query**
3. Open file: `supabase/migrations/create_email_system.sql`
4. **Copy ALL content** (Ctrl+A, Ctrl+C)
5. **Paste** into SQL Editor
6. Click **Run** (bottom right)
7. ✅ Should see: "Success. No rows returned"

#### Option B: Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push
```

---

### Step 4: Restart Dev Server (10 seconds)

```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## 🧪 Verify It Works

### Test 1: Check Database Tables

Run in Supabase SQL Editor:
```sql
-- Should return 4 templates
SELECT * FROM email_templates;

-- Should exist (empty for now)
SELECT * FROM email_logs;
```

### Test 2: Check Console Logs

Register for an event and look for:
```
📧 Attempting to send registration confirmation email...
✅ Registration email sent successfully
```

OR (if still not configured):
```
⚠️ Email not sent (system not configured): ...
```

---

## 📊 What Each Status Means

| Console Message | What It Means | Action Needed |
|----------------|---------------|---------------|
| `✅ Registration email sent successfully` | **Perfect!** Email logged | Configure email provider to actually send |
| `⚠️ Email not sent (system not configured)` | Database not initialized | Run migration (Step 3) |
| `⚠️ SUPABASE_SERVICE_ROLE_KEY missing` | Env var not set | Add to `.env.local` (Step 2) |
| `⚠️ Email template not found` | Migration not run | Run SQL migration (Step 3) |
| `⚠️ Email system warning: Please run database migration` | Tables missing | Run SQL migration (Step 3) |

---

## 🚀 Next Level: Actually Send Emails

Right now, emails are only **logged to database** (not actually sent).

To send real emails:

### Option 1: Resend (Recommended - Easiest)

```bash
npm install resend
```

1. Sign up at [resend.com](https://resend.com) (free tier: 100 emails/day)
2. Get API key
3. Add to `.env.local`:
   ```env
   RESEND_API_KEY=re_your_key_here
   ```
4. Edit `app/api/webhooks/email/route.ts` and uncomment Resend code (around line 125)

### Option 2: SendGrid

```bash
npm install @sendgrid/mail
```

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Get API key
3. Add to `.env.local`:
   ```env
   SENDGRID_API_KEY=SG.your_key_here
   ```
4. Use SendGrid example in `EMAIL_SYSTEM.md`

### Option 3: Supabase SMTP (Built-in)

1. Supabase Dashboard → **Settings** → **Auth** → **Email**
2. Configure SMTP settings
3. Emails auto-send via Supabase

---

## 🐛 Still Not Working?

### Check 1: Environment Variables Loaded?
```typescript
// Add to app/api/webhooks/email/route.ts (top of file)
console.log('ENV CHECK:', {
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL
});
```

### Check 2: Tables Exist?
```sql
-- Run in Supabase SQL Editor
\dt email*

-- Should show:
-- email_templates
-- email_logs
```

### Check 3: Triggers Exist?
```sql
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%email%';
```

### Check 4: Service Role Key Valid?
Test with:
```bash
curl https://your-project.supabase.co/rest/v1/email_templates \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

---

## 💡 Pro Tips

### Tip 1: Don't Worry About Empty Errors
The system is designed to **fail gracefully**. Registration works even if email fails!

### Tip 2: Email Logging is Enough for Development
You don't need actual email sending during development. Just check `email_logs` table.

### Tip 3: Test Email Templates
```sql
-- View welcome template
SELECT subject, html_body FROM email_templates WHERE template_type = 'welcome';

-- Test variable replacement
SELECT REPLACE(subject, '{{user_name}}', 'John Doe') as test_subject
FROM email_templates WHERE template_type = 'welcome';
```

### Tip 4: Monitor Email Logs
```sql
-- Recent emails
SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 10;

-- Failed emails
SELECT * FROM email_logs WHERE status = 'failed';

-- Success rate
SELECT 
    status, 
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM email_logs
GROUP BY status;
```

---

## 📞 Quick Help

| Issue | File to Check | What to Look For |
|-------|---------------|------------------|
| Empty error `{}` | `.env.local` | Has `SUPABASE_SERVICE_ROLE_KEY`? |
| Template not found | Supabase SQL Editor | Run migration SQL |
| Email not logged | Console logs | Look for warning messages |
| Function not found | `lib/email.ts` | File exists and exports functions? |
| Build error | Terminal | TypeScript errors? |

---

## ✅ Checklist

Use this to verify everything:

- [ ] `.env.local` has `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `.env.local` has `NEXT_PUBLIC_APP_URL`
- [ ] SQL migration run successfully
- [ ] `email_templates` table has 4 rows
- [ ] `email_logs` table exists
- [ ] Dev server restarted after adding env vars
- [ ] Console shows `📧 Attempting to send...` messages
- [ ] Registration still works (most important!)

---

**Last Updated:** November 7, 2025  
**Status:** Email logging works ✅ | Actual sending needs provider setup ⚠️
