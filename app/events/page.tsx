'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useSearchParams } from 'next/navigation';
import { CATEGORIES } from '@/lib/constants';
import { useLanguage } from '@/lib/language-context';

type Event = Database['public']['Tables']['events']['Row'];
type Speaker = Database['public']['Tables']['speakers']['Row'];

type EventWithSpeakers = Event & {
    speakers: Speaker[];
};

export default function EventsPage() {
    const { t } = useLanguage();
    const searchParams = useSearchParams();
    const [events, setEvents] = useState<EventWithSpeakers[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    useEffect(() => {
        // Read category from URL query parameter
        const categoryFromUrl = searchParams.get('category');
        if (categoryFromUrl) {
            setCategoryFilter(categoryFromUrl);
        }
        loadEvents();
    }, [searchParams]);

    const loadEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('status', 'published')
                .order('start_date', { ascending: true });

            if (error) throw error;

            // Load speakers for each event
            const eventsWithSpeakers = await Promise.all(
                (data || []).map(async (event: Event) => {
                    const { data: speakersData } = await supabase
                        .from('speakers')
                        .select('*')
                        .eq('event_id', event.id)
                        .order('order_index', { ascending: true });

                    return {
                        ...event,
                        speakers: speakersData || [],
                    };
                })
            );

            setEvents(eventsWithSpeakers);
        } catch (error) {
            console.error('Error loading events:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEvents = events.filter((event) => {
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter;
        return matchesSearch && matchesCategory;
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
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 dark:border-primary-400"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
                    </div>
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
                    <div className="space-y-4">
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
    const [registrations, setRegistrations] = useState<any[]>([]);

    const loadRegistrations = async () => {
        const { data } = await supabase
            .from('registrations')
            .select('user_id, profiles(full_name, avatar_url)')
            .eq('event_id', event.id)
            .limit(5);

        setRegistrations(data || []);
    };

    useEffect(() => {
        loadRegistrations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Link href={`/events/${event.id}`}>
            <div className="bg-white dark:bg-dark-card rounded-lg hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="flex flex-col sm:flex-row gap-4 p-4">
                    {/* Date Section - Left */}
                    <div className="flex-shrink-0 text-center sm:w-20">
                        <div className="inline-block sm:block">
                            <div className="text-sm text-gray-500 dark:text-gray-400 uppercase">
                                {format(eventDate, 'MMM', { locale: id })}
                            </div>
                            <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                {format(eventDate, 'dd', { locale: id })}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                {format(eventDate, 'EEEE', { locale: id })}
                            </div>
                        </div>
                    </div>

                    {/* Event Details - Middle */}
                    <div className="flex-1 min-w-0">
                        {/* Time */}
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            {format(eventDate, 'h:mm a', { locale: id })}
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                            {event.title}
                        </h3>

                        {/* Speakers */}
                        {event.speakers && event.speakers.length > 0 ? (
                            <div className="flex items-center gap-2 mb-2">
                                <div className="flex -space-x-2">
                                    {event.speakers.slice(0, 3).map((speaker) => (
                                        speaker.photo_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                key={speaker.id}
                                                src={speaker.photo_url}
                                                alt={speaker.name}
                                                className="w-6 h-6 rounded-full border-2 border-white dark:border-dark-card object-cover"
                                            />
                                        ) : (
                                            <div
                                                key={speaker.id}
                                                className="w-6 h-6 bg-primary-600 dark:bg-primary-500 rounded-full border-2 border-white dark:border-dark-card flex items-center justify-center text-white text-xs font-semibold"
                                            >
                                                {speaker.name.charAt(0).toUpperCase()}
                                            </div>
                                        )
                                    ))}
                                </div>
                                <span className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                                    {event.speakers.slice(0, 2).map(s => s.name).join(', ')}
                                    {event.speakers.length > 2 && ` & ${event.speakers.length - 2} more`}
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 mb-2">
                                <div className="flex -space-x-2">
                                    <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full border-2 border-white dark:border-dark-card"></div>
                                </div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Event Organizer
                                </span>
                            </div>
                        )}

                        {/* Location */}
                        {event.location && (
                            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {event.location}
                            </div>
                        )}

                        {/* Price and Waitlist */}
                        <div className="flex items-center justify-between gap-2 mt-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                                    Waitlist
                                </span>
                                <div className="flex -space-x-2">
                                    {registrations.slice(0, 3).map((reg, idx) => (
                                        <div
                                            key={idx}
                                            className="w-6 h-6 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full border-2 border-white dark:border-dark-card flex items-center justify-center text-white text-xs font-semibold"
                                        >
                                            {reg.profiles?.full_name?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                    ))}
                                </div>
                                {registrations.length > 3 && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        +{registrations.length - 3}
                                    </span>
                                )}
                            </div>

                            {/* Price Badge */}
                            {event.registration_fee && event.registration_fee > 0 ? (
                                <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded">
                                    Rp {event.registration_fee.toLocaleString('id-ID')}
                                </span>
                            ) : (
                                <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded">
                                    FREE
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Thumbnail - Right */}
                    {event.image_url && (
                        <div className="flex-shrink-0 w-full sm:w-32 h-32 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={event.image_url}
                                alt={event.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}
                </div>
            </div>
            <br></br>
        </Link>
    );
}
