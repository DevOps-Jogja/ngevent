'use client';

export default function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-primary animate-fade-in">
            <div className="container mx-auto px-4 py-12 max-w-7xl">
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Profile Section Skeleton */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-transparent dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 flex-1">
                                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-skeleton"></div>
                                <div className="space-y-2 flex-1">
                                    <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-skeleton"></div>
                                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-skeleton"></div>
                                </div>
                            </div>
                            <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-skeleton"></div>
                        </div>
                    </div>

                    {/* Stats Section Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-transparent dark:border-gray-700">
                                <div className="space-y-3">
                                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-skeleton"></div>
                                    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-skeleton"></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Events Section Skeleton */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-transparent dark:border-gray-700">
                        <div className="flex items-center justify-between mb-6">
                            <div className="h-7 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-skeleton"></div>
                            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-skeleton"></div>
                        </div>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="border dark:border-gray-700 rounded-lg p-4">
                                    <div className="space-y-3">
                                        <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-skeleton"></div>
                                        <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-skeleton"></div>
                                        <div className="flex gap-2 mt-4">
                                            <div className="h-9 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-skeleton"></div>
                                            <div className="h-9 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-skeleton"></div>
                                            <div className="h-9 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-skeleton"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Registrations Section Skeleton */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-transparent dark:border-gray-700">
                        <div className="h-7 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-skeleton mb-6"></div>
                        <div className="space-y-4">
                            {[1, 2].map((i) => (
                                <div key={i} className="border dark:border-gray-700 rounded-lg p-4">
                                    <div className="space-y-3">
                                        <div className="h-6 w-2/3 bg-gray-200 dark:bg-gray-700 rounded animate-skeleton"></div>
                                        <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded animate-skeleton"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
