import React from 'react';
import { useRegistrationsCount } from '@/hooks/useSupabaseQuery';

interface RegistrationsStatProps {
    eventId: string;
    capacity?: number | null;
}

export default function RegistrationsStat({ eventId, capacity }: RegistrationsStatProps) {
    const { data: count = 0 } = useRegistrationsCount(eventId);
    const hasCap = typeof capacity === 'number' && capacity > 0;
    const pct = hasCap ? Math.min(100, Math.round((count / (capacity as number)) * 100)) : null;

    return (
        <div className="min-w-0 w-full">
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">Registrants</span>
                <span className="text-xs font-medium text-gray-900 dark:text-white">
                    {count}{hasCap ? ` / ${capacity}` : ''}
                </span>
            </div>
            {hasCap && (
                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${(pct || 0) >= 100 ? 'bg-red-500' :
                                (pct || 0) >= 80 ? 'bg-yellow-500' : 'bg-primary-500'
                            }`}
                        style={{ width: `${pct}%` }}
                    />
                </div>
            )}
        </div>
    );
}
