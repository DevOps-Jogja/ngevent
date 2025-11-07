# 📧 Email Setup Guide - Make Emails Work!

## 🚨 Current Status

**Emails are NOT being sent** - System is in "logging mode" only.

**Why?**
- ✅ Code is ready
- ✅ Resend package installed
- ❌ Resend API not configured
- ❌ Email sending code commented out

---

## ✅ Quick Setup (5 minutes)

### Step 1: Get Resend API Key (2 minutes)

1. **Sign up** at [resend.com](https://resend.com)
2. **Create account** (free tier: 100 emails/day, 3,000/month)
3. **Verify domain** OR use Resend's test domain
4. **Get API key**: Dashboard → API Keys → Create API Key
5. **Copy the key** (starts with `re_`)

### Step 2: Add to Environment Variables (30 seconds)

Add to `.env.local`:
```env
# Existing vars
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Add these:
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=re_your_resend_key_here  # ← ADD THIS!
```

### Step 3: Uncomment Email Sending Code (1 minute)

Edit `app/api/webhooks/email/route.ts`:

**Find this section (around line 125):**
```typescript
// For development: Just return success
// In production: Integrate with email service (Resend, SendGrid, etc.)
console.log('📧 Email would be sent to:', payload.email);
console.log('Subject:', subject);
console.log('Type:', payload.type);

// If you want to use an external email service, uncomment and configure:
/*
const response = await fetch('https://api.resend.com/emails', {
```

**Replace with:**
```typescript
// Send email using Resend
console.log('📧 Sending email to:', payload.email);
console.log('Subject:', subject);
console.log('Type:', payload.type);

try {
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
            from: 'NGEvent <onboarding@resend.dev>',  // Use your domain after verification
            to: payload.email,
            subject: subject,
            html: htmlBody,
            text: textBody
        })
    });

    const resendData = await response.json();

    if (!response.ok) {
        throw new Error(`Resend API error: ${JSON.stringify(resendData)}`);
    }

    console.log('✅ Email sent via Resend:', resendData);
} catch (emailError: any) {
    console.error('❌ Failed to send via Resend:', emailError.message);
    // Log to email_logs as failed
    await supabaseAdmin!.from('email_logs').update({
        status: 'failed',
        error_message: emailError.message
    }).eq('recipient_email', payload.email).order('created_at', { ascending: false }).limit(1);
}
```

### Step 4: Disable Database Triggers (30 seconds)

Run in Supabase SQL Editor:
```bash
# Copy content from: supabase/migrations/disable_email_triggers.sql
# Paste in SQL Editor
# Click "Run"
```

### Step 5: Restart Dev Server (10 seconds)

```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 6: Test! (1 minute)

1. **Register for an event**
2. **Check console** - should see: `✅ Email sent via Resend`
3. **Check your inbox** - email should arrive!

---

## 🎯 Complete Code Example

Create new file: `app/api/webhooks/email/route-with-resend.ts` (reference)

```typescript
// After getting template and replacing variables...

// Send email using Resend
try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
            from: 'NGEvent <onboarding@resend.dev>',
            to: payload.email,
            subject: subject,
            html: htmlBody,
            text: textBody
        })
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
        console.error('Resend error:', resendData);
        throw new Error(`Resend API error: ${JSON.stringify(resendData)}`);
    }

    console.log('✅ Email sent successfully via Resend:', resendData.id);

    // Update log status to sent
    await supabaseAdmin!
        .from('email_logs')
        .update({ 
            status: 'sent',
            metadata: { resend_id: resendData.id }
        })
        .eq('recipient_email', payload.email)
        .order('created_at', { ascending: false })
        .limit(1);

} catch (emailError: any) {
    console.error('❌ Failed to send email:', emailError);
    
    // Update log status to failed
    await supabaseAdmin!
        .from('email_logs')
        .update({ 
            status: 'failed',
            error_message: emailError.message 
        })
        .eq('recipient_email', payload.email)
        .order('created_at', { ascending: false })
        .limit(1);
}
```

---

## 📋 Checklist

### Setup Checklist
- [ ] Sign up for Resend account
- [ ] Get API key from Resend dashboard
- [ ] Add `RESEND_API_KEY` to `.env.local`
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`
- [ ] Add `NEXT_PUBLIC_APP_URL` to `.env.local`
- [ ] Uncomment Resend code in `route.ts`
- [ ] Run `disable_email_triggers.sql` in Supabase
- [ ] Restart dev server
- [ ] Test registration
- [ ] Check inbox for email

### Verification Checklist
- [ ] Console shows: `✅ Email sent via Resend`
- [ ] Email arrives in inbox
- [ ] `email_logs` table shows status='sent'
- [ ] No errors in console

---

## 🧪 Testing

### Test Welcome Email
```bash
1. Sign up with new Google account
2. Check console for: "✅ Email sent via Resend"
3. Check email inbox for welcome email
```

### Test Registration Email
```bash
1. Register for an event
2. Check console for: "✅ Email sent via Resend"
3. Check email inbox for confirmation email
```

### Verify in Database
```sql
-- Check email logs
SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 10;

-- Should show status='sent' for successful emails
```

---

## 🎨 Customize Email From Address

### Option 1: Use Resend Test Domain (Immediate)
```typescript
from: 'NGEvent <onboarding@resend.dev>'
```
**Pros:** Works immediately  
**Cons:** Shows "via resend.dev" in inbox

### Option 2: Use Your Domain (After Verification)
```typescript
from: 'NGEvent <noreply@yourdomain.com>'
```

**Setup:**
1. Go to Resend Dashboard → Domains
2. Add your domain
3. Add DNS records (SPF, DKIM)
4. Wait for verification (usually 5-10 minutes)
5. Update `from` address in code

---

## 🐛 Troubleshooting

### Email Not Received

**Check 1: Console Logs**
```bash
# Should see:
✅ Email sent via Resend: re_abc123xyz
```

**Check 2: Resend Dashboard**
- Go to Resend → Emails
- Should see sent email with status

**Check 3: Spam Folder**
- Check spam/junk folder
- Mark as "Not Spam"

**Check 4: Email Logs**
```sql
SELECT * FROM email_logs WHERE status = 'failed';
```

### API Key Invalid

**Error:**
```
Resend API error: {"message":"Invalid API key"}
```

**Fix:**
1. Check API key in `.env.local`
2. Make sure it starts with `re_`
3. Regenerate key in Resend dashboard if needed
4. Restart dev server

### Template Not Found

**Error:**
```
Email template not found (database not initialized)
```

**Fix:**
```bash
# Run email system migration
# In Supabase SQL Editor:
# supabase/migrations/create_email_system.sql
```

---

## 💰 Pricing

### Resend Free Tier
- ✅ 100 emails per day
- ✅ 3,000 emails per month
- ✅ Unlimited domains
- ✅ All features

Perfect for development and small apps!

### When to Upgrade
- Need more than 3,000 emails/month
- Paid plans start at $20/month for 50,000 emails

---

## 🚀 Production Checklist

Before going to production:

- [ ] Verify your own domain in Resend
- [ ] Update `from` address to use your domain
- [ ] Set production `NEXT_PUBLIC_APP_URL`
- [ ] Test emails in production environment
- [ ] Monitor email logs for failures
- [ ] Set up email analytics (Resend provides this)

---

## 📖 Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend Email Templates](https://resend.com/docs/send-with-nextjs)
- [Domain Verification Guide](https://resend.com/docs/dashboard/domains/introduction)

---

## ✅ Summary

| Step | Task | Time |
|------|------|------|
| 1 | Sign up for Resend | 2 min |
| 2 | Add API key to .env.local | 30 sec |
| 3 | Uncomment Resend code | 1 min |
| 4 | Disable database triggers | 30 sec |
| 5 | Restart dev server | 10 sec |
| 6 | Test! | 1 min |

**Total Time:** ~5 minutes

**Result:** ✅ Working email system!

---

Last Updated: November 7, 2025
