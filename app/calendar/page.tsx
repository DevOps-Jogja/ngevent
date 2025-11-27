'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { id } from 'date-fns/locale';
import { useLanguage } from '@/lib/language-context';

type Event = Database['public']['Tables']['events']['Row'];

export default function CalendarPage() {
    const { t } = useLanguage();
    const [events, setEvents] = useState<Event[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEvents();
    }, [currentDate]);

    const loadEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('status', 'published')
                .order('start_date', { ascending: true });

            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error('Error loading events:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter upcoming events (events from today onwards)
    const upcomingEvents = events.filter(event =>
        new Date(event.start_date) >= new Date(new Date().setHours(0, 0, 0, 0))
    ).slice(0, 5);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const getEventsForDate = (date: Date) => {
        return events.filter((event) =>
            isSameDay(new Date(event.start_date), date)
        );
    };

    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-primary">
            <Navbar />

            <div className="container mx-auto px-4 py-12 content-align-navbar">
                <div className="mb-12 text-center sm:text-left">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
                        {t('calendar.title')}
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl leading-relaxed">
                        {t('calendar.subtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Calendar */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-dark-card rounded-lg shadow-md dark:shadow-xl p-6 border border-transparent dark:border-gray-700">
                            {/* Calendar Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {format(currentDate, 'MMMM yyyy', { locale: id })}
                                </h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={previousMonth}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-dark-secondary rounded-lg text-gray-900 dark:text-white"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={nextMonth}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-dark-secondary rounded-lg text-gray-900 dark:text-white"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-2">
                                {/* Day Headers */}
                                {[
                                    t('calendar.days.sun'),
                                    t('calendar.days.mon'),
                                    t('calendar.days.tue'),
                                    t('calendar.days.wed'),
                                    t('calendar.days.thu'),
                                    t('calendar.days.fri'),
                                    t('calendar.days.sat')
                                ].map((day) => (
                                    <div key={day} className="text-center font-semibold text-gray-600 dark:text-gray-400 py-2">
                                        {day}
                                    </div>
                                ))}

                                {/* Calendar Days */}
                                {calendarDays.map((day, index) => {
                                    const dayEvents = getEventsForDate(day);
                                    const isCurrentMonth = isSameMonth(day, currentDate);
                                    const isSelected = selectedDate && isSameDay(day, selectedDate);

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedDate(day)}
                                            className={`
                          aspect-square p-2 rounded-lg border transition-colors
                          ${isCurrentMonth ? 'bg-white dark:bg-dark-secondary' : 'bg-gray-50 dark:bg-dark-primary'}
                          ${isSelected ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30' : 'border-gray-200 dark:border-gray-700'}
                          hover:border-primary-400
                        `}
                                        >
                                            <div className={`text-sm ${isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>
                                                {format(day, 'd')}
                                            </div>
                                            {dayEvents.length > 0 && (
                                                <div className="flex justify-center mt-1">
                                                    <div className="w-2 h-2 bg-primary-600 dark:bg-primary-500 rounded-full"></div>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Events List */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-dark-card rounded-lg shadow-md dark:shadow-xl p-6 border border-transparent dark:border-gray-700">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                {selectedDate
                                    ? format(selectedDate, 'dd MMMM yyyy', { locale: id })
                                    : t('calendar.subtitle')}
                            </h3>

                            {selectedDate && selectedDateEvents.length > 0 ? (
                                <div className="space-y-4">
                                    {selectedDateEvents.map((event) => (
                                        <Link
                                            key={event.id}
                                            href={`/events/${event.id}`}
                                            className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-600 hover:shadow-md transition-all bg-gray-50 dark:bg-dark-secondary"
                                        >
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{event.title}</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                                {event.description}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-500">
                                                {format(new Date(event.start_date), 'HH:mm', { locale: id })}
                                            </p>
                                        </Link>
                                    ))}
                                </div>
                            ) : selectedDate ? (
                                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('calendar.noEventsThisDay')}</p>
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('calendar.subtitle')}</p>
                            )}
                        </div>

                        {/* Upcoming Events */}
                        <div className="bg-white dark:bg-dark-card rounded-lg shadow-md dark:shadow-xl p-6 mt-6 border border-transparent dark:border-gray-700">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('home.upcoming')} Events</h3>
                            {upcomingEvents.length > 0 ? (
                                <div className="space-y-3">
                                    {upcomingEvents.map((event) => (
                                        <Link
                                            key={event.id}
                                            href={`/events/${event.id}`}
                                            className="block p-3 hover:bg-gray-50 dark:hover:bg-dark-secondary rounded-lg transition-colors"
                                        >
                                            <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">{event.title}</h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {format(new Date(event.start_date), 'dd MMM, HH:mm', { locale: id })}
                                            </p>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('home.noUpcoming')}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
