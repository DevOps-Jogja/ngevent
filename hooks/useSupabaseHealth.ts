"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type HealthStatus = 'checking' | 'ok' | 'retrying' | 'error';

export function useSupabaseHealth({ auto = false, intervalMs = 30000 }: { auto?: boolean; intervalMs?: number } = {}) {
    const [status, setStatus] = useState<HealthStatus>('checking');
    const [lastChecked, setLastChecked] = useState<number | null>(null);
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        let cancelled = false;
        let timer: NodeJS.Timeout | null = null;

        async function runCheck(attempt = 0) {
            if (cancelled || isChecking) return; // avoid overlapping checks
            setIsChecking(true);
            try {
                const { error } = await supabase
                    .from('events')
                    .select('id', { head: true, count: 'exact' })
                    .limit(1);

                if (cancelled) return;
                if (error) throw error;
                setStatus('ok');
            } catch (e) {
                if (attempt < 1) { // reduce retries to 1 (instead of 2) to cut load
                    setStatus('retrying');
                    setTimeout(() => runCheck(attempt + 1), 800);
                    return;
                }
                setStatus('error');
            } finally {
                setIsChecking(false);
                setLastChecked(Date.now());
            }
        }

        // Initial check (lazy: delay 1s to allow other critical queries first)
        const initial = setTimeout(() => runCheck(), 1000);

        if (auto) {
            timer = setInterval(() => {
                // Skip if recently checked (< interval/2) or already in progress
                if (isChecking) return;
                if (lastChecked && Date.now() - lastChecked < intervalMs / 2) return;
                runCheck();
            }, intervalMs);
        }

        return () => {
            cancelled = true;
            clearTimeout(initial);
            if (timer) clearInterval(timer);
        };
    }, [auto, intervalMs, lastChecked, isChecking]);

    return status;
}
