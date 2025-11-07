# 🚀 Production Deployment Guide - Email System Fix

## ❌ Masalah
Email tidak bekerja di production meskipun berfungsi di local development.

## 🔍 Root Cause
1. **Environment variables dari `.env.local` tidak ter-load di production**
2. **NEXT_PUBLIC_APP_URL masih localhost** - email links tidak valid
3. **No error visibility** - sulit diagnosa masalah

## ✅ Solusi Step-by-Step

### Step 1: Set Environment Variables di Hosting Platform

#### **Vercel** (Recommended)
1. Go to: [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. **Settings** → **Environment Variables**
4. Add these variables untuk **Production**:

```bash
# REQUIRED - Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# REQUIRED - Resend Email
RESEND_API_KEY=re_your_actual_api_key_here

# REQUIRED - Production URL
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

5. **Save** → **Redeploy** (or trigger new deployment)

**Shortcut:**
```bash
# Install Vercel CLI
npm i -g vercel

# Set env vars via CLI
vercel env add RESEND_API_KEY production
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Redeploy
vercel --prod
```

---

#### **Netlify**
1. Go to: [Netlify Dashboard](https://app.netlify.com/)
2. Select your site
3. **Site Settings** → **Environment Variables** → **Edit Variables**
4. Add all required variables (same as Vercel list above)
5. **Save** → **Trigger Deploy** (or push to trigger auto-deploy)

**Shortcut:**
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Set env vars
netlify env:set RESEND_API_KEY re_your_api_key
netlify env:set NEXT_PUBLIC_APP_URL https://your-site.netlify.app
netlify env:set SUPABASE_SERVICE_ROLE_KEY your_key

# Trigger deploy
netlify deploy --prod
```

---

#### **Railway**
1. Go to: [Railway Dashboard](https://railway.app/dashboard)
2. Select your project
3. **Variables** tab
4. Add each variable
5. Save (auto-redeploys)

---

#### **Render**
1. Go to: [Render Dashboard](https://dashboard.render.com/)
2. Select your web service
3. **Environment** tab
4. Add variables
5. Save (auto-redeploys)

---

### Step 2: Verify Environment Variables

After deployment, check logs:

#### Vercel:
```bash
vercel logs --follow
```

Look for:
```
📝 Environment Variables Check:
NEXT_PUBLIC_SUPABASE_URL: ✅ Set
SUPABASE_SERVICE_ROLE_KEY: ✅ Set
RESEND_API_KEY: ✅ Set (re_dWZWN...)
NODE_ENV: production
✅ RESEND_API_KEY loaded and valid
```

If you see:
```
🚨 CRITICAL: Emails disabled in production! Set RESEND_API_KEY
```
→ Environment variable not set properly!

#### Netlify:
1. **Site Overview** → **Functions** → Click your API function
2. Check function logs

---

### Step 3: Update Resend Email Domain (Optional but Recommended)

Default email from: `onboarding@resend.dev` (limited to 100/day)

**To use your own domain:**

1. Go to: [Resend Dashboard](https://resend.com/domains)
2. **Add Domain** → Enter your domain (e.g., `yourdomain.com`)
3. Add DNS records:
   ```
   Type: TXT
   Name: @
   Value: (provided by Resend)
   
   Type: MX
   Name: @
   Value: (provided by Resend)
   ```
4. Wait for verification (5-10 minutes)
5. Update `route.ts`:

```typescript
// Change from:
from: 'NGEvent <onboarding@resend.dev>'

// To:
from: 'NGEvent <noreply@yourdomain.com>'
```

---

### Step 4: Test Email in Production

1. **Deploy** your changes
2. **Visit** your production site
3. **Register** a new user account
4. **Check email** - should receive welcome email
5. **Register** for an event
6. **Check email** - should receive registration confirmation

#### If email not received:

**Check 1: Server Logs**
```bash
# Vercel
vercel logs --follow

# Look for:
🔄 Updating registration status: { ... }
📧 Sending email to: user@example.com
✅ Email sent successfully via Resend: 78eaf292-...
```

**Check 2: Resend Dashboard**
1. Go to: [Resend Logs](https://resend.com/emails)
2. Check if email appears
3. Click to see delivery status

**Check 3: Browser Console**
```javascript
// Open DevTools → Console
// Register for event
// Check for errors like:
❌ Email API returned error: { error: "..." }
```

---

### Step 5: Common Issues & Fixes

#### Issue 1: "RESEND_API_KEY is not set"
**Cause:** Environment variable not added to hosting platform

**Fix:**
1. Double-check variable name (exact case-sensitive): `RESEND_API_KEY`
2. Verify value starts with `re_`
3. Redeploy after adding variable

#### Issue 2: "Email links point to localhost"
**Cause:** `NEXT_PUBLIC_APP_URL` not set

**Fix:**
1. Set `NEXT_PUBLIC_APP_URL=https://your-production-domain.com`
2. Redeploy
3. Clear browser cache

#### Issue 3: "403 Forbidden" from Resend
**Cause:** Invalid API key

**Fix:**
1. Generate new API key at [Resend API Keys](https://resend.com/api-keys)
2. Update env variable
3. Redeploy

#### Issue 4: "Domain not verified"
**Cause:** Trying to send from unverified domain

**Fix:**
- Use `onboarding@resend.dev` for testing
- Or complete domain verification steps above

#### Issue 5: "Rate limit exceeded"
**Cause:** Free tier limit (100 emails/day)

**Fix:**
- Upgrade Resend plan
- Or use verified domain (increases to 3,000/month free)

---

## 📊 Monitoring & Logging

### Production Checklist:
- [ ] All env vars set in hosting platform
- [ ] Deployment successful
- [ ] Server logs show env vars loaded
- [ ] Test welcome email received
- [ ] Test registration email received
- [ ] Email links point to production domain
- [ ] Resend dashboard shows sent emails
- [ ] No errors in browser console

### Server Logs to Monitor:
```bash
# Good logs:
📝 Environment Variables Check: ✅
🌐 Using base URL for emails: https://your-domain.com
📧 Sending email to: user@example.com
✅ Email sent successfully via Resend: abc123

# Bad logs:
❌ RESEND_API_KEY is not set
🚨 CRITICAL: Emails disabled in production!
❌ Email API returned error: { error: "Forbidden" }
```

---

## 🔐 Security Notes

### DO NOT:
- ❌ Commit `.env.local` to git
- ❌ Share API keys publicly
- ❌ Use same API key for dev & production
- ❌ Hardcode secrets in source code

### DO:
- ✅ Use environment variables
- ✅ Rotate API keys periodically
- ✅ Use different keys for staging/production
- ✅ Monitor email logs for abuse
- ✅ Set up Resend webhooks for delivery tracking

---

## 🧪 Testing Checklist

### Local Development:
```bash
# 1. Create .env.local with all variables
cp .env.production.example .env.local

# 2. Fill in actual values
# 3. Start dev server
npm run dev

# 4. Test emails
# - Register new user → check welcome email
# - Register event → check confirmation email
```

### Staging/Production:
```bash
# 1. Set env vars in hosting platform
# 2. Deploy
npm run build
# or: git push (for auto-deploy)

# 3. Test live
# - Visit production URL
# - Complete registration flow
# - Verify emails received
# - Check Resend dashboard
```

---

## 📖 Quick Reference

### Required Environment Variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
RESEND_API_KEY=re_xxxx
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Deployment Commands:
```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod

# Manual
npm run build
npm start
```

### Verification URLs:
- **Resend Dashboard:** https://resend.com/emails
- **Supabase Dashboard:** https://app.supabase.com/project/_/editor
- **Email Logs (DB):** Check `email_logs` table

---

**Last Updated:** November 7, 2025
**Status:** ✅ Ready for Production
**Priority:** CRITICAL - Email system required for user onboarding
