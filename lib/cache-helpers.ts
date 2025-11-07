/**
 * Cache Helpers - LocalStorage & SessionStorage utilities
 * Reduces Supabase requests by caching data locally
 */

// Cache durations in milliseconds
export const CACHE_DURATION = {
    PROFILE: 5 * 60 * 1000,        // 5 minutes - user profile
    EVENTS: 2 * 60 * 1000,         // 2 minutes - event list
    EVENT_DETAIL: 3 * 60 * 1000,   // 3 minutes - single event
    REGISTRATIONS: 1 * 60 * 1000,  // 1 minute - user registrations
    NOTIFICATIONS: 30 * 1000,      // 30 seconds - notifications
    STATS: 5 * 60 * 1000,          // 5 minutes - dashboard stats
} as const;

interface CacheItem<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

/**
 * Set data in localStorage with expiration
 */
export function setCache<T>(key: string, data: T, duration: number): void {
    try {
        const now = Date.now();
        const item: CacheItem<T> = {
            data,
            timestamp: now,
            expiresAt: now + duration,
        };
        localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
        console.warn('Failed to set cache:', error);
    }
}

/**
 * Get data from localStorage if not expired
 */
export function getCache<T>(key: string): T | null {
    try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;

        const item: CacheItem<T> = JSON.parse(cached);
        const now = Date.now();

        // Check if expired
        if (now > item.expiresAt) {
            localStorage.removeItem(key);
            return null;
        }

        return item.data;
    } catch (error) {
        console.warn('Failed to get cache:', error);
        return null;
    }
}

/**
 * Clear specific cache key
 */
export function clearCache(key: string): void {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.warn('Failed to clear cache:', error);
    }
}

/**
 * Clear all cache with specific prefix
 */
export function clearCacheByPrefix(prefix: string): void {
    try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(prefix)) {
                localStorage.removeItem(key);
            }
        });
    } catch (error) {
        console.warn('Failed to clear cache by prefix:', error);
    }
}

/**
 * Clear all expired cache items
 */
export function clearExpiredCache(): void {
    try {
        const keys = Object.keys(localStorage);
        const now = Date.now();

        keys.forEach(key => {
            try {
                const item = localStorage.getItem(key);
                if (!item) return;

                const parsed = JSON.parse(item);
                if (parsed.expiresAt && now > parsed.expiresAt) {
                    localStorage.removeItem(key);
                }
            } catch {
                // Skip invalid items
            }
        });
    } catch (error) {
        console.warn('Failed to clear expired cache:', error);
    }
}

/**
 * Session storage helpers (cleared when browser closes)
 */
export function setSessionCache<T>(key: string, data: T): void {
    try {
        sessionStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.warn('Failed to set session cache:', error);
    }
}

export function getSessionCache<T>(key: string): T | null {
    try {
        const cached = sessionStorage.getItem(key);
        return cached ? JSON.parse(cached) : null;
    } catch (error) {
        console.warn('Failed to get session cache:', error);
        return null;
    }
}

/**
 * Cache key generators
 */
export const CacheKeys = {
    profile: (userId: string) => `profile:${userId}`,
    events: (filter?: string) => `events:${filter || 'all'}`,
    eventDetail: (eventId: string) => `event:${eventId}`,
    userRegistrations: (userId: string) => `registrations:${userId}`,
    eventRegistrations: (eventId: string) => `event-registrations:${eventId}`,
    notifications: (userId: string) => `notifications:${userId}`,
    dashboardStats: (userId: string) => `dashboard-stats:${userId}`,
    userEvents: (userId: string) => `user-events:${userId}`,
} as const;

/**
 * Invalidate related caches when data changes
 */
export function invalidateRelatedCaches(type: 'event' | 'registration' | 'profile', id?: string) {
    switch (type) {
        case 'event':
            // Clear all event caches
            clearCacheByPrefix('events:');
            clearCacheByPrefix('user-events:');
            if (id) clearCache(CacheKeys.eventDetail(id));
            break;

        case 'registration':
            // Clear registration and event caches
            clearCacheByPrefix('registrations:');
            clearCacheByPrefix('event-registrations:');
            clearCacheByPrefix('dashboard-stats:');
            if (id) clearCache(CacheKeys.eventDetail(id));
            break;

        case 'profile':
            // Clear profile cache
            if (id) clearCache(CacheKeys.profile(id));
            clearCacheByPrefix('dashboard-stats:');
            break;
    }
}

/**
 * Cache statistics (for debugging)
 */
export function getCacheStats() {
    try {
        const keys = Object.keys(localStorage);
        const now = Date.now();
        let valid = 0;
        let expired = 0;
        let invalid = 0;

        keys.forEach(key => {
            try {
                const item = localStorage.getItem(key);
                if (!item) {
                    invalid++;
                    return;
                }

                const parsed = JSON.parse(item);
                if (parsed.expiresAt) {
                    if (now > parsed.expiresAt) {
                        expired++;
                    } else {
                        valid++;
                    }
                } else {
                    invalid++;
                }
            } catch {
                invalid++;
            }
        });

        return { total: keys.length, valid, expired, invalid };
    } catch (error) {
        return { total: 0, valid: 0, expired: 0, invalid: 0 };
    }
}
