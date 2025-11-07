export default function RegistrationsSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg animate-fade-in">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header Skeleton */}
                <div className="mb-8">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-64 mb-4 animate-skeleton"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 animate-skeleton"></div>
                </div>

                {/* Filters Skeleton */}
                <div className="bg-white dark:bg-dark-card rounded-xl shadow-md dark:shadow-xl p-6 mb-6 border border-transparent dark:border-gray-700">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-skeleton"></div>
                        </div>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg w-24 animate-skeleton"></div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Stats Cards Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white dark:bg-dark-card rounded-xl shadow-md dark:shadow-xl p-6 border border-transparent dark:border-gray-700">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2 animate-skeleton"></div>
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-skeleton"></div>
                        </div>
                    ))}
                </div>

                {/* Table Skeleton */}
                <div className="bg-white dark:bg-dark-card rounded-xl shadow-md dark:shadow-xl border border-transparent dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <th key={i} className="px-6 py-3">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-skeleton"></div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <tr key={i} className="border-t border-gray-200 dark:border-gray-700">
                                        {[1, 2, 3, 4, 5, 6].map((j) => (
                                            <td key={j} className="px-6 py-4">
                                                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-skeleton"></div>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
