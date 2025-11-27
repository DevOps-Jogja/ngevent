'use client';

import { useState, Suspense, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useSearchParams } from 'next/navigation';
import { CATEGORIES } from '@/lib/constants';
import { useLanguage } from '@/lib/language-context';
import { useEventsWithSpeakers } from '@/hooks/useSupabaseQuery';
import { EventCardSkeletonGrid, TimelineEventSkeletonList } from '@/components/EventCardSkeleton';
import TimelineEventList from '@/components/TimelineEventList';

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
    profiles?: {
        full_name: string;
        avatar_url: string | null;
    } | null;
};

function EventsContent() {
    const { t } = useLanguage();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState(() => searchParams.get('category') || 'all');
    const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Menggunakan React Query hook dengan optimized query
    const { data: filteredEvents = [], isLoading: loading, isError, error } = useEventsWithSpeakers(
        categoryFilter !== 'all' ? categoryFilter : undefined,
        debouncedSearchQuery || undefined
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-primary">
            <Navbar />

            <div className="container mx-auto px-4 py-12 content-align-navbar">
                {/* Page Header */}
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
                        {t('events.title')}
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed max-w-3xl mx-auto">
                        {t('events.subtitle')}
                    </p>

                    {/* Search Bar */}
                    <div className="relative max-w-2xl mx-auto">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <svg className="h-6 w-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder={t('events.search')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                        />
                    </div>
                </div>

                {/* Category Filter - Horizontal Scroll */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:justify-center">
                        <button
                            onClick={() => setCategoryFilter('all')}
                            className={`flex-shrink-0 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border ${categoryFilter === 'all'
                                ? 'bg-primary-600 text-white border-primary-600 shadow-md transform scale-105'
                                : 'bg-white dark:bg-dark-card text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                        >
                            {t('events.allCategories')}
                        </button>
                        {CATEGORIES.map((category) => (
                            <button
                                key={category.value}
                                onClick={() => setCategoryFilter(category.value)}
                                className={`flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border ${categoryFilter === category.value
                                    ? 'bg-primary-600 text-white border-primary-600 shadow-md transform scale-105'
                                    : 'bg-white dark:bg-dark-card text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                            >
                                {category.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* View Toggle & Results Count */}
                <div className="flex flex-row items-center justify-between gap-4 mb-8">
                    <div className="text-gray-600 dark:text-gray-400 font-medium text-sm sm:text-base">
                        {!loading && (
                            <>
                                {filteredEvents.length} {filteredEvents.length === 1 ? t('events.eventFound') : t('events.eventsFound')}
                            </>
                        )}
                    </div>

                    <div className="flex bg-white dark:bg-dark-card p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${viewMode === 'grid'
                                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            title={t('common.gridView')}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            <span className="hidden sm:inline">{t('common.grid')}</span>
                        </button>
                        <button
                            onClick={() => setViewMode('timeline')}
                            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${viewMode === 'timeline'
                                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            title={t('common.timelineView')}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            <span className="hidden sm:inline">{t('common.timeline')}</span>
                        </button>
                    </div>
                </div>

                {/* Events Grid/Timeline */}
                {loading ? (
                    viewMode === 'grid' ? (
                        <EventCardSkeletonGrid count={9} />
                    ) : (
                        <TimelineEventSkeletonList count={6} />
                    )
                ) : filteredEvents.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="max-w-md mx-auto">
                            <svg
                                className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600 mb-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                />
                            </svg>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                {searchQuery || categoryFilter !== 'all' ? t('events.noResults') : t('events.noEvents')}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                {searchQuery || categoryFilter !== 'all'
                                    ? t('events.noResultsDesc')
                                    : t('events.noEventsDesc')
                                }
                            </p>
                            {(searchQuery || categoryFilter !== 'all') && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setCategoryFilter('all');
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    {t('common.clearFilters')}
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                            {filteredEvents.map((event: EventWithSpeakers) => (
                                <EventCard key={event.id} event={event} />
                            ))}
                        </div>
                    ) : (
                        <TimelineEventList
                            events={filteredEvents}
                            t={t}
                            sortDirection="desc"
                        />
                    )
                )}
            </div>
        </div>
    );
}

function EventCard({ event }: { event: EventWithSpeakers }) {
    const { t } = useLanguage();
    const eventDate = new Date(event.start_date);

    return (
        <Link href={`/events/${event.id}`} className="group h-full">
            <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800 h-full flex flex-col overflow-hidden hover:-translate-y-1">
                {/* Image Container */}
                <div className="relative aspect-[4/5] overflow-hidden bg-gray-100 dark:bg-gray-800">
                    {event.image_url ? (
                        <Image
                            src={event.image_url}
                            alt={event.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
                            <span className="text-4xl">📅</span>
                        </div>
                    )}

                    {/* Floating Category Badge */}
                    <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/95 dark:bg-gray-900/95 text-gray-900 dark:text-white backdrop-blur-sm shadow-sm border border-gray-200/50 dark:border-gray-700/50">
                            {event.category}
                        </span>
                    </div>

                    {/* Date Badge */}
                    <div className="absolute top-4 right-4 flex flex-col items-center justify-center w-12 h-12 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50">
                        <span className="text-xs font-bold text-red-500 uppercase">
                            {format(eventDate, 'MMM', { locale: id })}
                        </span>
                        <span className="text-lg font-bold text-gray-900 dark:text-white leading-none">
                            {format(eventDate, 'dd', { locale: id })}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                    {/* Date and Time Info */}
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-3">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="line-clamp-1">
                            {format(new Date(event.start_date), 'dd MMM yyyy, HH:mm', { locale: id })}
                            {event.end_date && ` - ${format(new Date(event.end_date), 'HH:mm', { locale: id })}`}
                        </span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {event.title}
                    </h3>

                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-3">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="line-clamp-1">{event.location || t('common.onlineEvent')}</span>
                    </div>

                    {/* Organizer Info */}
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-6">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-xs text-gray-500 dark:text-gray-500">{t('common.by')}</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                            {event.profiles?.full_name || 'Unknown'}
                        </span>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                        {/* Speakers */}
                        <div className="flex items-center -space-x-2">
                            {event.speakers?.slice(0, 3).map((speaker, idx) => (
                                <div key={idx} className="w-8 h-8 rounded-full border-2 border-white dark:border-dark-card bg-gray-200 overflow-hidden relative" title={speaker.name}>
                                    {speaker.photo_url ? (
                                        <Image src={speaker.photo_url} alt={speaker.name} fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600 text-xs font-bold">
                                            {speaker.name[0]}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {event.speakers?.length > 3 && (
                                <div className="w-8 h-8 rounded-full border-2 border-white dark:border-dark-card bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
                                    +{event.speakers.length - 3}
                                </div>
                            )}
                        </div>

                        {/* Price */}
                        <div className="text-right">
                            {event.registration_fee === 0 ? (
                                <span className="inline-block px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm font-bold">
                                    {t('common.free')}
                                </span>
                            ) : (
                                <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                                    Rp {(event.registration_fee / 1000).toFixed(0)}k
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default function EventsPage() {
    const { t } = useLanguage();
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Navbar />
                <div className="container mx-auto px-4 py-8 content-align-navbar">
                    <div className="text-center">{t('common.loading')}</div>
                </div>
            </div>
        }>
            <EventsContent />
        </Suspense>
    );
}
