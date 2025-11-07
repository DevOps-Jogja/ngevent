# 🔑 Resend API Key - Troubleshooting

## ❌ Error: "API key is invalid"

```
validation_error: API key is invalid
```

---

## ✅ Quick Fix

### Step 1: Verify API Key Format

API key harus dimulai dengan `re_`

**Valid:**
```
re_abc123xyz...
```

**Invalid:**
```
ABC123XYZ...  ❌ (tidak ada prefix 're_')
sk_test_...   ❌ (ini format Stripe, bukan Resend)
```

### Step 2: Get Correct API Key

1. **Login** ke [resend.com](https://resend.com/login)
2. **Go to:** Dashboard → API Keys
3. **Create new key:**
   - Click "Create API Key"
   - Name: "NGEvent Development"
   - Permission: "Sending access"
   - Domain: "All domains" (or select specific domain)
4. **Copy key** - starts with `re_`

### Step 3: Update `.env.local`

```env
# Replace dengan API key yang baru
RESEND_API_KEY=re_your_actual_key_here
```

**⚠️ Important:**
- No spaces before/after `=`
- No quotes around the value
- Entire key in one line

**Example:**
```env
RESEND_API_KEY=re_abc123def456ghi789jkl
```

### Step 4: Restart Dev Server

```bash
# MUST restart untuk load env vars baru!
# Ctrl+C to stop
npm run dev
```

### Step 5: Verify It Loaded

Check terminal output saat server start:
```
✅ RESEND_API_KEY loaded: re_abc12...
```

**If you see:**
```
⚠️ RESEND_API_KEY is not set
```
→ Check `.env.local` file path and format

**If you see:**
```
❌ RESEND_API_KEY format invalid - should start with "re_"
```
→ Get new API key from Resend dashboard

---

## 🧪 Test API Key Manually

```bash
# Test with curl (replace YOUR_KEY)
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer re_YOUR_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "onboarding@resend.dev",
    "to": "your-email@example.com",
    "subject": "Test Email",
    "html": "<p>Testing Resend API key</p>"
  }'
```

**Success response:**
```json
{"id":"re_123abc..."}
```

**Error response:**
```json
{"message":"API key is invalid"}
```

---

## 🔍 Common Issues

### Issue 1: Key dengan spaces/newlines
```env
# ❌ WRONG
RESEND_API_KEY = re_abc123

# ✅ CORRECT
RESEND_API_KEY=re_abc123
```

### Issue 2: Key dengan quotes
```env
# ❌ WRONG
RESEND_API_KEY="re_abc123"

# ✅ CORRECT
RESEND_API_KEY=re_abc123
```

### Issue 3: File `.env.local` di wrong location
```bash
# MUST be in project root!
/home/atma/Development/python/ngevent/.env.local  ✅

# NOT in subdirectories:
/home/atma/Development/python/ngevent/app/.env.local  ❌
```

### Issue 4: Old API key yang expired/revoked
**Solution:** Generate new key di Resend dashboard

### Issue 5: Server belum di-restart
**Solution:** ALWAYS restart after changing `.env.local`!

---

## 📋 Verification Checklist

- [ ] API key dimulai dengan `re_`
- [ ] No spaces around `=` di `.env.local`
- [ ] No quotes around API key value
- [ ] File `.env.local` ada di project root
- [ ] Dev server sudah di-restart
- [ ] Console shows "✅ RESEND_API_KEY loaded"
- [ ] Test registration → check console logs

---

## 🎯 Expected Console Output

### ✅ Success
```
✅ RESEND_API_KEY loaded: re_abc12...
📧 Sending email to: user@example.com
Subject: Registration Confirmed
🔑 Using Resend API key: re_abc12...
✅ Email sent successfully via Resend: re_xyz789
```

### ❌ API Key Not Set
```
⚠️ RESEND_API_KEY is not set - emails will not be sent
⚠️ RESEND_API_KEY not set - skipping email send
```

### ❌ Invalid Format
```
❌ RESEND_API_KEY format invalid - should start with "re_"
```

### ❌ Invalid Key (from Resend)
```
❌ Resend API error: {"message":"API key is invalid"}
```

---

## 🚀 Next Steps

After fixing API key:

1. **Restart server** (critical!)
2. **Check console** for ✅ messages
3. **Test registration**
4. **Check inbox** for email
5. **Verify in Resend dashboard** → Emails tab

---

Last Updated: November 7, 2025
