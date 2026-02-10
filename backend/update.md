# Updates

## 2026-02-10 (Fix Vercel Deployment Configuration)
- **Fixed Express.js backend to properly run on Vercel as serverless function**
- Updated vercel.json to use @vercel/node with direct TypeScript support
- Vercel will handle TypeScript compilation automatically

**Changes:**
- [vercel.json](vercel.json)
  - Changed to use `@vercel/node` builder with source TypeScript file
  - Routes point to `/src/index.ts` - Vercel compiles TypeScript automatically
  - No need for manual build step, @vercel/node handles it internally

**Configuration:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/src/index.ts"
    }
  ]
}
```

**Deployment Notes:**
- @vercel/node automatically compiles TypeScript files
- All dependencies from package.json are installed
- All API routes work through the serverless function
- The Express app is properly exported as `export default app` in index.ts

---

## 2026-02-09 (Re-Registration Support After Cancellation)
- **Users can re-register for events after cancelling without encountering duplicate registration errors**
- System reuses cancelled registration record instead of creating new one
- Previous registration data can be retrieved for pre-filling forms
- Email confirmation sent on re-registration

**Changes:**
- [registration.controller.ts](src/controllers/registration.controller.ts)
  - Added `getPreviousRegistration()` endpoint to fetch last registration (including cancelled)
  - Modified `registerForEvent()` to handle re-registration after cancellation
  - Moved profile validation before registration check for better flow
  - If existing registration status is 'cancelled': UPDATE record with new data
  - If existing registration status is 'registered' or 'attended': throw error
  - If no existing registration: INSERT new record
  - Maintains unique constraint (event_id, user_id) without conflicts

- [registration.routes.ts](src/routes/registration.routes.ts)
  - Added GET `/api/registrations/previous/:eventId` endpoint
  - Requires authentication
  - Returns most recent registration for user+event combination

**Backend Logic Flow:**
```
1. Validate event exists and has capacity
2. Check profile completion (moved before registration check)
3. Check existing registration for event_id + user_id
4. If exists with status 'cancelled':
   - UPDATE registration_data, status='registered', registered_at=NOW()
   - Send email confirmation
   - Return updated record
5. If exists with status 'registered' or 'attended':
   - Throw "Already registered" error
6. If not exists:
   - INSERT new registration
   - Send email confirmation
   - Return new record
```

**Database:**
- Registration status enum: 'registered' | 'attended' | 'cancelled'
- Unique constraint on (event_id, user_id) still enforced
- No schema changes required
- registration_data stored as jsonb (includes form fields and file URLs)

**API Endpoints:**
- POST `/api/registrations` - Create or update registration
  - If cancelled registration exists: updates it
  - If no registration exists: creates new one
  - If active registration exists: returns error

- GET `/api/registrations/previous/:eventId` - Get previous registration
  - Returns most recent registration for current user + event
  - Includes cancelled registrations
  - Returns null if no previous registration

**Benefits:**
- ✅ Eliminates duplicate registration errors on re-registration
- ✅ Preserves registration history in database
- ✅ Enables pre-filling forms with previous data
- ✅ Maintains data integrity with unique constraint
- ✅ No database migration required
- ✅ Email confirmation on re-registration

**Security:**
- Profile validation still enforced before registration
- User can only access their own registration data
- Authentication required for all endpoints
- Rate limiting applied to registration endpoint

---

## 2026-02-09 (Client-Side Image Upload with Cloudinary Signature)
- **Migrated from server-side to client-side image uploads for better performance**
- Backend generates secure signature, frontend uploads directly to Cloudinary
- Eliminates backend as proxy, reducing serverless execution time
- Improves upload speed and reduces bandwidth costs

**Changes:**
- [upload.controller.ts](src/controllers/upload.controller.ts)
  - Added `getUploadSignature()` endpoint to generate Cloudinary upload signature
  - Returns timestamp, signature, api_key, folder, and transformation settings
  - Uses CLOUDINARY_API_SECRET to sign upload parameters
  - Supports different folders: avatars, event-images, payment-proofs
  - Includes transformation settings (max dimensions, quality, format)

- [upload.routes.ts](src/routes/upload.routes.ts)
  - Added GET `/api/upload/signature` endpoint
  - Requires authentication via basicAuth middleware
  - Returns signature data for secure client-side upload

**Architecture Change:**
```
Before (Server-Side Upload):
Client → Backend (multer) → Cloudinary → Backend → Client
- File passes through backend
- Uses serverless function execution time
- Doubles bandwidth usage

After (Client-Side Upload):
Client → Backend (signature only) → Client → Cloudinary
- File goes directly to Cloudinary
- Backend only generates signature (~10ms)
- Minimal serverless execution
- Single bandwidth usage
```

**Security:**
- Signature generated server-side with API secret
- Timestamp prevents replay attacks
- Folder restrictions enforced
- Transformation limits prevent abuse
- Same security as server-side upload

**Benefits:**
- ✅ **Performance**: Direct upload is faster than proxy
- ✅ **Cost**: Reduces serverless execution time significantly
- ✅ **Bandwidth**: Backend doesn't handle file transfer
- ✅ **Scalability**: Cloudinary handles upload load
- ✅ **Reliability**: One less hop in the chain
- ✅ **UX**: Better progress feedback possible

**API Response:**
```json
{
  "timestamp": 1675872000,
  "signature": "abc123...",
  "api_key": "123456789",
  "folder": "ngevent/avatars",
  "transformation": "w_500,h_500,c_limit,q_auto,f_auto"
}
```

**Backward Compatibility:**
- Old `POST /api/upload` endpoint still available
- Supports gradual migration
- Can be removed in future version

## 2026-02-09 (Auto-delete Old Avatar from Cloudinary on Profile Update)
- **Added automatic cleanup of old avatar images when user updates profile picture**
- Prevents orphaned files in Cloudinary storage
- Only deletes Cloudinary-hosted images (not Google OAuth avatars)

**Changes:**
- [profile.controller.ts](src/controllers/profile.controller.ts)
  - Added `getPublicIdFromUrl()` helper to extract public_id from Cloudinary URL
  - Added `deleteCloudinaryImage()` helper to delete image from Cloudinary
  - Modified `updateProfile()` to delete old avatar before saving new one
  - Checks if old avatar exists and is different from new one
  - Only deletes if URL contains 'cloudinary.com' (not Google avatars)
  - Configured Cloudinary client with credentials

**Flow:**
1. User updates profile with new avatar_url
2. Backend fetches current profile to get old avatar_url
3. If old avatar exists and is Cloudinary URL:
   - Extract public_id from URL
   - Delete from Cloudinary using `cloudinary.uploader.destroy()`
4. Save new avatar_url to database
5. Old file removed from Cloudinary storage

**Benefits:**
- ✅ Prevents storage waste from orphaned files
- ✅ Reduces Cloudinary storage costs
- ✅ Keeps storage clean and organized
- ✅ Safe: Only deletes Cloudinary images, not Google OAuth avatars
- ✅ Non-blocking: Delete errors don't prevent profile update
- ✅ Automatic: No manual cleanup needed

**Public ID Extraction:**
- Handles standard Cloudinary URL format
- Supports versioned URLs (v1234567890/...)
- Extracts from path after /upload/
- Removes file extension

**Safety:**
- Only deletes if old avatar is Cloudinary URL
- Doesn't delete if same URL (no change)
- Errors logged but don't block update
- Google OAuth avatars are preserved

## 2026-02-09 (Complete Reset Password Feature)
- **Fixed and completed reset password functionality**
- Added proper validation schemas for forgot-password and reset-password endpoints
- Added FRONTEND_URL environment variable for email links

**Backend Changes:**
- [validation.ts](src/middlewares/validation.ts)
  - Added `forgotPasswordSchema` - validates email format
  - Added `resetPasswordSchema` - validates token and newPassword (min 8 chars)
  - Exported schemas for use in routes

- [auth.routes.ts](src/routes/auth.routes.ts)
  - Applied `validateSchema(schemas.forgotPassword)` middleware to /forgot-password
  - Applied `validateSchema(schemas.resetPassword)` middleware to /reset-password
  - Both endpoints now have proper input validation

- [.env.example](.env.example)
  - Added `FRONTEND_URL` variable for email link generation
  - Defaults to http://localhost:5173 if not set
  - Used by sendPasswordResetEmail to generate reset links

**Existing Functionality (Already Working):**
- ✅ Schema has resetPasswordToken and resetPasswordExpires fields
- ✅ forgotPassword controller generates token and sends email
- ✅ resetPassword controller validates token and updates password
- ✅ Email template for password reset exists
- ✅ Token expires after 1 hour
- ✅ Security: doesn't reveal if email exists

**Reset Password Flow:**
1. User requests reset at /api/auth/forgot-password with email
2. Backend generates token, saves to DB with 1-hour expiry
3. Email sent with reset link: {FRONTEND_URL}/reset-password?token=xxx
4. User clicks link, enters new password
5. Frontend POSTs to /api/auth/reset-password with token + newPassword
6. Backend validates token, updates password, clears token

**Benefits:**
- ✅ Proper input validation on both endpoints
- ✅ Clear error messages for validation failures
- ✅ Secure token-based password reset
- ✅ Configurable frontend URL for deployment
- ✅ Email doesn't reveal if account exists (security)

## 2026-02-09 (Add UUID Field to Events Table)
- **Added UUID field to events table for unique identification**
- Events now have both readable short ID (6 chars) and UUID for robust identification
- UUID is automatically generated and guaranteed unique

**Schema Changes:**
- [schema.ts](src/db/schema.ts)
  - Added `uuid` column to events table
  - UUID is auto-generated with `defaultRandom()`
  - UUID is NOT NULL and UNIQUE
  - Existing `id` field remains as primary key for human-readable references

**Migration:**
- [0005_violet_hardball.sql](drizzle/0005_violet_hardball.sql)
  - Adds `uuid` column with `gen_random_uuid()` default
  - Adds unique constraint on `uuid`
  - Existing events get UUID automatically

**Benefits:**
- ✅ Globally unique identifier for events
- ✅ Maintains existing short ID for user-friendly URLs
- ✅ Better for external integrations and APIs
- ✅ Prevents ID conflicts across different systems
- ✅ Standard UUID format for better compatibility

**Use Cases:**
- API integrations can use UUID for reliable references
- Short ID still used for user-facing URLs (e.g., `/events/ABC123`)
- UUID can be used for webhooks, external systems, analytics

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
