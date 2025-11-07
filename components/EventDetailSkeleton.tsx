export default function EventDetailSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg animate-fade-in">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Hero Image Skeleton */}
                <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-2xl mb-8 animate-skeleton"></div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Title Skeleton */}
                        <div className="bg-white dark:bg-dark-card rounded-xl shadow-md dark:shadow-xl p-6 border border-transparent dark:border-gray-700">
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 mb-4 animate-skeleton"></div>
                            <div className="flex flex-wrap gap-2 mb-4">
                                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-24 animate-skeleton"></div>
                                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-24 animate-skeleton"></div>
                            </div>
                        </div>

                        {/* Description Skeleton */}
                        <div className="bg-white dark:bg-dark-card rounded-xl shadow-md dark:shadow-xl p-6 border border-transparent dark:border-gray-700">
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4 animate-skeleton"></div>
                            <div className="space-y-3">
                                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-skeleton"></div>
                                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-skeleton"></div>
                                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4 animate-skeleton"></div>
                            </div>
                        </div>

                        {/* Speakers Skeleton */}
                        <div className="bg-white dark:bg-dark-card rounded-xl shadow-md dark:shadow-xl p-6 border border-transparent dark:border-gray-700">
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4 animate-skeleton"></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[1, 2].map((i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-skeleton"></div>
                                        <div className="flex-1">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2 animate-skeleton"></div>
                                            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-24 animate-skeleton"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Registration Card Skeleton */}
                        <div className="bg-white dark:bg-dark-card rounded-xl shadow-md dark:shadow-xl p-6 border border-transparent dark:border-gray-700 sticky top-24">
                            <div className="space-y-4">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-skeleton"></div>
                                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-skeleton"></div>
                                <div className="space-y-2">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="flex justify-between">
                                            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-24 animate-skeleton"></div>
                                            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-32 animate-skeleton"></div>
                                        </div>
                                    ))}
                                </div>
                                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-skeleton"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
