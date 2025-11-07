export default function CreateEventSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg animate-fade-in">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header Skeleton */}
                <div className="mb-8">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-48 mb-4 animate-skeleton"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 animate-skeleton"></div>
                </div>

                {/* Tabs Skeleton */}
                <div className="flex gap-2 mb-6 overflow-x-auto">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-32 animate-skeleton"></div>
                    ))}
                </div>

                {/* Form Skeleton */}
                <div className="bg-white dark:bg-dark-card rounded-xl shadow-md dark:shadow-xl p-6 border border-transparent dark:border-gray-700">
                    <div className="space-y-6">
                        {/* Form fields */}
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i}>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2 animate-skeleton"></div>
                                <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-skeleton"></div>
                            </div>
                        ))}

                        {/* Image upload skeleton */}
                        <div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2 animate-skeleton"></div>
                            <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-lg animate-skeleton"></div>
                        </div>

                        {/* Editor skeleton */}
                        <div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2 animate-skeleton"></div>
                            <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-skeleton"></div>
                        </div>
                    </div>

                    {/* Action buttons skeleton */}
                    <div className="flex gap-3 mt-6">
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-24 animate-skeleton"></div>
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex-1 animate-skeleton"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
