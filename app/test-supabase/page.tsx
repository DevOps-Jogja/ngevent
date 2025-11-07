'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestSupabasePage() {
    const [status, setStatus] = useState<string>('Testing...');
    const [events, setEvents] = useState<any[]>([]);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        async function testConnection() {
            try {
                setStatus('🔍 Testing basic query...');

                // Test 1: Simple query
                const { data: simpleData, error: simpleError } = await supabase
                    .from('events')
                    .select('id, title')
                    .limit(5);

                if (simpleError) {
                    console.error('Simple query error:', simpleError);
                    setError(simpleError);
                    setStatus('❌ Simple query failed');
                    return;
                }

                setStatus('✅ Simple query success! Testing with speakers...');
                console.log('Simple query result:', simpleData);

                // Test 2: Query with speakers JOIN
                const { data: joinData, error: joinError } = await supabase
                    .from('events')
                    .select(`
                        id,
                        title,
                        speakers (
                            id,
                            name
                        )
                    `)
                    .limit(5);

                if (joinError) {
                    console.error('JOIN query error:', joinError);
                    setError(joinError);
                    setStatus('❌ JOIN query failed');
                    return;
                }

                setStatus('✅ All tests passed!');
                setEvents(joinData || []);
                console.log('JOIN query result:', joinData);

            } catch (err: any) {
                console.error('Test error:', err);
                setError(err);
                setStatus('❌ Test failed with exception');
            }
        }

        testConnection();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
                    Supabase Connection Test
                </h1>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                        Status
                    </h2>
                    <p className="text-lg text-gray-700 dark:text-gray-300">{status}</p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4 text-red-900 dark:text-red-200">
                            Error Details
                        </h2>
                        <pre className="text-sm text-red-700 dark:text-red-300 overflow-auto">
                            {JSON.stringify(error, null, 2)}
                        </pre>
                    </div>
                )}

                {events.length > 0 && (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4 text-green-900 dark:text-green-200">
                            Events Retrieved ({events.length})
                        </h2>
                        <pre className="text-sm text-green-700 dark:text-green-300 overflow-auto max-h-96">
                            {JSON.stringify(events, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
