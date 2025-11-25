'use client';

import { useState } from 'react';
import { format, addDays, isSameDay, isToday, isFuture, isPast } from 'date-fns';
import { id } from 'date-fns/locale';
import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';

interface Event {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
    category: string;
}

interface UpcomingEventsWidgetProps {
    events: Event[];
}

export default function UpcomingEventsWidget({ events }: UpcomingEventsWidgetProps) {
    const { t } = useLanguage();
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Get next 7 days
    const next7Days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

    // Filter upcoming events
    const upcomingEvents = events
        .filter(event => isFuture(new Date(event.start_date)) || isToday(new Date(event.start_date)))
        .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
        .slice(0, 5);

    // Get events for selected date
    const eventsOnSelectedDate = events.filter(event =>
        isSameDay(new Date(event.start_date), selectedDate)
    );

    // Check if date has events
    const hasEvents = (date: Date) => {
        return events.some(event => isSameDay(new Date(event.start_date), date));
    };

    // Get category color
    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            'technology': 'bg-blue-500',
            'business': 'bg-green-500',
            'education': 'bg-purple-500',
            'health': 'bg-red-500',
            'arts': 'bg-pink-500',
            'sports': 'bg-orange-500',
        };
        return colors[category?.toLowerCase()] || 'bg-gray-500';
    };

    return (
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-md dark:shadow-xl border border-transparent dark:border-gray-700 overflow-hidden animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('home.upcoming')} {t('nav.events')}</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {upcomingEvents.length} {t('widget.eventsComingUp')}
                        </p>
                    </div>
                    <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
            </div>

            {/* Mini Calendar - Week View */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
                <div className="grid grid-cols-7 gap-2">
                    {next7Days.map((date, index) => {
                        const isSelected = isSameDay(date, selectedDate);
                        const hasEventsOnDate = hasEvents(date);
                        const isDateToday = isToday(date);

                        return (
                            <button
                                key={index}
                                onClick={() => setSelectedDate(date)}
                                className={`
                                    relative p-2 rounded-lg text-center transition-all
                                    ${isSelected
                                        ? 'bg-primary-500 text-white shadow-lg scale-105'
                                        : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }
                                    ${isDateToday && !isSelected ? 'ring-2 ring-primary-500' : ''}
                                `}
                            >
                                <div className="text-xs font-medium opacity-70">
                                    {format(date, 'EEE', { locale: id })}
                                </div>
                                <div className="text-lg font-bold mt-1">
                                    {format(date, 'd')}
                                </div>
                                {hasEventsOnDate && (
                                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                                        <div className={`h-1 w-1 rounded-full ${isSelected ? 'bg-white' : 'bg-primary-500'}`}></div>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Selected Date Events */}
                {eventsOnSelectedDate.length > 0 && (
                    <div className="mt-4 p-3 bg-white dark:bg-dark-card rounded-lg">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                            {t('widget.eventsOn')} {format(selectedDate, 'dd MMMM yyyy', { locale: id })}
                        </p>
                        <div className="space-y-2">
                            {eventsOnSelectedDate.map(event => (
                                <div key={event.id} className="flex items-center gap-2 text-sm">
                                    <div className={`h-2 w-2 rounded-full ${getCategoryColor(event.category)}`}></div>
                                    <span className="text-gray-900 dark:text-white truncate">{event.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Upcoming Events List */}
            <div className="p-4">
                {upcomingEvents.length === 0 ? (
                    <div className="text-center py-8">
                        <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">{t('home.noUpcoming')}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {upcomingEvents.map((event, index) => {
                            const startDate = new Date(event.start_date);
                            const daysUntil = Math.ceil((startDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                            return (
                                <Link
                                    key={event.id}
                                    href={`/events/${event.id}`}
                                    prefetch={false}
                                    className="block p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-md transition-all group"
                                    style={{ animationDelay: `${0.25 + index * 0.05}s` }}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0">
                                            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex flex-col items-center justify-center">
                                                <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                                                    {format(startDate, 'MMM', { locale: id })}
                                                </span>
                                                <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                                                    {format(startDate, 'd')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                                                {event.title}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {format(startDate, 'HH:mm', { locale: id })}
                                                </span>
                                                {daysUntil === 0 ? (
                                                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                                                        {t('calendar.today')}
                                                    </span>
                                                ) : daysUntil === 1 ? (
                                                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
                                                        {t('calendar.tomorrow')}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {t('widget.inDays').replace('{days}', daysUntil.toString())}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* View All Link */}
            {upcomingEvents.length > 0 && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <Link
                        href="/events"
                        className="block text-center text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium"
                    >
                        {t('home.viewAll')} →
                    </Link>
                </div>
            )}
        </div>
    );
}
