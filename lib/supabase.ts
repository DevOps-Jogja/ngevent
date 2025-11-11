import { createBrowserClient } from '@supabase/ssr';

/**
 * Singleton Supabase Browser Client
 * Menghindari multiple instance saat hot reload (Next.js dev) yang dapat menyebabkan
 * intermiten koneksi & duplikasi realtime channel.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Global fetch with timeout + retry for more resilient networking in the browser
const DEFAULT_TIMEOUT_MS = 20000; // 20s
const MAX_FETCH_RETRIES = 2; // total attempts = 1 + retries

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Status codes that are usually transient and safe to retry
const RETRY_STATUS = new Set([408, 429, 500, 502, 503, 504]);

export async function supabaseFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    let attempt = 0;
    let lastError: any = null;

    while (attempt <= MAX_FETCH_RETRIES) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

        try {
            const res = await fetch(input, {
                ...init,
                signal: controller.signal,
                // Keepalive can help some browsers when navigating
                // keepalive helps some browsers maintain the request during navigation; not typed in older TS lib versions
                // @ts-ignore
                keepalive: init?.keepalive ?? true,
            } as RequestInit);

            clearTimeout(id);

            if (!RETRY_STATUS.has(res.status)) {
                return res; // success or non-retryable status
            }

            lastError = new Error(`HTTP ${res.status}`);
            if (process.env.NODE_ENV === 'development') {
                console.warn(`[supabaseFetch] Retryable status ${res.status} on attempt ${attempt + 1}`);
            }
        } catch (err: any) {
            clearTimeout(id);
            lastError = err;
            if (err?.name !== 'AbortError') {
                if (process.env.NODE_ENV === 'development') {
                    console.warn(`[supabaseFetch] Network error on attempt ${attempt + 1}:`, err?.message || err);
                }
            } else if (process.env.NODE_ENV === 'development') {
                console.warn(`[supabaseFetch] Request timeout after ${DEFAULT_TIMEOUT_MS}ms (attempt ${attempt + 1})`);
            }
        }

        // Retry with backoff if attempts remain
        attempt++;
        if (attempt <= MAX_FETCH_RETRIES) {
            const backoff = 500 * Math.pow(2, attempt - 1); // 500ms, 1000ms
            await delay(backoff);
            continue;
        }
        break;
    }

    throw lastError ?? new Error('Network request failed');
}

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
            fetch: supabaseFetch,
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
