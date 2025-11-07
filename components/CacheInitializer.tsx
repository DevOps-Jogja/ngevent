/**
 * Cache Initializer Component
 * Initializes cache cleanup on app mount
 */

'use client';

import { useEffect } from 'react';
import { initCacheCleanup } from '@/lib/cache-cleanup';

export default function CacheInitializer() {
    useEffect(() => {
        // Initialize cache cleanup
        const cleanup = initCacheCleanup();

        // Return cleanup function
        return cleanup;
    }, []);

    return null; // This component renders nothing
}
