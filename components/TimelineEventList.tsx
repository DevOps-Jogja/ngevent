'use client';

import { format, isToday, isTomorrow, isSameYear } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";
import Image from "next/image";

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
    profiles?: {
        full_name: string;
        avatar_url: string;
    };
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

interface TimelineEventListProps {
    events: EventWithSpeakers[];
    t: (key: string) => string;
    sortDirection?: 'asc' | 'desc';
}

export default function TimelineEventList({ events, t, sortDirection = 'asc' }: TimelineEventListProps) {
    // Group events by date
    const groupedEvents = events.reduce((groups, event) => {
        const date = new Date(event.start_date);
        const dateKey = format(date, 'yyyy-MM-dd');

        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(event);
        return groups;
    }, {} as Record<string, EventWithSpeakers[]>);

    // Sort dates
    const sortedDates = Object.keys(groupedEvents).sort((a, b) => {
        const dateA = new Date(a).getTime();
        const dateB = new Date(b).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return (
        <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-[120px] top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700 hidden md:block" />

            <div className="space-y-8">
                {sortedDates.map((dateKey) => {
                    const dateEvents = groupedEvents[dateKey];
                    const dateObj = new Date(dateKey);

                    // Format date label
                    let dateLabel = format(dateObj, 'MMM d', { locale: id });
                    let subLabel = format(dateObj, 'EEEE', { locale: id });

                    if (isToday(dateObj)) {
                        dateLabel = t('calendar.today');
                    } else if (isTomorrow(dateObj)) {
                        dateLabel = t('calendar.tomorrow');
                    }

                    return (
                        <div key={dateKey} className="relative md:flex gap-8">
                            {/* Date Column */}
                            <div className="md:w-[120px] flex-shrink-0 mb-4 md:mb-0 text-left md:text-right pt-2 relative z-10 pr-8">
                                <div className="md:sticky md:top-24">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-none">
                                        {dateLabel}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {subLabel}
                                    </p>
                                </div>
                            </div>

                            {/* Timeline Dot */}
                            <div className="absolute left-[120px] top-3 w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-gray-50 dark:border-dark-primary hidden md:block -translate-x-[5px]" />

                            {/* Events Column */}
                            <div className="flex-1 space-y-4">
                                {dateEvents.map((event) => (
                                    <TimelineEventCard key={event.id} event={event} t={t} />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function TimelineEventCard({ event, t }: { event: EventWithSpeakers; t: (key: string) => string }) {
    const startDate = new Date(event.start_date);

    return (
        <Link href={`/events/${event.id}`} prefetch={false} className="block group">
            <div className="bg-white dark:bg-dark-card rounded-xl p-4 md:p-5 border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-all duration-200 shadow-sm hover:shadow-md">
                <div className="flex gap-4 md:gap-6">
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {/* Time */}
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            {format(startDate, 'h:mm a')}
                        </div>

                        {/* Title */}
                        <h4 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                            {event.title}
                        </h4>

                        {/* Meta Info */}
                        <div className="space-y-1 mb-4">
                            {/* Organizer */}
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {event.profiles?.avatar_url ? (
                                        <Image
                                            src={event.profiles.avatar_url}
                                            alt={event.profiles.full_name || t('common.organizer')}
                                            width={20}
                                            height={20}
                                            className="w-full h-full object-cover rounded-full"
                                            sizes="20px"
                                        />
                                    ) : (
                                        <svg className="w-3 h-3 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    )}
                                </div>
                                <span className="truncate">
                                    {t('common.by')} {event.profiles?.full_name || t('common.organizer')}
                                </span>
                            </div>

                            {/* Location */}
                            {event.location && (
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span className="truncate">{event.location}</span>
                                </div>
                            )}
                        </div>

                        {/* Action Button */}
                        <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium ${event.registration_fee > 0
                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                }`}>
                                {event.registration_fee > 0 ? `Rp ${(event.registration_fee / 1000).toFixed(0)}K` : t('common.free')}
                            </span>

                            {/* Speakers Avatars */}
                            {event.speakers && event.speakers.length > 0 && (
                                <div className="flex -space-x-2">
                                    {event.speakers.slice(0, 3).map((speaker, idx) => (
                                        <div key={idx} className="w-5 h-5 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full border-2 border-white dark:border-dark-card overflow-hidden bg-gray-200">
                                            {speaker.photo_url ? (
                                                <Image
                                                    src={speaker.photo_url}
                                                    alt={speaker.name}
                                                    width={20}
                                                    height={20}
                                                    className="w-full h-full object-cover rounded-full"
                                                    sizes="20px"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                    {speaker.name[0]}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Image Thumbnail */}
                    <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 relative">
                        {event.image_url ? (
                            <Image
                                src={event.image_url}
                                alt={event.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                sizes="(max-width: 768px) 96px, 128px"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30">
                                <svg className="w-8 h-8 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
