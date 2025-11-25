import React from 'react';
import Link from 'next/link';
import OrganizerEventCard from './OrganizerEventCard';

interface OrganizerViewProps {
    events: any[];
    onDelete: (id: string, title: string) => void;
}

export default function OrganizerView({ events, onDelete }: OrganizerViewProps) {
    return (
        <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Events</h2>
                <Link
                    href="/dashboard/events/create"
                    className="w-full sm:w-auto bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-6 py-2.5 rounded-xl text-center text-sm font-medium transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                    + Create Event
                </Link>
            </div>

            {events.length === 0 ? (
                <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm p-12 text-center border border-gray-100 dark:border-gray-800 animate-fade-in">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        No events yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                        Start your journey by creating your first event. It only takes a few minutes!
                    </p>
                    <Link
                        href="/dashboard/events/create"
                        className="inline-flex items-center justify-center px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium"
                    >
                        Create Event
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6">
                    {events.map((event) => (
                        <OrganizerEventCard
                            key={event.id}
                            event={event}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
