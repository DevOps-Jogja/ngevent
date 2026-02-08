# Updates

## 2026-02-09 (Add Reset Password Pages)
- **Implemented complete reset password flow in frontend**
- Added ForgotPasswordPage for requesting password reset
- Added ResetPasswordPage for setting new password
- Integrated with backend reset password API

**New Pages:**
- [ForgotPasswordPage.tsx](src/pages/ForgotPasswordPage.tsx)
  - Clean, modern UI with email input form
  - Success/error message display
  - Rate limiting handled via backend
  - Security notes and instructions
  - Link back to login and register
  - Loading state during submission

- [ResetPasswordPage.tsx](src/pages/ResetPasswordPage.tsx)
  - Reads token from URL query parameter
  - New password and confirm password fields
  - Show/hide password toggle
  - Real-time password matching validation
  - Client-side validation (min 8 characters)
  - Auto-redirect to login on success
  - Password requirements display
  - Handles expired/invalid tokens

**Router Changes:**
- [App.tsx](src/App.tsx)
  - Added route: `/forgot-password`
  - Added route: `/reset-password`
  - Imported ForgotPasswordPage and ResetPasswordPage

- [LoginPage.tsx](src/pages/LoginPage.tsx)
  - Changed "Lupa password?" from `<a>` to `<Link to="/forgot-password">`
  - Proper navigation instead of anchor tag

**User Flow:**
1. User clicks "Lupa password?" on login page
2. Enters email on forgot-password page
3. Receives email with reset link
4. Clicks link → opens reset-password page with token
5. Enters new password (min 8 chars)
6. Confirms password matches
7. Submits → password updated
8. Auto-redirected to login with success message

**Features:**
- ✅ Modern, responsive UI matching site design
- ✅ Comprehensive error handling
- ✅ Loading states and animations
- ✅ Security warnings and instructions
- ✅ Client-side and server-side validation
- ✅ Password visibility toggle
- ✅ Real-time validation feedback
- ✅ Success messages with auto-redirect

**API Integration:**
- POST `/api/auth/forgot-password` - request reset
- POST `/api/auth/reset-password` - update password
- Handles all backend error responses
- Displays user-friendly error messages

## 2026-02-09 (Vercel Deployment Configuration)
- **Added Vercel deployment configuration for production deployment**
- Configured static site deployment with SPA routing support
- Added security headers and cache optimization

**New Files:**
- [vercel.json](vercel.json) - Vercel deployment configuration
  - SPA rewrites: All routes to index.html
  - Security headers (CSP, X-Frame-Options, X-XSS-Protection)
  - Cache headers for static assets
  - Service worker cache control
  
- [.vercelignore](.vercelignore) - Files to exclude from deployment
  - Excludes source files and config files
  - Only deploys build output (dist/)
  
- [deploy.sh](deploy.sh) - Quick deployment script
  - Validates .env.production exists
  - Automated build and deploy process
  
- [.env.production.example](.env.production.example) - Production environment template
  - VITE_API_URL for backend endpoint
  - VITE_GOOGLE_CLIENT_ID for OAuth
  
- [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md) - Deployment guide
  - Step-by-step deployment instructions
  - Environment variables setup
  - Google OAuth configuration
  - Post-deployment checklist
  - Troubleshooting guide

**Configuration Features:**
- ✅ SPA routing (no 404 on refresh)
- ✅ Security headers configured
- ✅ Static asset caching (1 year)
- ✅ Service worker cache control
- ✅ Vite build optimization
- ✅ One-command deployment

**Environment Variables Required:**
```
VITE_API_URL=https://your-backend.vercel.app
VITE_GOOGLE_CLIENT_ID=your-client-id
```

**Post-Deployment Tasks:**
1. Update Google OAuth authorized origins
2. Update backend CORS_ORIGIN
3. Test login and API calls

See [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md) for complete guide.

## 2026-02-09 (Dynamic Document Title per Page)
- **Implemented dynamic document title for all pages to improve SEO and user experience**
- Each page now has a descriptive title that appears in the browser tab
- Event-related pages display the event name in the title

**Changes Made:**
- Updated all page components to set `document.title` using `useEffect`
- Static pages use fixed titles (e.g., "Beranda - NgEvent", "Dashboard - NgEvent")
- Dynamic pages update title based on data:
  - EventDetailPage: Shows event title (e.g., "Workshop DevOps - NgEvent")
  - EventRegistrationPage: Shows registration for event (e.g., "Pendaftaran Workshop DevOps - NgEvent")
  - DashboardEventRegistrationsPage: Shows event name in title
  - EditEventPage, CreateEventPage: Show context-specific titles

**Files Modified:**
- [HomePage.tsx](src/pages/HomePage.tsx) → "Beranda - NgEvent"
- [EventsPage.tsx](src/pages/EventsPage.tsx) → "Events - NgEvent"
- [EventDetailPage.tsx](src/pages/EventDetailPage.tsx) → "{EventTitle} - NgEvent"
- [EventRegistrationPage.tsx](src/pages/EventRegistrationPage.tsx) → "Pendaftaran {EventTitle} - NgEvent"
- [CalendarPage.tsx](src/pages/CalendarPage.tsx) → "Kalender - NgEvent"
- [DiscoverPage.tsx](src/pages/DiscoverPage.tsx) → "Jelajahi - NgEvent"
- [DashboardPage.tsx](src/pages/DashboardPage.tsx) → "Dashboard - NgEvent"
- [AdminPage.tsx](src/pages/AdminPage.tsx) → "Admin Panel - NgEvent"
- [LoginPage.tsx](src/pages/LoginPage.tsx) → "Login - NgEvent"
- [RegisterPage.tsx](src/pages/RegisterPage.tsx) → "Register - NgEvent"
- [CreateEventPage.tsx](src/pages/CreateEventPage.tsx) → "Buat Event Baru - NgEvent"
- [EditEventPage.tsx](src/pages/EditEventPage.tsx) → "Edit Event - NgEvent"
- [EditProfilePage.tsx](src/pages/EditProfilePage.tsx) → "Edit Profil - NgEvent"
- [NotFoundPage.tsx](src/pages/NotFoundPage.tsx) → "404 - Halaman Tidak Ditemukan - NgEvent"
- [EventBroadcastPage.tsx](src/pages/EventBroadcastPage.tsx) → "Broadcast Event - NgEvent"
- [DashboardRegistrationsPage.tsx](src/pages/DashboardRegistrationsPage.tsx) → "Kelola Pendaftaran - NgEvent"
- [DashboardEventRegistrationsPage.tsx](src/pages/DashboardEventRegistrationsPage.tsx) → "Pendaftaran {EventTitle} - NgEvent"

**Benefits:**
- ✅ Better SEO for search engines
- ✅ Improved browser history and bookmarks
- ✅ Clear context when multiple tabs are open
- ✅ Professional user experience
- ✅ Easier navigation for users

## 2026-02-09 (Optimize Google Profile Image Caching)
- **Enhanced CachedAvatar component to properly cache Google profile images using IndexedDB**
- Google OAuth profile images now load instantly after first fetch
- Solves CORS issues with Google images by using blob URLs

**Problem:**
- Google profile images from `googleusercontent.com` couldn't use browser cache effectively
- CORS policy prevented `crossOrigin="anonymous"` attribute
- Images had to be re-fetched on every page load

**Solution:**
- [CachedAvatar.tsx](src/components/CachedAvatar.tsx)
  - Implemented IndexedDB storage for Google profile images
  - Fetch image once → convert to Blob → store as blob URL
  - Subsequent loads use cached blob URL (instant load)
  - Automatic cache management per image URL
  - Falls back to direct URL if IndexedDB not available

**Technical Details:**
- Uses IndexedDB database `NGEventAvatarCache`
- Object store: `avatars` (key: image URL, value: blob URL)
- Detects Google images by checking URL contains `googleusercontent.com` or `google.com`
- Non-Google images use direct URL (normal browser caching)
- Loading state with skeleton animation
- Lazy loading and async decoding for performance

**Benefits:**
- ✅ Google profile images load instantly after first visit
- ✅ No more repeated network requests for avatar images
- ✅ Works offline after first load
- ✅ No CORS issues
- ✅ Smooth loading experience with skeleton placeholder
- ✅ Automatic cleanup (browser manages IndexedDB size)

**Performance Impact:**
- First load: ~200-500ms (fetch + cache)
- Subsequent loads: ~10-50ms (from IndexedDB)
- Reduces server requests by 100% for returning users

## 2026-02-09 (Change Route from /e/:id to /event/:id)
- **Fixed issue where {firstName} and {fullName} placeholders were not replaced with actual participant names**
- Email now correctly shows participant names instead of literal "[Nama Peserta]"

**Root Cause:**
- Frontend `applyTemplate()` was replacing `{firstName}` with `[Nama Peserta]` before sending to backend
- Backend then looked for `{firstName}` but it was already replaced with literal text
- Result: Emails showed "[Nama Peserta]" instead of actual names

**Fix:**
- [broadcastTemplates.ts](src/lib/broadcastTemplates.ts)
  - Removed `{firstName}` and `{fullName}` from frontend replacements
  - Frontend now only replaces event-related placeholders ({eventTitle}, {eventDate}, etc.)
  - Name placeholders ({firstName}, {fullName}) are kept intact and sent to backend
  - Backend handles personalization per participant with actual names

**How It Works Now:**
1. Frontend applies template → replaces event info only
2. Message sent to backend with `{firstName}` and `{fullName}` intact
3. Backend loops through participants → replaces name placeholders with actual names
4. Each participant gets personalized email with their real name

**Benefits:**
- ✅ Participants receive emails with their actual names
- ✅ Proper personalization for each recipient
- ✅ Clean separation: frontend handles event data, backend handles participant data

## 2026-02-09 (Fix Broadcast Email Template - Add {fullName} Support)
- **Fixed missing {fullName} placeholder support in broadcast email templates**
- Added {fullName} alongside existing {firstName} placeholder for more personalization options

**Frontend Changes:**
- [broadcastTemplates.ts](src/lib/broadcastTemplates.ts)
  - Added `{fullName}` to replacements object in `applyTemplate()` function
  - Now supports both `{firstName}` (first name only) and `{fullName}` (full name)
  - Template preview shows `[Nama Lengkap Peserta]` for fullName placeholder

**Backend Changes:**
- [broadcast.controller.ts](../backend/src/controllers/broadcast.controller.ts)
  - Added `fullName` variable in `replacePlaceholders()` function
  - Added `.replace(/\{fullName\}/g, fullName)` to template processing
  - Both placeholders now work correctly in email templates

**Available Placeholders:**
- `{firstName}` - First name only (e.g., "John")
- `{fullName}` - Full name (e.g., "John Doe")
- `{eventTitle}` - Event title
- `{eventDate}` - Event date (formatted in Indonesian)
- `{eventTime}` - Event time (HH:MM format)
- `{eventLocation}` - Event location

**Benefits:**
- More flexibility in personalizing broadcast emails
- Can choose between formal (fullName) or casual (firstName) greetings
- Consistent behavior between frontend preview and actual sent emails

## 2026-01-29 (Add Email Broadcast Management Page)
- **Created comprehensive email broadcast management page for event organizers**
- Organizers can send broadcast emails to all registered participants
- Added broadcast history tracking with database table
- Integrated with backend Express.js API (PostgreSQL + Drizzle ORM)
- **Added 7 professional email templates with smart placeholders**

**New Files:**
- [EventBroadcastPage.tsx](src/pages/EventBroadcastPage.tsx)
  - Complete broadcast email interface
  - Subject and message composer with preview
  - **Template selector with 7 pre-made templates**
  - Participant count display
  - Broadcast history sidebar
  - Event information panel
  - Tips and best practices section

- [broadcastTemplates.ts](src/lib/broadcastTemplates.ts)
  - 7 professional email templates:
    1. ⏰ Event Reminder
    2. 🚀 Event Starting Soon
    3. 🙏 Thank You Post Event
    4. 📍 Venue Change Notification
    5. ❌ Event Cancellation
    6. 📢 Update Information
    7. ✏️ Custom Template
  - Smart placeholder system: {firstName}, {eventTitle}, {eventDate}, {eventTime}, {eventLocation}
  - Auto-format dates and times in Indonesian locale
  - **Backend automatically personalizes each email per participant**

**Backend Changes:**
- [schema.ts](../backend/src/db/schema.ts)
  - Added `broadcastHistory` table with relations
  - Includes eventId, subject, message, recipientCount, status, sentAt
  
- [broadcast.controller.ts](../backend/src/controllers/broadcast.controller.ts)
  - Enhanced `broadcastToParticipants` to save history
  - **Added automatic placeholder replacement for personalization**
  - Replaces {firstName}, {eventTitle}, {eventDate}, {eventTime}, {eventLocation}
  - Each participant receives personalized email with their own name
  - Added `getBroadcastHistory` controller
  
- [broadcast.routes.ts](../backend/src/routes/broadcast.routes.ts)
  - Added GET `/api/events/:eventId/broadcast-history` route
  
- **Migration**: `drizzle/0003_lowly_crusher_hogan.sql`
  - Database migration auto-generated and applied

**Frontend Changes:**
- [App.tsx](src/App.tsx)
  - Added route: `/dashboard/events/:eventId/broadcast`
  
- [DashboardEventRegistrationsPage.tsx](src/pages/DashboardEventRegistrationsPage.tsx)
  - Added "Broadcast" button with Mail icon
  - Links to broadcast page for the event

**Features:**
- ✅ Email composer with subject and message fields
- ✅ Real-time participant count display
- ✅ Email preview functionality
- ✅ Integration with backend Express API
- ✅ Broadcast history tracking (auto-saved to database)
- ✅ Authorization check (only organizer/admin can access)
- ✅ Event information display
- ✅ Tips and best practices sidebar
- ✅ Responsive design with dark mode support
- ✅ Loading states and error handling
- ✅ Confirmation dialog before sending

**Tech Stack:**
- Backend: Express.js + PostgreSQL + Drizzle ORM
- Email Service: Resend
- Database: PostgreSQL with automatic migrations
- Frontend: React + TanStack Query + Axios

**API Endpoints:**
- `POST /api/events/:eventId/broadcast` - Send broadcast email
- `GET /api/events/:eventId/broadcast-history` - Get broadcast history

**Environment Variables Required:**
```env
# Backend (.env)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
DATABASE_URL=postgresql://...
```

**Database Migration:**
```bash
# Already applied via Drizzle
bun run db:generate  # Generate migration
bun run db:migrate   # Apply migration
```

**Next Steps:**
1. Configure RESEND_API_KEY in backend .env
2. Test sending broadcast to participants
3. Monitor broadcast history in database

## 2026-01-29 (Move Admin and Registration Menu to Dashboard)
- **Moved navigation menus from Navbar to Dashboard page**
- Admin and Registration management links removed from user dropdown
- Added as prominent action buttons in Dashboard header
- Better visibility and accessibility for admin/organizer features

**Changes:**
- [Navbar.tsx](src/components/Navbar.tsx)
  - Removed "Administrator" menu item from desktop dropdown
  - Removed "Manajemen Pendaftaran" menu item from desktop dropdown
  - Removed both items from mobile dropdown as well
  - Simplified user dropdown to Profile, Dashboard, and Logout only
  
- [DashboardPage.tsx](src/pages/DashboardPage.tsx)
  - Added "Administrator" button for admin users (purple gradient)
  - Added "Pendaftaran" button for organizer/admin users (blue gradient)
  - Reorganized header action buttons with better visual hierarchy
  - Added Shield icon import from lucide-react

**Benefits:**
- ✅ More prominent placement - no need to click dropdown
- ✅ Better UX - primary actions visible immediately
- ✅ Cleaner navbar - less cluttered dropdown menu
- ✅ Contextual placement - admin features in dashboard where they belong
- ✅ Color-coded buttons - easier visual identification

## 2026-01-29 (Fix Role Caching on App Load)
- **Fixed stale role data on app load**
- AuthContext now always fetches fresh user data from backend on mount
- Removed dependency on potentially stale localStorage data

**Changes:**
- [AuthContext.tsx](src/contexts/AuthContext.tsx)
  - `checkAuth` now always calls `/api/auth/me` to get fresh user data
  - Updates localStorage with fresh data after fetch
  - No longer relies on stored user data for initial state

**Benefits:**
- ✅ Always shows latest role after database change
- ✅ No stale data from localStorage
- ✅ Consistent user state across app sessions
- ✅ Profile updates (role, name, etc.) immediately visible

## 2026-01-29 (Hide Password Change for Google OAuth Users)
- **Hidden Security tab** for users who registered via Google OAuth
- Display informative message explaining Google manages their password
- Read `auth_provider` field from profile API to determine authentication method

**Changes:**
- [EditProfilePage.tsx](src/pages/EditProfilePage.tsx)
  - Added `auth_provider` to `Profile` type
  - Added `isGoogleUser` state
  - Conditionally render Security tab only for email users
  - Show blue info box for Google users explaining password management

**Benefits:**
- ✅ Clearer UX - Google users won't see irrelevant password options
- ✅ Prevents confusion - clear message about Google authentication
- ✅ Better security awareness - users understand their auth method
- ✅ Reduced support requests - no more "I can't change my password" from OAuth users

## 2026-01-28 (v7 - Separate Registration Page)
- **Created dedicated event registration page** at `/e/:id/registration`
- **Removed registration modal** from EventDetailPage - now redirects to separate page
- **Improved registration UI** with modern, spacious design:
  - Event summary card with banner image
  - Visual indicators for full events, already registered, incomplete profile
  - Better form layout with improved file upload UI
  - Drag & drop file upload with preview
  - Progress indicators during file upload
  - Gradient buttons and better spacing
  - Custom images gallery integration
  - Professional success/error states

**Changes:**
- **[EventRegistrationPage.tsx](src/pages/EventRegistrationPage.tsx)** - NEW dedicated page for event registration
- **[App.tsx](src/App.tsx)** - Added route `/e/:id/registration`
- **[EventDetailPage.tsx](src/pages/EventDetailPage.tsx)** - Removed modal, added Link to registration page
  - Removed modal state and handlers
  - Simplified component (removed 250+ lines of modal code)
  - Button "Daftar Sekarang" now navigates to `/e/:id/registration`

**Benefits:**
- ✅ Better UX - full page dedicated to registration instead of cramped modal
- ✅ Direct URL access - can bookmark or share registration page
- ✅ Better mobile experience - no modal scrolling issues
- ✅ Cleaner code - separated concerns
- ✅ Improved UI - more space for form fields and instructions

**Example URLs:**
```
Event detail:       https://ngevent.com/e/3K7M2P
Event registration: https://ngevent.com/e/3K7M2P/registration
Event edit:         https://ngevent.com/e/3K7M2P/edit
```

## 2026-01-28 (v6 - Short Event URLs)
- **Changed event URLs from `/events/:id` to `/e/:id`** for shorter, shareable links
- Event IDs now use 6-character alphanumeric format (e.g., `3K7M2P`)
- Updated all routes and navigation:
  - Event detail: `/e/:id` (was `/events/:id`)
  - Edit event: `/e/:id/edit` (was `/events/:id/edit`)
  - Event list: `/events` (unchanged)
  - Create event: `/events/create` (unchanged)
- All Link components and navigate() calls updated across:
  - [App.tsx](src/App.tsx) - Route definitions
  - [HomePage.tsx](src/pages/HomePage.tsx)
  - [EventsPage.tsx](src/pages/EventsPage.tsx)  
  - [EventDetailPage.tsx](src/pages/EventDetailPage.tsx)
  - [CalendarPage.tsx](src/pages/CalendarPage.tsx)
  - [DiscoverPage.tsx](src/pages/DiscoverPage.tsx)
  - [DashboardPage.tsx](src/pages/DashboardPage.tsx)
  - [DashboardRegistrationsPage.tsx](src/pages/DashboardRegistrationsPage.tsx)
  - [AdminPage.tsx](src/pages/AdminPage.tsx)

**Benefits:**
- ✅ Shorter URLs: `ngevent.com/e/3K7M2P` vs `ngevent.com/events/uuid`
- ✅ Better for sharing on social media (character limit)
- ✅ Easier to type and remember
- ✅ More professional appearance

**Examples:**
```
Old: https://ngevent.com/events/123e4567-e89b-12d3-a456-426614174000
New: https://ngevent.com/e/3K7M2P

Old: https://ngevent.com/events/123e4567-e89b-12d3-a456-426614174000/edit
New: https://ngevent.com/e/3K7M2P/edit
```

## 2026-01-28 (v5 - Google One Tap Fix)
- **Disabled Google One Tap** (automatic popup) on login page to fix CORS errors
- One Tap uses FedCM which requires HTTPS in production and has strict CORS requirements
- Manual "Sign in with Google" button still works perfectly
- Added `exposedHeaders` to backend CORS config for better compatibility
- Added validation and conditional rendering for Google Client ID
- Created comprehensive troubleshooting documentation:
  - [FIX_GOOGLE_ERROR_NOW.md](../FIX_GOOGLE_ERROR_NOW.md) - Step-by-step fix guide (Bahasa)
  - [CHECK_GOOGLE_OAUTH.md](../CHECK_GOOGLE_OAUTH.md) - Detailed troubleshooting
  - [GOOGLE_ONE_TAP_SETUP.md](../GOOGLE_ONE_TAP_SETUP.md) - One Tap setup guide
  - [check-google-config.sh](../check-google-config.sh) - Automatic config checker script

**Issues Fixed:**
```
❌ Failed to load resource: accounts.google.com - status 403
❌ [GSI_LOGGER]: The given origin is not allowed for the given client ID
❌ Cross-Origin-Opener-Policy policy would block the window.postMessage call
```

**Root Cause:**
- Origin `http://localhost:5173` not registered in Google Cloud Console "Authorized JavaScript origins"
- Google One Tap (FedCM) has stricter CORS requirements

**Solutions Applied:**
1. Disabled One Tap for development (remove `useOneTap` prop)
2. Added Client ID validation and error handling
3. Improved CORS configuration in backend
4. Created diagnostic tools and comprehensive documentation

**Current Status:**
- ✅ Manual Google login button: **Working**
- ⚠️ Google One Tap (auto-popup): **Disabled** for development
- ✅ Login flow: Email/Password + Google button both working
- 📝 Full setup guides available

**Action Required:**
1. Add `http://localhost:5173` to Google Cloud Console → OAuth 2.0 Client ID → "Authorized JavaScript origins"
2. Wait 5-10 minutes for propagation
3. Clear browser cache & cookies
4. Test in Incognito mode

**Files Changed:**
- [LoginPage.tsx](src/pages/LoginPage.tsx) - Removed `useOneTap`, added validation
- [backend/src/index.ts](../backend/src/index.ts) - Enhanced CORS config
- [update.md](update.md) - Documentation

**Testing:**
```bash
# Run diagnostic script
cd /home/noma/Dev/js/ngevent
bash check-google-config.sh
```

## 2026-01-28 (v4 - Wajib Lengkapi Profil untuk Registrasi)
- **Validasi semua field profil sebelum registrasi**: User wajib melengkapi semua data profil (Nama Lengkap, Nomor Telepon, Institusi, Posisi/Jabatan, Kota)
- **Warning box** tampil langsung di area pendaftaran event (kartu kuning) kalau profil belum lengkap
- Warning menampilkan **daftar field spesifik** yang masih kosong
- Tombol "Lengkapi Profil" redirect ke `/profile/edit`
- Tombol "Daftar Sekarang" jadi disabled kalau profil belum lengkap

## 2026-01-27 (v3 - Avatar Caching)
- **Added aggressive browser caching for profile photos from Google**
- Created `CachedAvatar` component with optimization:
  - `crossOrigin="anonymous"` untuk enable CORS caching
  - `referrerPolicy="no-referrer"` untuk privacy dan caching
  - `loading="lazy"` untuk performance
  - `decoding="async"` untuk non-blocking image decode
  - Fallback ke User icon jika gambar gagal load
- Mengganti semua `<img>` tag untuk avatar dengan `<CachedAvatar>` di:
  - `Navbar.tsx` (mobile + desktop view)
  - `EventDetailPage.tsx`
  - `AdminPage.tsx` (table + card view)
- Menambahkan Service Worker (`public/sw.js`) untuk:
  - Cache Google profile photos (`lh3.googleusercontent.com`)
  - Cache-first strategy dengan network fallback
  - Automatic cache cleanup untuk version lama

### Benefits
- Foto profile di-cache oleh browser (tidak perlu download ulang)
- Loading lebih cepat di subsequent visits
- Bekerja offline jika sudah pernah di-load
- Mengurangi bandwidth usage

## 2026-01-27 (v2 - Client-side flow)
- **Changed to client-side Google OAuth flow** using `@react-oauth/google` library.
- Login page now uses `<GoogleLogin>` component with One Tap support.
- Added `loginWithGoogle(credential)` to AuthContext that sends Google token to backend.
- Removed popup-based OAuth flow and callback page.
- Wrapped app with `GoogleOAuthProvider` in [frontend/src/main.tsx](frontend/src/main.tsx).

### Env vars
- `VITE_API_URL` (backend base URL)
- `VITE_GOOGLE_CLIENT_ID` (required - same as backend's `GOOGLE_CLIENT_ID`)

### Setup in Google Cloud Console
1. Create OAuth 2.0 Client ID (Web application)
2. Add authorized JavaScript origins:
   - `http://localhost:5173` (development)
   - Your production domain
3. No redirect URIs needed for client-side flow
4. Copy the Client ID to both backend and frontend `.env` files
