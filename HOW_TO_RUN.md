# 🚀 Cara Menjalankan Ngevent - Panduan Singkat

## 🎯 Yang Harus Dilakukan

### Langkah 1: Setup Supabase (WAJIB!)

Website ini memerlukan Supabase untuk backend. Ikuti langkah berikut:

#### 1.1 Buat Project Supabase
- Buka https://supabase.com
- Klik "New Project"
- Isi nama project (contoh: "ngevent")
- Pilih password database
- Pilih region terdekat
- Klik "Create Project" dan tunggu ~2 menit

#### 1.2 Setup Database
1. Buka project Anda di Supabase Dashboard
2. Klik "SQL Editor" di sidebar
3. Klik "New Query"
4. Buka file `supabase/migrations/001_initial_schema.sql` di folder project
5. Copy semua isi file tersebut
6. Paste ke SQL Editor di Supabase
7. Klik "Run" atau tekan F5
8. Tunggu sampai selesai (akan muncul "Success")

#### 1.3 Setup Google OAuth

**Di Google Cloud Console:**
1. Buka https://console.cloud.google.com
2. Buat project baru atau pilih existing
3. Buka menu "APIs & Services" → "Credentials"
4. Klik "Create Credentials" → "OAuth 2.0 Client ID"
5. Pilih "Web application"
6. Isi nama (contoh: "Ngevent OAuth")
7. Di "Authorized redirect URIs", tambahkan:
   ```
   https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback
   ```
   (Ganti YOUR-PROJECT-REF dengan ref dari Supabase project URL Anda)
8. Klik "Create"
9. **SIMPAN** Client ID dan Client Secret

**Di Supabase Dashboard:**
1. Buka Supabase project Anda
2. Klik "Authentication" di sidebar
3. Klik tab "Providers"
4. Scroll ke "Google"
5. Enable toggle Google
6. Paste Client ID dan Client Secret dari Google
7. Klik "Save"

#### 1.4 Dapatkan Supabase Credentials

1. Di Supabase Dashboard, klik "Settings" (icon gear)
2. Klik "API" di sidebar
3. Copy dua nilai ini:
   - **Project URL** (contoh: https://xxxxx.supabase.co)
   - **anon public** key (API key panjang)

### Langkah 2: Configure Environment Variables

1. Buka file `.env.local` di root folder project
2. Replace nilai placeholder dengan credentials Supabase Anda:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**PENTING:** Jangan commit file ini ke Git!

### Langkah 3: Install Dependencies (Jika Belum)

```bash
npm install
```

### Langkah 4: Run Development Server

```bash
npm run dev
```

Website akan berjalan di: **http://localhost:3000**

## ✅ Test Apakah Berfungsi

1. **Buka browser** → http://localhost:3000
2. **Klik "Sign In"** atau "Get Started"
3. **Klik "Masuk dengan Google"**
4. **Login** dengan Google account Anda
5. Jika berhasil → redirect ke **/dashboard** ✅

## 🐛 Troubleshooting

### Error: "supabaseUrl is required"
**Solusi:** 
- Check apakah `.env.local` sudah dibuat
- Check apakah values sudah diganti (bukan placeholder lagi)
- Restart development server (`Ctrl+C` lalu `npm run dev`)

### Error: "Invalid login credentials"
**Solusi:**
- Check apakah Google OAuth sudah di-setup di Supabase
- Check redirect URI di Google Console
- Check apakah Client ID & Secret sudah benar

### Google Login tidak muncul
**Solusi:**
- Check browser console untuk errors
- Check apakah Google provider di-enable di Supabase
- Clear browser cache dan cookies

### Database Error / Table not found
**Solusi:**
- Check apakah SQL migration sudah di-run
- Buka Supabase → Table Editor
- Pastikan ada tables: profiles, events, registrations, form_fields

## 📖 Dokumentasi Lengkap

- **Setup Complete:** Lihat `SETUP_COMPLETE.md`
- **Quick Start:** Lihat `docs/QUICKSTART.md`
- **Full Docs:** Lihat `README.md`
- **PRD:** Lihat `PRD.md`

## 🎯 Apa yang Bisa Dilakukan?

Setelah login berhasil:

### Sebagai Participant:
1. Browse events di `/events`
2. Lihat calendar di `/calendar`
3. Register ke event yang tersedia
4. Lihat registered events di dashboard

### Sebagai Organizer:
1. Buka `/dashboard`
2. Klik toggle "Organizer"
3. Klik "Create Event"
4. Buat event dengan custom form
5. Publish event
6. Lihat list event yang dibuat

## 🚀 Deploy ke Production

Ketika siap deploy:

1. **Cloudflare Pages:**
   - Connect GitHub repo
   - Build command: `npm run build`
   - Add environment variables
   - Deploy!

2. **Update URLs:**
   - Update `NEXT_PUBLIC_SITE_URL` di Cloudflare
   - Update redirect URI di Google Console
   - Update allowed URLs di Supabase

## 📞 Need Help?

1. Check error di browser console (F12)
2. Check Supabase logs di Dashboard
3. Read documentation files
4. Check Supabase & Next.js docs

---

**TL;DR:**
1. Setup Supabase project
2. Run SQL migration
3. Setup Google OAuth
4. Update `.env.local`
5. Run `npm run dev`
6. Go to http://localhost:3000
7. Login dengan Google
8. Done! ✅
