'use client';

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useState } from "react";
import { useLanguage } from "@/lib/language-context";
import { useEventsWithSpeakers } from "@/hooks/useSupabaseQuery";
import { EventCardSkeletonGrid, TimelineEventSkeletonList } from "@/components/EventCardSkeleton";
import TimelineEventList from "@/components/TimelineEventList";

type EventWithSpeakers = {
    id: string;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    location: string;
    category: string;
    capacity: number;
    registration_fee: number;
    image_url: string;
    status: string;
    organizer_id: string;
    created_at: string;
    speakers: Array<{
        id: string;
        name: string;
        title: string;
        company: string;
        bio: string;
        photo_url: string;
        linkedin_url: string;
        twitter_url: string;
        website_url: string;
        order_index: number;
    }>;
};

export default function HomePage() {
    const { t } = useLanguage();
    const [showUpcoming, setShowUpcoming] = useState(true);

    // Menggunakan React Query hook untuk fetch data dengan caching dan retry
    const { data: events = [], isLoading: loading, isError, error } = useEventsWithSpeakers();

    // Filter events berdasarkan upcoming/past
    const now = new Date();
    const upcomingEvents = events.filter((event: EventWithSpeakers) => new Date(event.start_date) >= now).slice(0, 6);
    const pastEvents = events
        .filter((event: EventWithSpeakers) => new Date(event.start_date) < now)
        .sort((a: EventWithSpeakers, b: EventWithSpeakers) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
        .slice(0, 6);
    const displayEvents = showUpcoming ? upcomingEvents : pastEvents;

    // Handle error state with user-friendly message
    if (isError) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-dark-primary">
                <Navbar />
                <div className="container mx-auto px-4 py-12 content-align-navbar">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                        <div className="flex items-start gap-4">
                            <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
                                    {(error as any)?.message?.includes('timeout') ? t('common.requestTimeout') : t('common.loadFailed')}
                                </h3>
                                <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                                    {(error as any)?.message?.includes('timeout')
                                        ? t('common.serverTimeout')
                                        : t('common.loadError')}
                                </p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                >
                                    {t('common.refreshPage')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-primary transition-colors">
            <Navbar />

            {/* Events Section */}
            <section className="pt-6 pb-20 lg:pt-12 lg:pb-[120px] bg-gray-50 dark:bg-dark-primary min-h-screen">
                <div className="container mx-auto px-4 content-align-navbar">
                    <div className="mb-8 lg:mb-12">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 lg:mb-12">
                            <div>
                                <h2 className="text-2xl lg:text-3xl xl:text-[40px] font-bold text-gray-900 dark:text-white leading-tight">
                                    {t('home.title')}
                                </h2>
                                <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400 mt-2">
                                    {t('home.subtitle')}
                                </p>
                            </div>

                            {/* Toggle Switch */}
                            <div className="inline-flex w-full md:w-auto rounded-lg bg-gray-100 dark:bg-dark-card p-1 border border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => setShowUpcoming(true)}
                                    className={`flex-1 md:flex-none whitespace-nowrap px-4 md:px-6 py-2.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${showUpcoming
                                        ? 'bg-primary-600 dark:bg-primary-500 text-white shadow-sm'
                                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                >
                                    {t('home.upcoming')}
                                </button>
                                <button
                                    onClick={() => setShowUpcoming(false)}
                                    className={`flex-1 md:flex-none whitespace-nowrap px-4 md:px-6 py-2.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${!showUpcoming
                                        ? 'bg-primary-600 dark:bg-primary-500 text-white shadow-sm'
                                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                >
                                    {t('home.past')}
                                </button>
                            </div>
                        </div>

                        {/* Events List */}
                        {loading ? (
                            <TimelineEventSkeletonList count={6} />
                        ) : displayEvents.length === 0 ? (
                            <div className="text-center py-12">
                                <svg
                                    className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                                    {showUpcoming ? t('home.noUpcoming') : t('home.noPast')}
                                </h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    {showUpcoming ? t('home.noUpcomingDesc') : t('home.noPastDesc')}
                                </p>
                            </div>
                        ) : (
                            <TimelineEventList
                                events={displayEvents}
                                t={t}
                                sortDirection={showUpcoming ? 'asc' : 'desc'}
                            />
                        )}

                        {/* View All Button */}
                        {displayEvents.length > 0 && (
                            <div className="mt-12 text-center">
                                <Link
                                    href="/events"
                                    className="inline-flex items-center gap-2 px-8 py-3 bg-primary-600 dark:bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
                                >
                                    {t('home.viewAll')}
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
