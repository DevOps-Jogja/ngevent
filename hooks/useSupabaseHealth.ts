"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type HealthStatus = 'checking' | 'ok' | 'retrying' | 'error';

export function useSupabaseHealth() {
    const [status, setStatus] = useState<HealthStatus>('checking');

    useEffect(() => {
        let cancelled = false;

        async function check(attempt = 0) {
            try {
                // Query ringan untuk test koneksi
                const { error } = await supabase
                    .from('events')
                    .select('id', { head: true, count: 'exact' })
                    .limit(1);

                if (cancelled) return;
                if (error) throw error;
                setStatus('ok');
            } catch (e) {
                if (attempt < 2) {
                    setStatus('retrying');
                    setTimeout(() => check(attempt + 1), 800 * (attempt + 1));
                } else {
                    setStatus('error');
                }
            }
        }

        check();
        return () => {
            cancelled = true;
        };
    }, []);

    return status;
}
