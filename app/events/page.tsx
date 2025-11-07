'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useSearchParams } from 'next/navigation';
import { CATEGORIES } from '@/lib/constants';
import { useLanguage } from '@/lib/language-context';
import { useEventsWithSpeakers } from '@/hooks/useSupabaseQuery';
import { EventCardSkeletonGrid } from '@/components/EventCardSkeleton';

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
    speakers: Array<{
        id: string;
        name: string;
        title: string;
        photo_url: string;
        order_index: number;
    }>;
};

function EventsContent() {
    const { t } = useLanguage();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState(() => searchParams.get('category') || 'all');

    // Menggunakan React Query hook dengan optimized query
    const { data: allEvents = [], isLoading: loading, isError, error } = useEventsWithSpeakers(
        categoryFilter !== 'all' ? categoryFilter : undefined,
        searchQuery || undefined
    );

    // Client-side filtering untuk search (karena sudah di-optimize di server)
    const filteredEvents = allEvents.filter((event) => {
        if (searchQuery) {
            return event.title.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return true;
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-primary">
            <Navbar />

            <div className="container mx-auto px-4 py-12 max-w-7xl">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{t('events.title')}</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        {t('events.subtitle')}
                    </p>

                    {/* Active Category Badge */}
                    {categoryFilter !== 'all' && (
                        <div className="mt-4 flex items-center gap-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">{t('events.filterBy')}</span>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-full">
                                <span className="text-primary-700 dark:text-primary-300 font-medium">
                                    {CATEGORIES.find(c => c.value === categoryFilter)?.icon} {categoryFilter}
                                </span>
                                <button
                                    onClick={() => setCategoryFilter('all')}
                                    className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Search and Filter */}
                <div className="mb-8 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder={t('events.search')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                        />
                    </div>
                    <div className="relative md:w-64">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                        </div>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="w-full pl-12 pr-10 py-3 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white appearance-none cursor-pointer transition-all duration-200"
                        >
                            <option value="all">{t('events.allCategories')}</option>
                            {CATEGORIES.map((category) => (
                                <option key={category.value} value={category.value}>
                                    {category.icon} {category.label}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Events Grid */}
                {loading ? (
                    <EventCardSkeletonGrid count={9} />
                ) : filteredEvents.length === 0 ? (
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
                                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                            />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t('events.noEvents')}</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {t('events.noEventsDesc')}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEvents.map((event) => (
                            <EventCard key={event.id} event={event} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function EventCard({ event }: { event: EventWithSpeakers }) {
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
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
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

export default function EventsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center">Loading...</div>
                </div>
            </div>
        }>
            <EventsContent />
        </Suspense>
    );
}
