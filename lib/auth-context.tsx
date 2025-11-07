'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { refreshAuthSession } from '@/lib/storage-cleanup';

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

    useEffect(() => {
        let mounted = true;

        async function initAuth() {
            try {
                // Get initial session
                const { data: { session }, error } = await supabase.auth.getSession();

                if (!mounted) return;

                // If error getting session, try to refresh
                if (error) {
                    console.warn('⚠️ Error getting session:', error.message);

                    // Try refresh once
                    if (retryCount === 0) {
                        console.log('🔄 Attempting session refresh...');
                        setRetryCount(1);
                        await refreshAuthSession();
                        return; // Will re-run via auth state change
                    } else {
                        // Give up after one retry
                        console.error('❌ Session recovery failed');
                        setLoading(false);
                        return;
                    }
                }

                setUser(session?.user ?? null);
                if (session?.user) {
                    loadProfile(session.user.id);
                } else {
                    setLoading(false);
                }
            } catch (err) {
                console.error('❌ Auth initialization error:', err);
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        initAuth();

        initAuth();

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
            if (!mounted) return;

            console.log('🔐 Auth state changed:', _event);

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

    const loadProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            setProfile(data);
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, signOut }}>
            {children}
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
