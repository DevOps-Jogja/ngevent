export default function EventDetailSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-primary animate-fade-in">
            <div className="container mx-auto px-4 py-8 md:py-12 content-align-navbar">
                {/* Breadcrumb Skeleton */}
                <div className="mb-4 sm:mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <div className="flex items-center gap-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-skeleton"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8 animate-skeleton"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-skeleton"></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-9 gap-4 sm:gap-6 lg:gap-8">
                    {/* Left Column - Image, Organizer, About, Registration */}
                    <div className="lg:col-span-3 space-y-4 sm:space-y-6">
                        {/* Event Image Skeleton */}
                        <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-skeleton animate-fade-in" style={{ animationDelay: '0.2s' }}></div>

                        {/* Organizer Section Skeleton */}
                        <div className="bg-white dark:bg-dark-card rounded-xl shadow-md dark:shadow-xl p-4 sm:p-5 border border-transparent dark:border-gray-700 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3 animate-skeleton"></div>
                            <div className="flex items-start gap-3">
                                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-skeleton"></div>
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-1 animate-skeleton"></div>
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-skeleton"></div>
                                </div>
                            </div>
                        </div>

                        {/* About Event Section Skeleton */}
                        <div className="bg-white dark:bg-dark-card rounded-xl shadow-md dark:shadow-xl p-4 sm:p-6 border border-transparent dark:border-gray-700 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4 animate-skeleton"></div>
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-skeleton"></div>
                                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-skeleton"></div>
                                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4 animate-skeleton"></div>
                                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-skeleton"></div>
                                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-2/3 animate-skeleton"></div>
                            </div>
                            <div className="mt-4">
                                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-20 animate-skeleton"></div>
                            </div>
                        </div>

                        {/* Registration Section Skeleton */}
                        <div className="bg-white dark:bg-dark-card rounded-xl shadow-md dark:shadow-xl p-4 sm:p-6 border border-transparent dark:border-gray-700 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-4 animate-skeleton"></div>
                            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 animate-skeleton"></div>
                            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-skeleton"></div>
                        </div>
                    </div>

                    {/* Right Column - Title, Date/Time, Location, Speakers */}
                    <div className="lg:col-span-6 space-y-4 sm:space-y-6">
                        {/* Title Skeleton */}
                        <div className="bg-white dark:bg-dark-card rounded-xl shadow-md dark:shadow-xl p-4 sm:p-6 border border-transparent dark:border-gray-700 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4 animate-skeleton"></div>
                            <div className="flex flex-wrap gap-2">
                                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20 animate-skeleton"></div>
                                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-24 animate-skeleton"></div>
                            </div>
                        </div>

                        {/* Date/Time and Location Skeleton */}
                        <div className="bg-white dark:bg-dark-card rounded-xl shadow-md dark:shadow-xl p-4 sm:p-6 border border-transparent dark:border-gray-700 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Date/Time */}
                                <div className="flex items-start gap-3 sm:gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-dark-secondary rounded-lg flex items-center justify-center animate-skeleton"></div>
                                    <div className="flex-1">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-1 animate-skeleton"></div>
                                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-skeleton"></div>
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="flex items-start gap-3 sm:gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-dark-secondary rounded-lg flex items-center justify-center animate-skeleton"></div>
                                    <div className="flex-1">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 mb-1 animate-skeleton"></div>
                                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-skeleton"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Capacity */}
                            <div className="flex items-start gap-3 sm:gap-4 mt-4">
                                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-dark-secondary rounded-lg flex items-center justify-center animate-skeleton"></div>
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-1 animate-skeleton"></div>
                                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-skeleton"></div>
                                </div>
                            </div>
                        </div>

                        {/* Speakers Section Skeleton */}
                        <div className="bg-white dark:bg-dark-card rounded-xl shadow-md dark:shadow-xl p-4 sm:p-6 border border-transparent dark:border-gray-700 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-4 animate-skeleton"></div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-skeleton"></div>
                                        <div className="flex-1">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1 animate-skeleton"></div>
                                            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-20 animate-skeleton"></div>
                                            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-16 animate-skeleton"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
