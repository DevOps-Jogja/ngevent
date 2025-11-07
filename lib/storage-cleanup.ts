'use client';

/**
 * Storage Cleanup Utility
 * Membersihkan corrupted auth data dan cache
 */

export function cleanupStorage() {
    if (typeof window === 'undefined') return;

    try {
        console.log('🧹 Cleaning up storage...');

        // List of keys to clean (Supabase auth keys)
        const supabaseKeys = [
            'supabase.auth.token',
            'sb-fimncnfsoorgxajdwjpc-auth-token',
            'supabase-auth-token',
        ];

        // Remove Supabase auth keys
        supabaseKeys.forEach(key => {
            if (localStorage.getItem(key)) {
                console.log(`Removing: ${key}`);
                localStorage.removeItem(key);
            }
            if (sessionStorage.getItem(key)) {
                console.log(`Removing from session: ${key}`);
                sessionStorage.removeItem(key);
            }
        });

        // Find and remove any key that contains 'supabase' or 'auth'
        Object.keys(localStorage).forEach(key => {
            if (key.includes('supabase') || key.includes('sb-')) {
                console.log(`Found and removing: ${key}`);
                localStorage.removeItem(key);
            }
        });

        console.log('✅ Storage cleanup complete');
    } catch (error) {
        console.error('❌ Storage cleanup failed:', error);
    }
}

/**
 * Force refresh auth session
 */
export async function refreshAuthSession() {
    if (typeof window === 'undefined') return;

    try {
        console.log('🔄 Refreshing auth session...');

        // Import dynamically to avoid SSR issues
        const { supabase } = await import('@/lib/supabase');

        const { data, error } = await supabase.auth.refreshSession();

        if (error) {
            console.error('❌ Session refresh failed:', error.message);
            // If refresh fails, sign out to clear corrupted session
            await supabase.auth.signOut();
            console.log('🔓 Signed out due to invalid session');
        } else {
            console.log('✅ Session refreshed successfully');
        }

        return data;
    } catch (error) {
        console.error('❌ Refresh error:', error);
    }
}

/**
 * Check if storage is corrupted
 */
export function isStorageCorrupted(): boolean {
    if (typeof window === 'undefined') return false;

    try {
        // Try to access localStorage
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return false;
    } catch (error) {
        console.error('⚠️ Storage is corrupted or blocked:', error);
        return true;
    }
}

/**
 * Get all Supabase-related storage keys
 */
export function getSupabaseStorageKeys(): string[] {
    if (typeof window === 'undefined') return [];

    const keys: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
            keys.push(key);
        }
    }

    return keys;
}

/**
 * Full system reset (use with caution!)
 */
export function fullStorageReset() {
    if (typeof window === 'undefined') return;

    const userPreferences = {
        theme: localStorage.getItem('theme'),
        language: localStorage.getItem('language'),
    };

    console.log('⚠️ Performing FULL storage reset...');

    // Clear everything
    localStorage.clear();
    sessionStorage.clear();

    // Restore user preferences
    if (userPreferences.theme) {
        localStorage.setItem('theme', userPreferences.theme);
    }
    if (userPreferences.language) {
        localStorage.setItem('language', userPreferences.language);
    }

    console.log('✅ Full reset complete, preferences restored');
    console.log('🔄 Please refresh the page');
}
