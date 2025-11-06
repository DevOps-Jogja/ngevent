import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables!');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
}

// Supabase client dengan optimasi
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
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
            eventsPerSecond: 2, // Limit realtime events untuk mengurangi beban
        },
    },
});

// Helper untuk timeout queries
export async function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number = 10000
): Promise<T> {
    const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    );
    return Promise.race([promise, timeout]);
}
