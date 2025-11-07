# Auth Verification Fix - Base URL Configuration

## Perubahan yang Dilakukan

### 1. **Update Environment Variable**
File: `.env.local`
```bash
NEXT_PUBLIC_SITE_URL=https://ngevent.noma.my.id
```

### 2. **Update Auth Redirect URLs**
Semua auth redirect sekarang menggunakan `NEXT_PUBLIC_SITE_URL`:

**File:** `app/auth/login/page.tsx`
- Google OAuth redirect: `${redirectUrl}/auth/callback`

**File:** `app/auth/register/page.tsx`
- Email verification redirect: `${redirectUrl}/auth/callback`
- Google OAuth redirect: `${redirectUrl}/auth/callback`

### 3. **Konfigurasi Supabase Dashboard** ⚠️ PENTING

Anda perlu menambahkan URL berikut di **Supabase Dashboard**:

1. Buka Supabase Dashboard: https://supabase.noma.my.id/project/_/auth/url-configuration
2. Tambahkan di **Redirect URLs**:
   ```
   https://ngevent.noma.my.id/auth/callback
   http://localhost:3000/auth/callback
   ```
3. Set **Site URL**:
   ```
   https://ngevent.noma.my.id
   ```

### 4. **Konfigurasi Google OAuth** (jika digunakan)

Di Google Cloud Console, tambahkan:
- **Authorized JavaScript origins**:
  ```
  https://ngevent.noma.my.id
  https://supabase.noma.my.id
  ```
- **Authorized redirect URIs**:
  ```
  https://supabase.noma.my.id/auth/v1/callback
  https://ngevent.noma.my.id/auth/callback
  ```

## Testing

### Email Registration
1. Buka: https://ngevent.noma.my.id/auth/register
2. Isi form dan klik "Buat Akun"
3. Cek email untuk verification link
4. Klik link → akan redirect ke `https://ngevent.noma.my.id/auth/callback` → redirect ke dashboard

### Google OAuth
1. Buka: https://ngevent.noma.my.id/auth/login
2. Klik "Login with Google"
3. Setelah authorize → redirect ke `https://ngevent.noma.my.id/auth/callback` → redirect ke dashboard

## Fallback Behavior

Jika `NEXT_PUBLIC_SITE_URL` tidak diset, sistem akan menggunakan `window.location.origin` sebagai fallback.

## Build & Deploy

Setelah perubahan:
```bash
npm run build
npm run dev  # untuk testing local
```

## Catatan
- ✅ Cross-origin warning di next.config.js sudah diatasi dengan `allowedDevOrigins`
- ✅ Auth redirect URLs sudah menggunakan base URL dari environment variable
- ✅ Fallback ke `window.location.origin` untuk development
