'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { refreshAuthSession } from '@/lib/storage-cleanup';
import { getCache, setCache, clearCache, CacheKeys, CACHE_DURATION } from '@/lib/cache-helpers';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    signOut: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [retryCount, setRetryCount] = useState(0);
    const [connectionStatus, setConnectionStatus] = useState<'checking' | 'ok' | 'retrying' | 'error'>('checking');

    useEffect(() => {
        let mounted = true;

        async function initAuth() {
            setConnectionStatus('checking');
            try {
                const session = await getSessionWithRetry();
                if (!mounted) return;
                setUser(session?.user ?? null);
                if (session?.user) {
                    await loadProfile(session.user.id);
                    setConnectionStatus('ok');
                } else {
                    setConnectionStatus('ok');
                    setLoading(false);
                }
            } catch (err: any) {
                console.error('❌ Auth initialization error:', err?.message || err);
                if (mounted) {
                    setConnectionStatus('error');
                    setLoading(false);
                }
            }
        }

        async function loadProfile(userId: string) {
            try {
                // Check cache first
                const cached = getCache<Profile>(CacheKeys.profile(userId));
                if (cached) {
                    console.log('📦 Profile loaded from cache (AuthContext)');
                    setProfile(cached);
                    setLoading(false);

                    // Fetch fresh data in background
                    fetchAndCacheProfile(userId);
                    return;
                }

                // Fetch from Supabase
                await fetchAndCacheProfile(userId);
            } catch (error) {
                console.error('Error loading profile:', error);
                setLoading(false);
            }
        }

        async function fetchAndCacheProfile(userId: string) {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (error) throw error;

                // Update state and cache
                setProfile(data);
                setCache(CacheKeys.profile(userId), data, CACHE_DURATION.PROFILE);
            } finally {
                setLoading(false);
            }
        }

        // Jalankan hanya sekali (duplikasi sebelumnya dihapus)
        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
            if (!mounted) return;
            if (process.env.NODE_ENV === 'development') {
                console.log('🔐 Auth state changed:', _event);
            }
            setUser(session?.user ?? null);
            if (session?.user) {
                loadProfile(session.user.id);
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [retryCount]);

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);

        // Clear all caches on logout
        if (user) {
            clearCache(CacheKeys.profile(user.id));
            clearCache(CacheKeys.userEvents(user.id));
            clearCache(CacheKeys.userRegistrations(user.id));
            clearCache(CacheKeys.notifications(user.id));
            clearCache(CacheKeys.dashboardStats(user.id));
        }
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, signOut }}>
            {children}
            {/* Optional: bisa dipakai jika ingin expose status ke UI */}
            {/* connectionStatus: {connectionStatus} */}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

/**
 * Mendapatkan session dengan retry & exponential backoff.
 */
async function getSessionWithRetry(maxAttempts: number = 2): Promise<{ user: User } | null> {
    let attempt = 0;
    let lastError: any = null;
    while (attempt <= maxAttempts) {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            return session as any;
        } catch (err: any) {
            lastError = err;
            attempt++;
            if (attempt > maxAttempts) break;
            const delay = 500 * attempt; // 500ms, 1000ms
            if (process.env.NODE_ENV === 'development') {
                console.warn(`⚠️ getSession retry ${attempt}/${maxAttempts} after error:`, err?.message || err);
            }
            await new Promise(res => setTimeout(res, delay));
        }
    }
    throw lastError || new Error('Unknown session error');
}
