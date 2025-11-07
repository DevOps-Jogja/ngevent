/**
 * Cache Cleanup Utilities
 * Automatically cleans expired cache items
 */

'use client';

import { clearExpiredCache, getCacheStats } from '@/lib/cache-helpers';

/**
 * Initialize cache cleanup on app load
 */
export function initCacheCleanup() {
    if (typeof window === 'undefined') return;

    // Clear expired cache on page load
    clearExpiredCache();

    // Setup periodic cleanup (every 5 minutes)
    const cleanupInterval = setInterval(() => {
        clearExpiredCache();

        if (process.env.NODE_ENV === 'development') {
            const stats = getCacheStats();
            console.log('🧹 Cache cleanup completed:', stats);
        }
    }, 5 * 60 * 1000); // 5 minutes

    // Cleanup before page unload
    window.addEventListener('beforeunload', () => {
        clearExpiredCache();
    });

    // Return cleanup function
    return () => {
        clearInterval(cleanupInterval);
    };
}

/**
 * Manual cache cleanup (for debugging)
 */
export function manualCacheCleanup() {
    if (typeof window === 'undefined') return;

    clearExpiredCache();
    const stats = getCacheStats();

    console.log('🧹 Manual cache cleanup completed');
    console.log('Cache stats:', stats);

    return stats;
}

/**
 * Clear all app caches (for debugging/troubleshooting)
 */
export function clearAllAppCaches() {
    if (typeof window === 'undefined') return;

    // Get list of all cache keys
    const keys = Object.keys(localStorage);

    // Clear only app-specific caches (not other site data)
    const appCachePrefixes = [
        'profile:',
        'events:',
        'event:',
        'registrations:',
        'event-registrations:',
        'notifications:',
        'dashboard-stats:',
        'user-events:',
    ];

    let cleared = 0;
    keys.forEach(key => {
        if (appCachePrefixes.some(prefix => key.startsWith(prefix))) {
            localStorage.removeItem(key);
            cleared++;
        }
    });

    console.log(`🧹 Cleared ${cleared} cache items`);
    return cleared;
}
