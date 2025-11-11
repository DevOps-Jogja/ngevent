# Supabase connection tuning (what changed and why)

This repository now applies a few low-risk changes to reduce connection overhead and make requests more resilient without changing the UI.

## Changes applied

- Shared request wrapper with timeout + small retry
  - `lib/supabase.ts` exports `supabaseFetch`, used by both the browser client and server/admin clients.
  - Admin client (`lib/supabase-admin.ts`) and API routes (`app/api/webhooks/email/route.ts`, `app/api/upload/route.ts`) are wired to use this wrapper, improving reliability under transient network hiccups.
- Reused auth/session state instead of duplicating listeners
  - `components/Navbar.tsx` and `components/BottomNav.tsx` now consume `useAuth()` (from `lib/auth-context.tsx`) instead of creating their own `onAuthStateChange` subscriptions. This removes duplicated listeners and repeated `getSession`/profile queries.
- Lighter, optional health checks
  - `hooks/useSupabaseHealth.ts` avoids overlapping pings, reduces retries, and supports optional polling. By default it runs once with a short delay to avoid contending with first-paint data queries.
- Maintained a single browser Supabase client
  - `lib/supabase.ts` already provided a singleton with low E/S settings (limited realtime rate, custom headers). This remains the single source of truth.

## Why this helps

- Fewer parallel auth listeners = fewer redundant calls and less memory/CPU in long sessions.
- Timeouts + restrained retries reduce hanging requests and shorten recovery from transient issues.
- Server routes use the same fetch behavior, so uploads/webhooks benefit from the same resilience.
- Health checks no longer compete with critical data fetches or pile up during slow networks.

## Operational suggestions (optional)

These do not change code, but can further improve latency and throughput:

1. Prefer the direct Supabase project URL
   - Use `https://<project-ref>.supabase.co` in `NEXT_PUBLIC_SUPABASE_URL` instead of a custom reverse proxy, unless you have a specific CDN need. Extra hops can add latency.
2. Ensure Postgres indices
   - Common filters should have indices: `events(status)`, `events(start_date)`, `events(category)`, `registrations(user_id)`, `registrations(event_id)`, `profiles(id)`.
3. Avoid `select('*')` on hot paths
   - The optimized hooks already select explicit columns. If you add new screens, follow that pattern for best performance.
4. Tune Realtime if unused
   - If realtime channels are not required, disable them per-page or globally to reduce WebSocket overhead.

## Files touched

- lib/supabase.ts (exported `supabaseFetch`)
- lib/supabase-admin.ts (uses shared fetch)
- app/api/upload/route.ts (user storage client uses shared fetch)
- app/api/webhooks/email/route.ts (admin client uses shared fetch)
- hooks/useSupabaseHealth.ts (lighter, optional polling)
- components/Navbar.tsx (uses AuthContext)
- components/BottomNav.tsx (uses AuthContext)

No UI was changed; behavior remains the same, with fewer duplicate requests and more robust networking.
