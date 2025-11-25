'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

export default function ReactQueryProvider({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 10 * 60 * 1000, // 10 minutes - data considered fresh (increased from 2min)
                        gcTime: 30 * 60 * 1000, // 30 minutes - cache cleanup (increased from 10min)
                        refetchOnWindowFocus: false, // Don't refetch on window focus
                        refetchOnReconnect: true, // Refetch on reconnect
                        refetchOnMount: true, // Refetch on mount if data is stale
                        retry: (failureCount, error: any) => {
                            console.log('🔄 React Query retry check:', { failureCount, error: error?.message });
                            // Don't retry on timeout errors
                            if (error?.message?.includes('timeout')) {
                                console.warn('⏱️ Request timeout - not retrying');
                                return false;
                            }
                            // Retry up to 2 times (reduced from 3)
                            return failureCount < 2;
                        },
                        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
                    },
                    mutations: {
                        retry: 1, // Retry 1x untuk mutations
                        retryDelay: 1000,
                    },
                },
            })
    );

    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
