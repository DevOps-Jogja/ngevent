'use client';

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useLanguage } from "@/lib/language-context";
import { useEventsWithSpeakers } from "@/hooks/useSupabaseQuery";
import { EventCardSkeletonGrid } from "@/components/EventCardSkeleton";

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
    const pastEvents = events.filter((event: EventWithSpeakers) => new Date(event.start_date) < now).slice(0, 6);
    const displayEvents = showUpcoming ? upcomingEvents : pastEvents;

    // Handle error state with user-friendly message
    if (isError) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-dark-primary">
                <Navbar />
                <div className="container mx-auto px-4 py-12 max-w-4xl">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                        <div className="flex items-start gap-4">
                            <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
                                    {(error as any)?.message?.includes('timeout') ? 'Request Timeout' : 'Gagal Memuat Data'}
                                </h3>
                                <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                                    {(error as any)?.message?.includes('timeout')
                                        ? 'Server membutuhkan waktu terlalu lama. Silakan coba refresh halaman.'
                                        : 'Terjadi kesalahan saat memuat event. Silakan coba lagi.'}
                                </p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                >
                                    Refresh Halaman
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
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="mb-8 lg:mb-12">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 lg:mb-8">
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

                        {/* Events Grid */}
                        {loading ? (
                            <EventCardSkeletonGrid count={6} />
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
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                {displayEvents.map((event: EventWithSpeakers) => (
                                    <EventCard key={event.id} event={event} t={t} />
                                ))}
                            </div>
                        )}

                        {/* View All Button */}
                        {displayEvents.length > 0 && (
                            <div className="mt-12 text-left">
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

function EventCard({ event, t }: { event: EventWithSpeakers; t: (key: string) => string }) {
    const eventDate = new Date(event.start_date);

    return (
        <Link href={`/events/${event.id}`}>
            <div className="group bg-white dark:bg-dark-card rounded-xl shadow-md dark:shadow-xl hover:shadow-2xl dark:hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 h-full flex flex-col hover:-translate-y-1">
                {/* Event Image */}
                {event.image_url ? (
                    <div className="aspect-[4/5] overflow-hidden bg-gray-200 dark:bg-gray-700 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={event.image_url}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Category Badge on Image */}
                        {event.category && (
                            <div className="absolute top-3 left-3">
                                <span className="px-3 py-1 text-xs font-semibold bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white backdrop-blur-sm rounded-full shadow-lg">
                                    {event.category}
                                </span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="aspect-[4/5] bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center relative">
                        <svg className="w-16 h-16 text-primary-400 dark:text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {/* Category Badge */}
                        {event.category && (
                            <div className="absolute top-3 left-3">
                                <span className="px-3 py-1 text-xs font-semibold text-primary-600 dark:text-primary-400 bg-white dark:bg-gray-900 rounded-full shadow-lg">
                                    {event.category}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Event Content */}
                <div className="p-5 flex flex-col flex-1">
                    {/* Date & Time */}
                    <div className="flex items-center gap-2 mb-3 text-sm text-gray-600 dark:text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">
                            {format(eventDate, 'dd MMM yyyy', { locale: id })} • {format(eventDate, 'HH:mm', { locale: id })}
                        </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {event.title}
                    </h3>

                    {/* Location */}
                    {event.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="line-clamp-1">{event.location}</span>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        {/* Speakers */}
                        <div className="flex items-center gap-2">
                            {event.speakers && event.speakers.length > 0 ? (
                                <>
                                    <div className="flex -space-x-2">
                                        {event.speakers.slice(0, 3).map((speaker, idx) => (
                                            <div
                                                key={idx}
                                                className="w-7 h-7 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full border-2 border-white dark:border-dark-card flex items-center justify-center text-white text-xs font-semibold overflow-hidden"
                                            >
                                                {speaker.photo_url ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={speaker.photo_url} alt={speaker.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    speaker.name.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                                        {event.speakers.length} {event.speakers.length === 1 ? 'speaker' : 'speakers'}
                                    </span>
                                </>
                            ) : (
                                <span className="text-xs text-gray-500 dark:text-gray-400">No speakers yet</span>
                            )}
                        </div>

                        {/* Price Badge */}
                        {event.registration_fee && event.registration_fee > 0 ? (
                            <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                                Rp {(event.registration_fee / 1000).toFixed(0)}K
                            </span>
                        ) : (
                            <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                FREE
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
