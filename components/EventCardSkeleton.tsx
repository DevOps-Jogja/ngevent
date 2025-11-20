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

export function TimelineEventSkeleton() {
    return (
        <div className="bg-white dark:bg-dark-card rounded-xl p-4 md:p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex gap-4 md:gap-6">
                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Time */}
                    <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-skeleton mb-1"></div>

                    {/* Title */}
                    <div className="space-y-2 mb-2">
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-skeleton"></div>
                        <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-skeleton"></div>
                    </div>

                    {/* Meta Info */}
                    <div className="space-y-1 mb-4">
                        {/* Organizer */}
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full animate-skeleton"></div>
                            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-skeleton"></div>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-skeleton"></div>
                            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-skeleton"></div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center gap-3">
                        <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-skeleton"></div>

                        {/* Speakers Avatars */}
                        <div className="flex -space-x-2">
                            <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full animate-skeleton"></div>
                            <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full animate-skeleton"></div>
                            <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full animate-skeleton"></div>
                        </div>
                    </div>
                </div>

                {/* Image Thumbnail */}
                <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-skeleton flex-shrink-0"></div>
            </div>
        </div>
    );
}

export function TimelineEventSkeletonList({ count = 6 }: { count?: number }) {
    return (
        <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-[120px] top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700 hidden md:block" />

            <div className="space-y-8">
                {/* Simulate grouped events by date */}
                {Array.from({ length: Math.ceil(count / 2) }).map((_, groupIndex) => (
                    <div key={groupIndex} className="relative md:flex gap-8">
                        {/* Date Column */}
                        <div className="md:w-[120px] flex-shrink-0 mb-4 md:mb-0 text-left md:text-right pt-2 relative z-10 pr-8">
                            <div className="md:sticky md:top-24">
                                <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-skeleton mb-1"></div>
                                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-skeleton"></div>
                            </div>
                        </div>

                        {/* Timeline Dot */}
                        <div className="absolute left-[120px] top-3 w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-gray-50 dark:border-dark-primary hidden md:block -translate-x-[5px]" />

                        {/* Events Column */}
                        <div className="flex-1 space-y-4">
                            {Array.from({ length: Math.min(2, count - groupIndex * 2) }).map((_, eventIndex) => (
                                <TimelineEventSkeleton key={`${groupIndex}-${eventIndex}`} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
