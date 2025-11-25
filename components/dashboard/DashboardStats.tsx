import React from 'react';

interface DashboardStatsProps {
    role: 'participant' | 'organizer';
    totalEvents: number;
    activeEvents: number;
    thisMonthEvents: number;
}

export default function DashboardStats({ role, totalEvents, activeEvents, thisMonthEvents }: DashboardStatsProps) {
    const stats = [
        {
            label: role === 'organizer' ? 'Total Events' : 'Events Joined',
            value: totalEvents,
            subtext: role === 'organizer' ? 'Events created' : 'All time',
            icon: (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
            color: 'bg-blue-500',
            gradient: 'from-blue-500 to-blue-600'
        },
        {
            label: 'Active',
            value: activeEvents,
            subtext: role === 'organizer' ? 'Published events' : 'Upcoming events',
            icon: (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'bg-green-500',
            gradient: 'from-green-500 to-green-600'
        },
        {
            label: 'This Month',
            value: thisMonthEvents,
            subtext: 'New activity',
            icon: (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            ),
            color: 'bg-purple-500',
            gradient: 'from-purple-500 to-purple-600'
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 animate-fade-in">
            {stats.map((stat, index) => (
                <div
                    key={stat.label}
                    className="relative overflow-hidden bg-white dark:bg-dark-card rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-800"
                    style={{ animationDelay: `${index * 0.1}s` }}
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</h3>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{stat.subtext}</p>
                        </div>
                        <div className={`p-3 rounded-xl ${stat.gradient} bg-gradient-to-br shadow-lg shadow-blue-500/20`}>
                            {stat.icon}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
