# Updates

## 2026-02-09 (Vercel Deployment Configuration)
- **Added Vercel deployment configuration for production deployment**
- Modified backend to support Vercel serverless functions
- Optimized database connection pooling for serverless environment

**New Files:**
- [vercel.json](vercel.json) - Vercel deployment configuration
  - Routes all requests to Express handler
  - Uses @vercel/node runtime
  - Configured for Singapore region (sin1)
  
- [.vercelignore](.vercelignore) - Files to exclude from deployment
  - Excludes source files, only deploys compiled dist/
  
- [deploy.sh](deploy.sh) - Quick deployment script
  - Automated build and deploy process
  
- [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md) - Deployment guide
  - Step-by-step instructions
  - Environment variables checklist
  - Troubleshooting guide

**Backend Changes:**
- [index.ts](src/index.ts)
  - Export Express app as default export for Vercel
  - Conditional `app.listen()` only in development
  - Dynamic CORS configuration supporting multiple origins
  - CORS_ORIGIN now accepts comma-separated values
  
- [connection.ts](src/db/connection.ts)
  - Reduced connection pool size for serverless (max: 5 in production vs 20 in dev)
  - Added SSL configuration for production database
  - Optimized for Vercel's serverless environment

- [package.json](package.json)
  - Added `vercel-build` script

**Deployment Features:**
- ✅ Serverless-optimized Express.js
- ✅ Automatic SSL for database connections
- ✅ Multiple CORS origins support
- ✅ Reduced connection pooling for serverless
- ✅ Environment-aware configuration
- ✅ One-command deployment script

**Environment Variables Required:**
```
DATABASE_URL, JWT_SECRET, CLOUDINARY_*, RESEND_*, 
CORS_ORIGIN, GOOGLE_CLIENT_ID, NODE_ENV=production
```

See [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md) for complete deployment guide.

## 2026-02-09 (Event Registration Confirmation Email)
- **Added automatic email confirmation for event registrations**
- Participants receive detailed confirmation email immediately after successful registration
- Email includes event details, important notes, and direct link to event page

**New Template:**
- [email-templates.ts](src/utils/email-templates.ts) - Added `getEventRegistrationTemplate()`
  - Professional confirmation email with event details
  - Formatted date and time in Indonesian locale
  - Important notes checklist (arrival time, ID card, etc.)
  - Event ID for reference
  - Cancellation policy reminder
  - Direct link to event detail page

**Backend Changes:**
- [email.ts](src/utils/email.ts)
  - Added `sendEventRegistrationEmail()` function
  - Automatically formats event date and time
  - Generates event URL for easy access
  
- [registration.controller.ts](src/controllers/registration.controller.ts)
  - Integrated email sending after successful registration
  - Fetches user email and event details
  - Sends email asynchronously (non-blocking)
  - Logs errors without blocking registration response

**Email Content:**
- ✅ Personalized greeting with participant name
- 📅 Event title, date, time, and location
- 💡 Important notes and checklist
- 🔗 Direct link to event detail page
- 📋 Event ID for reference
- ⚠️ Cancellation policy reminder
- Consistent branding with NGEvent colors

**User Flow:**
1. User completes event registration
2. Registration saved to database
3. System sends confirmation email automatically
4. User receives email within seconds
5. Email serves as registration proof

**Benefits:**
- Better user experience with immediate confirmation
- Reduces uncertainty about registration status
- Provides all event details in one place
- Email serves as reminder and proof of registration
- Professional communication with participants

## 2026-02-08 (Email Templates Refactoring)
- **Refactored email templates into dedicated file for better organization**
- Separated HTML email templates from email sending logic
- Improved email design with consistent styling and better UX

**New File:**
- [email-templates.ts](src/utils/email-templates.ts) - Centralized email template management
  - `getVerificationEmailTemplate()` - Email verification template
  - `getPasswordResetEmailTemplate()` - Password reset template
  - `getWelcomeEmailTemplate()` - Welcome email template
  - `getEventNotificationTemplate()` - Event notification template
  - Shared base styling for consistent design across all emails

**Updated Files:**
- [email.ts](src/utils/email.ts) - Refactored to use templates from email-templates.ts
  - Cleaner code with separation of concerns
  - Helper functions for common values (getFromEmail, getFrontendUrl)
  - Better JSDoc documentation

**Email Design Improvements:**
- Professional gradient header
- Responsive design with max-width 600px
- Feature cards with icon indicators
- Consistent button styling with hover effects
- Alert boxes for important information
- Modern font stack and color scheme
- Mobile-friendly layout

**Benefits:**
- Easier to maintain and update email templates
- Consistent design across all email types
- Better code organization and readability
- Type-safe template parameters with TypeScript interfaces
- Can be easily extended for new email types

## 2026-02-08 (Welcome Email for First-Time Login)
- **Added welcome email feature for users logging in for the first time**
- Email sent automatically on first login (both email and Google OAuth)
- Beautiful HTML email with platform introduction and getting started tips

**Database Changes:**
- [schema.ts](src/db/schema.ts) - Added `welcomeEmailSent` boolean column to profiles table
- [0004_premium_firedrake.sql](drizzle/0004_premium_firedrake.sql) - Migration file

**Backend Changes:**
- [email.ts](src/utils/email.ts) - Added `sendWelcomeEmail()` function with styled HTML template
- [auth.controller.ts](src/controllers/auth.controller.ts)
  - Updated `login` endpoint to check and send welcome email on first login
  - Updated `googleLogin` endpoint to check and send welcome email on first login
  - Marks `welcomeEmailSent=true` after sending to prevent duplicates

**Email Content:**
- Personalized greeting with user's full name
- Platform introduction and key features
- Quick links to dashboard and profile
- Tips for getting started
- Professional styling with gradient header and feature cards

**Benefits:**
- Better user onboarding experience
- Introduces platform features to new users
- Encourages profile completion and exploration
- Only sent once per user (tracked in database)

**Migration:**
```bash
bun run drizzle-kit generate  # Generated migration
bun run drizzle-kit migrate   # Applied to database
```

## 2026-01-29 (Fix Role Caching Issue)
- **Fixed role not updating after database change**
- Role was hardcoded to `'participant'` in login and register endpoints
- Changed to read `role` from database profile dynamically

**Changes:**
- [auth.controller.ts](src/controllers/auth.controller.ts)
  - `login` now reads `profile?.role || 'participant'` instead of hardcoded `'participant'`
  - `register` now reads `profile?.role || 'participant'` instead of hardcoded `'participant'`
  - Consistent with `getCurrentUser` and `googleLogin` endpoints

**Benefits:**
- Role changes in database immediately reflected on next login
- No need to refresh page after role change
- Consistent behavior across all auth endpoints

## 2026-01-29 (Auth Provider Tracking)
- **Added `auth_provider` column to profiles table**
- Track authentication method: `'email'` (manual signup) or `'google'` (OAuth)
- Prevents Google OAuth users from changing password in Edit Profile page
- Auto-set provider during user registration and Google OAuth login

**Database Changes:**
- [schema.ts](src/db/schema.ts) - Added `authProviderEnum` and `authProvider` column
- [0002_wakeful_chameleon.sql](drizzle/0002_wakeful_chameleon.sql) - Migration file

**Backend Changes:**
- [auth.controller.ts](src/controllers/auth.controller.ts)
  - `googleLogin` sets `authProvider='google'` for Google OAuth users
  - `register` sets `authProvider='email'` for manual signups

**Benefits:**
- Reliable tracking of authentication method
- Prevents confusion for OAuth users trying to change password
- Enables future features based on auth provider
- Better security awareness

**Migration:**
```bash
bun run db:generate  # Generated migration
bun run db:migrate   # Applied to database
```

## 2026-01-28 (v6 - Short Event URLs with 6-Character IDs)
- **Changed event ID from UUID to 6-character alphanumeric string**
- **Updated URL slug from `/events/:id` to `/e/:id`** for shorter, shareable links
- Generated IDs use safe characters (excludes similar looking: 0, O, 1, I, L)
- Example: `/e/3K7M2P` instead of `/events/123e4567-e89b-12d3-a456-426614174000`
- All frontend routes updated to use new `/e/:id` pattern
- Edit route: `/e/:id/edit` (was `/events/:id/edit`)

**Benefits:**
- Shorter, more memorable URLs
- Better for social media sharing
- Easier to type and share verbally
- Professional appearance

**Changes:**
- [schema.ts](src/db/schema.ts) - Changed event.id to varchar(6)
- [id-generator.ts](src/utils/id-generator.ts) - New utility for generating unique 6-char IDs
- [event.controller.ts](src/controllers/event.controller.ts) - Use generateUniqueEventId()
- [App.tsx](../../frontend/src/App.tsx) - Updated routes to `/e/:id`
- All frontend pages updated to use new URL pattern

**Migration via Drizzle:**
```bash
# Generate migration (already done)
bun run db:generate
# Result: drizzle/0001_shallow_eddie_brock.sql

# Apply migration
bun run db:migrate
```

⚠️ **Important**: This is a breaking change. See [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) for details.
- Best for fresh database installations
- Existing UUID data cannot be auto-converted to 6-char IDs
- Production requires careful planning and backup

**ID Format:**
- Length: 6 characters
- Character set: 23456789ABCDEFGHJKMNPQRSTUVWXYZ (30 chars)
- Excludes: 0, O, 1, I, L (to avoid confusion)
- Example IDs: `3K7M2P`, `H8Q5N4`, `W9R6T7`

## 2026-01-28 (v5 - Rate Limiter Fix for Development)
- **Fixed "Too many requests" error** during testing/development
- Increased auth rate limit from 5 to 20 requests per 15 minutes (production)
- **Development mode improvements:**
  - 10x rate limit multiplier (200 auth requests, 1000 API requests per 15 min)
  - Automatic skip rate limiting for localhost IPs (127.0.0.1, ::1, ::ffff:127.0.0.1)
- Better developer experience when testing authentication flows
- Production limits remain reasonable for security

**Changes:**
- [rateLimiter.ts](src/middlewares/rateLimiter.ts) - Enhanced with development detection and localhost whitelist

**Rate Limits:**

| Endpoint Type | Production | Development |
|---------------|------------|-------------|
| Auth (/api/auth/*) | 20 req/15min | 200 req/15min (or unlimited for localhost) |
| General API | 100 req/15min | 1000 req/15min (or unlimited for localhost) |

## 2026-01-28 (v4 - Wajib Lengkapi Profil untuk Registrasi)
- **Validasi profil lengkap sebelum registrasi event**: User wajib melengkapi semua field profil sebelum bisa mendaftar event
- Field wajib: `full_name`, `phone`, `institution`, `position`, `city`
- API `POST /api/registrations` mengembalikan `403` dengan pesan spesifik field mana yang belum dilengkapi
- Semua endpoint auth (`/api/auth/login`, `/api/auth/register`, `/api/auth/google/login`, `/api/auth/me`) sekarang mengembalikan semua field profil

## 2026-01-27 (v3 - Cache Control untuk Profile)
- **Menambahkan Cache-Control headers untuk endpoint profile**
- Middleware cache di `index.ts` untuk GET requests ke `/api/profile`:
  - `Cache-Control: public, max-age=300, stale-while-revalidate=600`
  - Cache 5 menit dengan stale-while-revalidate 10 menit
  - Membantu browser cache response yang berisi `avatar_url` dari Google
- Response profile sekarang bisa di-cache oleh browser
- Mengurangi load ke database untuk data yang jarang berubah

## 2026-01-27 (v2 - Client-side flow)
- **Changed Google OAuth flow to client-side**: Frontend now handles Google login and sends credential to backend for verification.
- Added endpoint `POST /api/auth/google/login` that accepts Google credential token from frontend.
- Removed old server-side OAuth endpoints (`GET /api/auth/google` and `GET /api/auth/google/callback`).
- Simplified backend: now only requires `GOOGLE_CLIENT_ID` (no need for `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, or `FRONTEND_URL`).

### Benefits
- No popup/redirect complexity
- Simpler state management (no CSRF cookies needed)
- Better UX with Google One Tap
- Easier debugging

### Env vars (backend)
- `GOOGLE_CLIENT_ID` (required - same ID used by frontend)
