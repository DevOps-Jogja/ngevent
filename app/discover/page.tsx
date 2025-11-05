'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { CATEGORIES } from '@/lib/constants';
import { useLanguage } from '@/lib/language-context';

interface CategoryCount {
    category: string;
    count: number;
    icon: string;
    color: string;
}

const initialCategories: CategoryCount[] = CATEGORIES.map(cat => ({
    category: cat.value,
    count: 0,
    icon: cat.icon,
    color: cat.color,
}));

export default function DiscoverPage() {
    const { t } = useLanguage();
    const [categoryCounts, setCategoryCounts] = useState<CategoryCount[]>(initialCategories);
    const [loading, setLoading] = useState(true);
    const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

    useEffect(() => {
        loadCategoryCounts();
        loadUpcomingEvents();
    }, []);

    const loadCategoryCounts = async () => {
        try {
            const { data: events } = await supabase
                .from('events')
                .select('category')
                .eq('status', 'published');

            if (events) {
                const counts = initialCategories.map((cat: CategoryCount) => {
                    const count = events.filter((e: any) => e.category === cat.category).length;
                    return { ...cat, count };
                });
                setCategoryCounts(counts);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadUpcomingEvents = async () => {
        try {
            const now = new Date().toISOString();
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('status', 'published')
                .gte('start_date', now)
                .order('start_date', { ascending: true })
                .limit(6);

            if (error) throw error;
            setUpcomingEvents(data || []);
        } catch (error) {
            console.error('Error loading upcoming events:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-primary">
            <Navbar />

            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 md:py-12 max-w-7xl">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-6 sm:mb-8 md:mb-12">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 md:mb-4">
                            {t('discover.title')}
                        </h1>
                        <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
                            {t('discover.subtitle')}
                        </p>
                    </div>

                    {/* Browse by Category */}
                    <div className="mb-6 sm:mb-8 md:mb-10">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                            {t('discover.browseByCategory')}
                        </h2>

                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {categoryCounts.map((category) => (
                                <Link
                                    key={category.category}
                                    href={`/events?category=${encodeURIComponent(category.category)}`}
                                    className="group"
                                >
                                    <div className="bg-white dark:bg-dark-card rounded-lg sm:rounded-xl shadow-md dark:shadow-xl p-3 sm:p-4 md:p-6 border border-transparent dark:border-gray-700 hover:shadow-lg dark:hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95">
                                        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                                            <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center text-lg sm:text-xl md:text-2xl shadow-lg flex-shrink-0`}>
                                                {category.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                                                    {category.category}
                                                </h3>
                                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                                    {loading ? '...' : `${category.count} ${t('discover.events')}`}
                                                </p>
                                            </div>
                                            <svg
                                                className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-600 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors flex-shrink-0"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Upcoming Events Section */}
                    <div className="mt-8 sm:mt-10 md:mt-12">
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                {t('home.upcoming')} {t('discover.events')}
                            </h2>
                            <Link
                                href="/events"
                                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm sm:text-base font-semibold flex items-center gap-1 sm:gap-2"
                            >
                                <span className="hidden sm:inline">{t('home.viewAll')}</span>
                                <span className="sm:hidden">{t('home.viewAll').split(' ')[0]}</span>
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="bg-white dark:bg-dark-card rounded-lg sm:rounded-xl shadow-md dark:shadow-xl overflow-hidden border border-transparent dark:border-gray-700 animate-pulse">
                                        <div className="h-40 sm:h-44 md:h-48 bg-gray-200 dark:bg-gray-700"></div>
                                        <div className="p-3 sm:p-4">
                                            <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                                            <div className="h-2 sm:h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : upcomingEvents.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                                {upcomingEvents.map((event) => (
                                    <Link
                                        key={event.id}
                                        href={`/events/${event.id}`}
                                        className="group bg-white dark:bg-dark-card rounded-lg sm:rounded-xl shadow-md dark:shadow-xl overflow-hidden border border-transparent dark:border-gray-700 hover:shadow-lg dark:hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
                                    >
                                        {event.image_url ? (
                                            <div className="aspect-[4/5] overflow-hidden">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={event.image_url}
                                                    alt={event.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                />
                                            </div>
                                        ) : (
                                            <div className="aspect-[4/5] bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center">
                                                <svg className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-primary-400 dark:text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        )}
                                        <div className="p-3 sm:p-4">
                                            {event.category && (
                                                <span className="inline-block px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 rounded-full mb-2">
                                                    {event.category}
                                                </span>
                                            )}
                                            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                {event.title}
                                            </h3>
                                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2 sm:mb-3">
                                                {event.description}
                                            </p>
                                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span className="truncate">
                                                    {new Date(event.start_date).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-dark-card rounded-lg sm:rounded-xl shadow-md dark:shadow-xl p-6 sm:p-8 md:p-12 border border-transparent dark:border-gray-700 text-center">
                                <svg className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto text-gray-400 dark:text-gray-600 mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    {t('home.noUpcoming')}
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
                                    {t('home.noUpcomingDesc')}
                                </p>
                                <Link
                                    href="/events"
                                    className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-primary-600 dark:bg-primary-500 text-white text-sm sm:text-base font-semibold rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
                                >
                                    {t('home.viewAll')}
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
