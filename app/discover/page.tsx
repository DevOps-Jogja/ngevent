'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { CATEGORIES } from '@/lib/constants';
import { useLanguage } from '@/lib/language-context';
import type { UpcomingEvent } from '@/lib/types';
import { useCategoryCounts, useUpcomingEvents } from '@/hooks/useSupabaseQuery';
import { EventCardSkeletonGrid } from '@/components/EventCardSkeleton';

interface CategoryCount {
    category: string;
    count: number;
    icon: string;
    path: string;
    color: string;
    iconColor: string;
    iconBg: string;
}

export default function DiscoverPage() {
    const { t } = useLanguage();

    // Menggunakan React Query hooks
    const { data: categoryCounts = {}, isLoading: loadingCounts } = useCategoryCounts();
    const { data: upcomingEvents = [], isLoading: loadingEvents } = useUpcomingEvents(6);

    // Map category counts ke format yang dibutuhkan
    const categoryList = CATEGORIES.map(cat => ({
        category: cat.value,
        count: categoryCounts[cat.value] || 0,
        icon: cat.icon,
        path: cat.path,
        color: cat.color,
        iconColor: cat.iconColor,
        iconBg: cat.iconBg,
    }));

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-primary">
            <Navbar />

            <div className="container mx-auto px-4 py-8 md:py-12 content-align-navbar">
                {/* Header */}
                <div className="mb-12 text-center sm:text-left">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
                        {t('discover.title')}
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
                        {t('discover.subtitle')}
                    </p>
                </div>

                {/* Browse by Category */}
                <div className="mb-16">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {t('discover.browseByCategory')}
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        {categoryList.map((category) => (
                            <Link
                                key={category.category}
                                href={`/events?category=${encodeURIComponent(category.category)}`}
                                className="group relative overflow-hidden"
                            >
                                <div className="bg-white dark:bg-dark-card rounded-2xl p-4 shadow-sm hover:shadow-xl dark:shadow-none dark:hover:shadow-2xl dark:hover:shadow-primary-900/20 border border-gray-100 dark:border-gray-800 hover:border-primary-100 dark:hover:border-gray-700 transition-all duration-300 hover:-translate-y-1 h-full flex flex-col items-center text-center sm:items-start sm:text-left">
                                    <div className={`w-12 h-12 rounded-2xl ${category.iconBg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                                        <svg className={`w-6 h-6 ${category.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={category.path} />
                                        </svg>
                                    </div>

                                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                        {category.category}
                                    </h3>

                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                        {loadingCounts ? (
                                            <span className="animate-pulse">...</span>
                                        ) : (
                                            `${category.count} ${t('discover.events')}`
                                        )}
                                    </p>

                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0">
                                        <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Upcoming Events Section */}
                <div>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {t('home.upcoming')} {t('discover.events')}
                        </h2>
                        <Link
                            href="/events"
                            className="group flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
                        >
                            {t('home.viewAll')}
                            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>

                    {loadingEvents ? (
                        <EventCardSkeletonGrid count={6} />
                    ) : upcomingEvents.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {upcomingEvents.map((event: UpcomingEvent) => (
                                <Link
                                    key={event.id}
                                    href={`/events/${event.id}`}
                                    className="group bg-white dark:bg-dark-card rounded-2xl shadow-sm hover:shadow-xl dark:shadow-none dark:hover:shadow-2xl dark:hover:shadow-primary-900/10 overflow-hidden border border-gray-100 dark:border-gray-800 transition-all duration-300 hover:-translate-y-1"
                                >
                                    <div className="aspect-[4/3] overflow-hidden relative">
                                        {event.image_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={event.image_url}
                                                alt={event.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center">
                                                <svg className="w-12 h-12 text-primary-400 dark:text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                        {event.category && (
                                            <div className="absolute top-3 left-3">
                                                <span className="px-3 py-1 text-xs font-bold text-white bg-black/50 backdrop-blur-md rounded-full border border-white/20">
                                                    {event.category}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-5">
                                        <div className="flex items-center gap-2 text-xs font-medium text-primary-600 dark:text-primary-400 mb-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            {new Date(event.start_date).toLocaleDateString('id-ID', {
                                                weekday: 'long',
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </div>

                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                            {event.title}
                                        </h3>

                                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                                            {event.description}
                                        </p>

                                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span className="truncate max-w-[150px]">{event.location || t('common.online')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm p-12 text-center border border-gray-100 dark:border-gray-800">
                            <div className="w-20 h-20 mx-auto bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                                <svg className="w-10 h-10 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                {t('home.noUpcoming')}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                                {t('home.noUpcomingDesc')}
                            </p>
                            <Link
                                href="/events"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20"
                            >
                                {t('home.viewAll')}
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
