export default function CreateEventSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-primary animate-fade-in pb-20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header Skeleton */}
                <div className="mb-10 text-center">
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-64 mx-auto mb-4 animate-skeleton"></div>
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-96 mx-auto animate-skeleton"></div>
                </div>

                {/* Tabs Skeleton */}
                <div className="mb-8 flex justify-center">
                    <div className="flex gap-2 p-1 bg-white/50 dark:bg-dark-card/50 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl w-32 animate-skeleton"></div>
                        ))}
                    </div>
                </div>

                {/* Form Skeleton */}
                <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
                    <div className="space-y-8">
                        <div className="border-b border-gray-100 dark:border-gray-700 pb-6">
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2 animate-skeleton"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-skeleton"></div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                            {/* Left Column Skeleton */}
                            <div className="lg:col-span-4">
                                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2 animate-skeleton"></div>
                                <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-700 rounded-xl animate-skeleton"></div>
                            </div>

                            {/* Right Column Skeleton */}
                            <div className="lg:col-span-8 space-y-6">
                                {[1, 2, 3].map((i) => (
                                    <div key={i}>
                                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2 animate-skeleton"></div>
                                        <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-skeleton"></div>
                                    </div>
                                ))}

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2 animate-skeleton"></div>
                                        <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-skeleton"></div>
                                    </div>
                                    <div>
                                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2 animate-skeleton"></div>
                                        <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-skeleton"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
