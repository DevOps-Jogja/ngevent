'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    cleanupStorage,
    fullStorageReset,
    getSupabaseStorageKeys,
    isStorageCorrupted,
    refreshAuthSession
} from '@/lib/storage-cleanup';
import { supabase } from '@/lib/supabase';

export default function DebugStoragePage() {
    const router = useRouter();
    const [storageKeys, setStorageKeys] = useState<string[]>([]);
    const [isCorrupted, setIsCorrupted] = useState(false);
    const [sessionInfo, setSessionInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkStorage();
    }, []);

    async function checkStorage() {
        setLoading(true);

        // Check if corrupted
        setIsCorrupted(isStorageCorrupted());

        // Get all Supabase keys
        setStorageKeys(getSupabaseStorageKeys());

        // Get session info
        try {
            const { data, error } = await supabase.auth.getSession();
            setSessionInfo({
                hasSession: !!data.session,
                user: data.session?.user?.email || 'No user',
                error: error?.message || null,
            });
        } catch (err: any) {
            setSessionInfo({
                hasSession: false,
                user: 'Error',
                error: err.message,
            });
        }

        setLoading(false);
    }

    async function handleCleanup() {
        if (confirm('Bersihkan storage Supabase? (Anda akan logout)')) {
            cleanupStorage();
            await supabase.auth.signOut();
            alert('Storage dibersihkan! Refresh halaman.');
            window.location.reload();
        }
    }

    async function handleRefresh() {
        await refreshAuthSession();
        alert('Session di-refresh! Cek console.');
        await checkStorage();
    }

    function handleFullReset() {
        if (confirm('⚠️ RESET TOTAL? Semua data login akan hilang!')) {
            if (confirm('Yakin? Ini akan menghapus SEMUA data storage.')) {
                fullStorageReset();
                alert('Reset complete! Halaman akan reload.');
                window.location.href = '/';
            }
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                    <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
                        🔧 Storage Debugging
                    </h1>

                    {/* Status Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-300">
                                Storage Status
                            </h3>
                            <p className={`text-lg ${isCorrupted ? 'text-red-600' : 'text-green-600'}`}>
                                {isCorrupted ? '❌ Corrupted' : '✅ OK'}
                            </p>
                        </div>

                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                            <h3 className="font-semibold mb-2 text-purple-900 dark:text-purple-300">
                                Session Status
                            </h3>
                            {loading ? (
                                <p className="text-gray-600">Loading...</p>
                            ) : (
                                <div>
                                    <p className={`text-lg ${sessionInfo?.hasSession ? 'text-green-600' : 'text-red-600'}`}>
                                        {sessionInfo?.hasSession ? '✅ Active' : '❌ No Session'}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {sessionInfo?.user}
                                    </p>
                                    {sessionInfo?.error && (
                                        <p className="text-xs text-red-600 mt-1">
                                            Error: {sessionInfo.error}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Storage Keys */}
                    <div className="mb-8">
                        <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">
                            Supabase Storage Keys ({storageKeys.length})
                        </h3>
                        {storageKeys.length > 0 ? (
                            <ul className="bg-gray-100 dark:bg-gray-700 rounded p-4 space-y-1">
                                {storageKeys.map((key, idx) => (
                                    <li key={idx} className="font-mono text-sm text-gray-800 dark:text-gray-200">
                                        • {key}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-600 dark:text-gray-400">No Supabase keys found</p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-4">
                        <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">
                            Actions
                        </h3>

                        <button
                            onClick={handleRefresh}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition"
                        >
                            🔄 Refresh Session
                        </button>

                        <button
                            onClick={handleCleanup}
                            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-3 px-4 rounded-lg transition"
                        >
                            🧹 Cleanup Supabase Storage (Logout)
                        </button>

                        <button
                            onClick={handleFullReset}
                            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg transition"
                        >
                            ⚠️ FULL RESET (Clear Everything)
                        </button>

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg transition"
                        >
                            🔄 Reload Page
                        </button>

                        <button
                            onClick={() => router.push('/')}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition"
                        >
                            🏠 Back to Home
                        </button>
                    </div>

                    {/* Instructions */}
                    <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <h3 className="font-semibold mb-2 text-yellow-900 dark:text-yellow-300">
                            💡 Troubleshooting Tips
                        </h3>
                        <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                            <li>1. Jika data tidak muncul di browser normal tapi OK di incognito → Klik "Cleanup Supabase Storage"</li>
                            <li>2. Jika masih bermasalah → Klik "FULL RESET"</li>
                            <li>3. Setelah cleanup/reset → Login ulang</li>
                            <li>4. Alternatif: Clear browser cache/cookies secara manual</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
