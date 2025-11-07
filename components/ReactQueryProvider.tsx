'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

export default function ReactQueryProvider({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 2 * 60 * 1000, // 2 minutes - data dianggap fresh
                        gcTime: 10 * 60 * 1000, // 10 minutes - cache cleanup (formerly cacheTime)
                        refetchOnWindowFocus: false, // Tidak refetch saat window focus
                        refetchOnReconnect: true, // Refetch saat reconnect
                        refetchOnMount: true, // Refetch saat component mount jika data stale
                        retry: 3, // Retry 3x jika gagal
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
