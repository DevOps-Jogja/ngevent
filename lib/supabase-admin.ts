import { createClient } from '@supabase/supabase-js';
import { supabaseFetch } from '@/lib/supabase';

/**
 * Supabase Admin Client (Service Role)
 * Centralizes creation + validation to avoid scattered env checks.
 * Returns null when service role key is missing so callers can gracefully fallback.
 */
export interface SupabaseAdminClientResult {
    client: ReturnType<typeof createClient> | null;
    reason?: string; // populated when client is null
}

let cached: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdminClient(): SupabaseAdminClientResult {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
        if (process.env.NODE_ENV === 'development') {
            console.log('[supabase-admin] Missing env vars', {
                NEXT_PUBLIC_SUPABASE_URL: !!url,
                SUPABASE_SERVICE_ROLE_KEY: !!serviceKey,
            });
        }
        return {
            client: null,
            reason: !url && !serviceKey
                ? 'missing_url_and_service_key'
                : !url
                    ? 'missing_url'
                    : 'missing_service_key'
        };
    }

    if (cached) return { client: cached };

    cached = createClient(url, serviceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
        global: {
            headers: {
                'x-client-info': 'ngevent-admin',
            },
            fetch: supabaseFetch,
        },
    });

    return { client: cached };
}
