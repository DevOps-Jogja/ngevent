'use client';

export default function EventCardSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden animate-fade-in">
            {/* Image skeleton */}
            <div className="h-48 bg-gray-200 dark:bg-gray-700 animate-skeleton"></div>

            <div className="p-6 space-y-4">
                {/* Category badge skeleton */}
                <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full animate-skeleton"></div>

                {/* Title skeleton */}
                <div className="space-y-2">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-skeleton"></div>
                    <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-skeleton"></div>
                </div>

                {/* Date and location skeleton */}
                <div className="space-y-2">
                    <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-skeleton"></div>
                    <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded animate-skeleton"></div>
                </div>

                {/* Organizer skeleton */}
                <div className="flex items-center space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-skeleton"></div>
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-skeleton"></div>
                </div>
            </div>
        </div>
    );
}

export function EventCardSkeletonGrid({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, index) => (
                <EventCardSkeleton key={index} />
            ))}
        </div>
    );
}
