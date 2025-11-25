import React from 'react';
import Link from 'next/link';
import ParticipantEventCard from './ParticipantEventCard';
import UpcomingEventsWidget from '@/components/UpcomingEventsWidget';

interface ParticipantViewProps {
    registrations: any[];
}

export default function ParticipantView({ registrations }: ParticipantViewProps) {
    const upcomingEvents = registrations.map((reg: any) => reg.events).filter(Boolean);

    return (
        <div>
            {/* Upcoming Events Widget */}
            <div className="mb-8">
                <UpcomingEventsWidget events={upcomingEvents} />
            </div>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">My Registrations</h2>

            {registrations.length === 0 ? (
                <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm p-12 text-center border border-gray-100 dark:border-gray-800 animate-fade-in">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        No registrations yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                        Explore our events and find something that interests you!
                    </p>
                    <Link
                        href="/events"
                        className="inline-flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl transition-all font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                        Browse Events
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6">
                    {registrations.map((registration) => (
                        <ParticipantEventCard
                            key={registration.id}
                            registration={registration}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
