import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import toast from 'react-hot-toast';
import RegistrationsStat from './RegistrationsStat';
import { useLanguage } from '@/lib/language-context';

interface OrganizerEventCardProps {
    event: any;
    onDelete: (id: string, title: string) => void;
}

const idr = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

export default function OrganizerEventCard({ event, onDelete }: OrganizerEventCardProps) {
    const { t } = useLanguage();
    const copyLink = () => {
        const url = `${window.location.origin}/events/${event.id}`;
        navigator.clipboard.writeText(url);
        toast.success(t('dashboard.eventCard.linkCopied'));
    };

    return (
        <div className="group bg-white dark:bg-dark-card rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-800 animate-fade-in">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Image */}
                <div className="w-full md:w-48 h-48 md:h-auto flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
                    {event.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={event.image_url}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
                            <svg className="w-12 h-12 text-primary-300 dark:text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    )}
                    <div className="absolute top-2 right-2">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg backdrop-blur-md ${event.status === 'published'
                            ? 'bg-green-500/90 text-white'
                            : event.status === 'draft'
                                ? 'bg-yellow-500/90 text-white'
                                : 'bg-gray-500/90 text-white'
                            }`}>
                            {event.status}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                            {event.category && (
                                <span className="text-xs font-medium text-primary-600 dark:text-primary-400 mb-1 block">
                                    {event.category}
                                </span>
                            )}
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate leading-tight">
                                {event.title}
                            </h3>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={copyLink}
                                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                title="Copy Link"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{format(new Date(event.start_date), 'dd MMM yyyy, HH:mm', { locale: id })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="truncate">{event.location || t('common.online')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{event.registration_fee ? idr(event.registration_fee) : t('common.free')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <RegistrationsStat eventId={event.id} capacity={event.capacity} />
                        </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-2">
                        <Link
                            href={`/events/${event.id}`}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all shadow-sm hover:shadow-md"
                        >
                            {t('common.viewDetails')}
                        </Link>
                        <Link
                            href={`/dashboard/events/${event.id}/edit`}
                            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                            {t('common.edit')}
                        </Link>
                        <Link
                            href={`/dashboard/events/${event.id}/registrations`}
                            className="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-lg transition-all shadow-sm hover:shadow-md"
                        >
                            {t('dashboard.registrations')}
                        </Link>
                        <button
                            onClick={() => onDelete(event.id, event.title)}
                            className="ml-auto px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-white dark:bg-dark-card border border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all shadow-sm hover:shadow-md"
                        >
                            {t('common.delete')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
