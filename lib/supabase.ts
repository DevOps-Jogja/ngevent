import { createBrowserClient } from '@supabase/ssr';

/**
 * Singleton Supabase Browser Client
 * Menghindari multiple instance saat hot reload (Next.js dev) yang dapat menyebabkan
 * intermiten koneksi & duplikasi realtime channel.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // Jangan throw di sini agar build tetap jalan; cukup log jelas.
    console.error('❌ Missing Supabase env vars:');
    console.error('  NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? 'Set' : 'Missing');
    console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'Set' : 'Missing');
}

declare global {
    // eslint-disable-next-line no-var
    var __SUPABASE_CLIENT__: ReturnType<typeof createBrowserClient> | undefined;
}

function createClient() {
    return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
        },
        db: {
            schema: 'public',
        },
        global: {
            headers: {
                'x-client-info': 'ngevent-web',
            },
        },
        realtime: {
            params: {
                eventsPerSecond: 2,
            },
        },
    });
}

if (!globalThis.__SUPABASE_CLIENT__) {
    globalThis.__SUPABASE_CLIENT__ = createClient();
    if (process.env.NODE_ENV === 'development') {
        // Ringkas agar tidak spam di console.
        console.log('🟢 Supabase client initialized (singleton)');
    }
} else if (process.env.NODE_ENV === 'development') {
    console.log('♻️ Reusing existing Supabase client');
}

export const supabase = globalThis.__SUPABASE_CLIENT__!;

// Helper timeout generic (dipakai di beberapa util lain)
export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> {
    const timeout = new Promise<never>((_, reject) => {
        const id = setTimeout(() => {
            clearTimeout(id);
            reject(new Error(`Request timeout after ${timeoutMs}ms`));
        }, timeoutMs);
    });
    return Promise.race([promise, timeout]);
}
