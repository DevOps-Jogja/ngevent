# Ngevent - Quick Start Guide

## 🚀 Quick Setup (5 menit)

### 1. Clone & Install

\`\`\`bash
git clone <repository-url>
cd ngevent
npm install
\`\`\`

### 2. Setup Supabase

1. Buat project baru di [Supabase](https://supabase.com)
2. Copy Project URL dan Anon Key
3. Buat file \`.env.local\`:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
\`\`\`

### 3. Setup Database

1. Buka Supabase Dashboard → SQL Editor
2. Copy paste isi file \`supabase/migrations/001_initial_schema.sql\`
3. Run query

### 4. Setup Google OAuth

#### A. Google Cloud Console
1. Buka [Google Cloud Console](https://console.cloud.google.com)
2. Buat project baru atau pilih existing
3. Enable "Google+ API"
4. Credentials → Create Credentials → OAuth 2.0 Client ID
5. Application Type: Web Application
6. Authorized redirect URIs: \`https://xxxxx.supabase.co/auth/v1/callback\`
7. Copy Client ID dan Client Secret

#### B. Supabase Dashboard
1. Authentication → Providers → Google
2. Enable Google
3. Paste Client ID dan Client Secret
4. Save

### 5. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Buka [http://localhost:3000](http://localhost:3000)

## ✅ Verification Checklist

- [ ] Homepage loads correctly
- [ ] Can navigate to /events
- [ ] Can navigate to /calendar
- [ ] Click "Sign In" redirects to /auth/login
- [ ] Google login button appears
- [ ] Can login with Google (creates profile in database)
- [ ] After login, redirected to /dashboard
- [ ] Can switch between Participant and Organizer role
- [ ] As Organizer: Can create new event
- [ ] As Participant: Can browse and register for events

## 📝 Test Data

### Create Test Event

1. Login dengan Google
2. Switch role ke "Organizer"
3. Click "Create Event"
4. Fill form:
   - Title: "Workshop Web Development"
   - Description: "Belajar membuat website dari awal"
   - Start Date: Tomorrow at 10:00
   - End Date: Tomorrow at 16:00
   - Location: "Zoom Meeting"
   - Category: "Technology"
   - Capacity: 50
   - Status: "Published"
5. Add custom form field:
   - Field Name: "Phone Number"
   - Field Type: "Text"
   - Required: Yes
6. Click "Create Event"

### Register for Event

1. Logout (atau buka incognito)
2. Login dengan Google account lain
3. Browse to /events
4. Click event yang baru dibuat
5. Fill registration form
6. Click "Daftar Sekarang"
7. Should see success message

## 🐛 Common Issues

### Issue: Google Login tidak bekerja

**Solution:**
- Check Google OAuth credentials
- Verify redirect URL matches exactly
- Clear browser cache
- Check Supabase logs

### Issue: "Profile not found"

**Solution:**
- Check if trigger \`on_auth_user_created\` is created
- Manually insert profile:
  \`\`\`sql
  INSERT INTO profiles (id, full_name)
  VALUES ('user-uuid', 'Test User');
  \`\`\`

### Issue: Cannot create event

**Solution:**
- Check if user role is "organizer"
- Check RLS policies in Supabase
- Check browser console for errors

## 🎯 Next Steps

1. ✅ Customize landing page
2. ✅ Add event images
3. ✅ Setup email notifications (see docs/EMAIL_SETUP.md)
4. ✅ Deploy to Cloudflare Pages
5. ✅ Add custom domain

## 📚 Documentation

- [Full README](../README.md)
- [Email Setup](EMAIL_SETUP.md)
- [PRD](../PRD.md)
- [Deployment Guide](DEPLOYMENT.md) (coming soon)

## 💡 Tips

- Use Chrome DevTools to debug issues
- Check Supabase Logs for backend errors
- Use React DevTools to inspect component state
- Test on mobile devices for responsive design

## 🔗 Useful Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TailGrids Components](https://tailgrids.com/)

---

Need help? Create an issue or contact support@ngevent.com
