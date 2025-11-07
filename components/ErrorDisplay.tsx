'use client';

import { useEffect } from 'react';

export default function ErrorDisplay({
    error,
    reset
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Error:', error);
    }, [error]);

    const isTimeout = error.message?.includes('timeout');

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-primary px-4">
            <div className="max-w-md w-full">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4">
                    {/* Icon */}
                    <div className="flex justify-center">
                        {isTimeout ? (
                            <svg
                                className="w-16 h-16 text-yellow-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        ) : (
                            <svg
                                className="w-16 h-16 text-red-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        )}
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
                        {isTimeout ? 'Request Timeout' : 'Oops! Something went wrong'}
                    </h2>

                    {/* Message */}
                    <p className="text-center text-gray-600 dark:text-gray-400">
                        {isTimeout
                            ? 'Server membutuhkan waktu terlalu lama untuk merespons. Silakan coba lagi.'
                            : 'Terjadi kesalahan saat memuat data. Silakan coba lagi.'}
                    </p>

                    {/* Error details (only in development) */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs text-gray-700 dark:text-gray-300 overflow-auto max-h-32">
                            <code>{error.message}</code>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={reset}
                            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                        >
                            Coba Lagi
                        </button>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-3 px-4 rounded-lg transition-colors"
                        >
                            Kembali ke Home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
