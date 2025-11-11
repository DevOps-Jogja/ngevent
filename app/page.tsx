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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    return (
        <Link href={`/events/${event.id}`}>
            <div className="bg-white dark:bg-dark-card rounded-xl shadow-md dark:shadow-xl hover:shadow-xl dark:hover:shadow-2xl transition-all overflow-hidden border border-gray-200 dark:border-gray-700 h-full flex flex-col">
                {/* Event Image */}
                {event.image_url ? (
                    <div className="aspect-[4/5] bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={event.image_url}
                            alt={event.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                    </div>
                ) : (
                    <div className="aspect-[4/5] bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center flex-shrink-0">
                        <svg className="w-16 h-16 text-primary-400 dark:text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}

                {/* Event Content */}
                <div className="p-6 flex flex-col flex-1">
                    {/* Category Badge */}
                    {event.category && (
                        <span className="inline-block self-start px-3 py-1 text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 rounded-full mb-3">
                            {event.category}
                        </span>
                    )}

                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                        {event.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 text-sm flex-1">
                        {event.description}
                    </p>

                    {/* Speakers */}
                    {event.speakers && event.speakers.length > 0 && (
                        <div className="mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                                Speakers:
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {event.speakers.slice(0, 3).map((speaker, index) => (
                                    <span
                                        key={speaker.id}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-dark-secondary rounded-full text-xs text-gray-700 dark:text-gray-300"
                                    >
                                        {speaker.photo_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={speaker.photo_url}
                                                alt={speaker.name}
                                                className="w-4 h-4 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center text-white text-[8px] font-semibold">
                                                {speaker.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <span className="font-medium">{speaker.name}</span>
                                    </span>
                                ))}
                                {event.speakers.length > 3 && (
                                    <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 dark:bg-dark-secondary rounded-full text-xs text-gray-600 dark:text-gray-400">
                                        +{event.speakers.length - 3} more
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Event Info */}
                    <div className="space-y-2">
                        {/* Date & Time */}
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <svg className="w-5 h-5 mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium">
                                {format(new Date(event.start_date), 'dd MMM yyyy', { locale: id })}
                            </span>
                            <span className="mx-2">•</span>
                            <span>
                                {format(new Date(event.start_date), 'HH:mm', { locale: id })}
                            </span>
                        </div>

                        {/* Location */}
                        {event.location && (
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                <svg className="w-5 h-5 mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="line-clamp-1">
                                    {event.location}
                                </span>
                            </div>
                        )}

                        {/* Registration Fee */}
                        <div className="flex items-center justify-between pt-2">
                            {event.registration_fee && event.registration_fee > 0 ? (
                                <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 dark:text-primary-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Rp {event.registration_fee.toLocaleString('id-ID')}
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-2 py-1 text-xs font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded-full">
                                    FREE
                                </span>
                            )}

                            <span className="text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                                {t('common.viewDetails')} →
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
