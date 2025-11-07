'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function NavigationLoader() {
    const [loading, setLoading] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setLoading(false);
    }, [pathname]);

    // Listen for navigation start
    useEffect(() => {
        const handleStart = () => setLoading(true);
        const handleComplete = () => setLoading(false);

        // These events are triggered by Next.js router
        window.addEventListener('beforeunload', handleStart);

        return () => {
            window.removeEventListener('beforeunload', handleStart);
        };
    }, []);

    if (!loading) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-50">
            <div className="h-1 bg-blue-600 dark:bg-blue-400 animate-progress-bar shadow-lg"></div>
        </div>
    );
}
