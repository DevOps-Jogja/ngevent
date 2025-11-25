import React from 'react';
import Link from 'next/link';

interface DashboardHeaderProps {
    user: any;
    profile: any;
}

export default function DashboardHeader({ user, profile }: DashboardHeaderProps) {
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    {getGreeting()}, <span className="text-primary-600 dark:text-primary-400">{displayName}</span>
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                    Here's what's happening with your events today.
                </p>
            </div>
            <div className="flex items-center gap-3">
                <Link
                    href="/profile/edit"
                    className="group flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:shadow-md"
                >
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <span>Edit Profile</span>
                </Link>
            </div>
        </div>
    );
}
