'use client';

export default function PageLoadingSpinner() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm transition-opacity duration-300">
            <div className="flex flex-col items-center space-y-4">
                {/* Animated spinner */}
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-900 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
                </div>

                {/* Loading text with animation */}
                <div className="flex items-center space-x-1">
                    <span className="text-lg font-medium text-gray-700 dark:text-gray-300">Loading</span>
                    <span className="flex space-x-1">
                        <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                        <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                        <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                    </span>
                </div>
            </div>
        </div>
    );
}
