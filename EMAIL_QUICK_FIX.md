# 🚨 Email Tidak Masuk - Quick Fix

## Kenapa Email Tidak Masuk?

Email system sedang dalam "logging mode" - tidak actually mengirim email.

**Yang perlu dilakukan:**
1. ✅ Setup Resend (email provider)
2. ✅ Uncomment sending code
3. ✅ Disable database triggers

---

## ⚡ Quick Fix (5 menit)

### 1. Daftar Resend (GRATIS)

**Link:** https://resend.com

- Free tier: 100 email/hari
- Tidak perlu kartu kredit
- Dapat API key instant

### 2. Tambah ke `.env.local`

```env
RESEND_API_KEY=re_your_key_here
```

### 3. Edit File

**File:** `app/api/webhooks/email/route.ts`

**Line ~125**, ganti ini:
```typescript
// For development: Just return success
console.log('📧 Email would be sent to:', payload.email);
```

**Dengan ini:**
```typescript
// Send via Resend
const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        from: 'NGEvent <onboarding@resend.dev>',
        to: payload.email,
        subject: subject,
        html: htmlBody
    })
});
```

### 4. Disable Triggers

**Run in Supabase SQL Editor:**
```sql
DROP TRIGGER IF EXISTS on_profile_created_send_welcome_email ON public.profiles;
DROP TRIGGER IF EXISTS on_registration_created_send_email ON public.registrations;
```

### 5. Restart

```bash
npm run dev
```

### 6. Test!

Register untuk event → Check email inbox!

---

## 📚 Detailed Guide

Lihat: `EMAIL_SETUP_RESEND.md`

---

Last Updated: November 7, 2025
