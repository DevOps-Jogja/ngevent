import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format, isValid, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Search, Users } from 'lucide-react';

import apiClient from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';
import { parseToWIB } from '../lib/date-wib';

type Event = {
    id: string;
    title: string;
    start_date?: string;
    startDate?: string;
    location?: string;
    status?: string;
    category?: string;
    capacity?: number;
    max_participants?: number;
};

type StatusFilter = 'all' | 'published' | 'draft' | 'archived' | 'cancelled' | 'completed';

function safeFormatDateTime(value?: string) {
    if (!value) return '-';
    const date = parseToWIB(value);
    if (!date) return '-';
    return format(date, 'dd MMM yyyy, HH:mm', { locale: localeId });
}

function RegistrationsCount({ eventId }: { eventId: string }) {
    const { data } = useQuery<{ count: number }>({
        queryKey: ['registrations-count', eventId],
        queryFn: async () => {
            const response = await apiClient.get(`/api/events/${eventId}/registrations/count`);
            return response.data;
        },
        enabled: !!eventId,
        staleTime: 60_000,
    });

    return (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Users className="w-4 h-4" />
            <span>{typeof data?.count === 'number' ? data.count : 0} peserta</span>
        </div>
    );
}

export default function DashboardRegistrationsPage() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<StatusFilter>('all');

    useEffect(() => {
        document.title = 'Kelola Pendaftaran - NgEvent'
    }, [])

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [authLoading, user, navigate]);

    useEffect(() => {
        if (!authLoading && user) {
            const allowed = user.role === 'admin' || user.role === 'organizer';
            if (!allowed) {
                navigate('/dashboard');
            }
        }
    }, [authLoading, user, navigate]);

    const { data: myEvents = [], isLoading } = useQuery<Event[]>({
        queryKey: ['my-events', user?.id],
        queryFn: async () => {
            const response = await apiClient.get('/api/events/mine');
            return response.data.events || response.data || [];
        },
        enabled: !!user && (user.role === 'admin' || user.role === 'organizer'),
    });

    const filteredEvents = useMemo(() => {
        const q = search.trim().toLowerCase();
        return (Array.isArray(myEvents) ? myEvents : [])
            .filter((e) => {
                if (status === 'all') return true;
                return String(e.status || '').toLowerCase() === status;
            })
            .filter((e) => {
                if (!q) return true;
                const title = String(e.title || '').toLowerCase();
                const location = String(e.location || '').toLowerCase();
                return title.includes(q) || location.includes(q);
            });
    }, [myEvents, search, status]);

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-dark-primary flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-primary pb-12">
            <div className="mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manajemen Pendaftaran</h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Pilih event untuk mengelola peserta.</p>
                    </div>
                    <Link
                        to="/dashboard"
                        className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-secondary transition"
                    >
                        Kembali
                    </Link>
                </div>

                <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 sm:p-5 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Cari event</label>
                            <div className="relative">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Judul / lokasi"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as StatusFilter)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="all">Semua</option>
                                <option value="published">Published</option>
                                <option value="draft">Draft</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="completed">Completed</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-white dark:bg-dark-card rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 animate-pulse">
                                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm p-10 text-center border border-gray-100 dark:border-gray-800">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Tidak ada event</h3>
                        <p className="text-gray-500 dark:text-gray-400">Coba ubah filter atau buat event baru.</p>
                        <div className="mt-6">
                            <Link
                                to="/events/create"
                                className="inline-flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl transition-all font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                            >
                                + Buat Event
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredEvents.map((event) => (
                            <div
                                key={event.id}
                                className="bg-white dark:bg-dark-card rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-800"
                            >
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {event.status && (
                                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${String(event.status).toLowerCase() === 'published'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                    : String(event.status).toLowerCase() === 'draft'
                                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                                    }`}>
                                                    {event.status}
                                                </span>
                                            )}
                                            {event.category && (
                                                <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                                                    {event.category}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{event.title}</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            {safeFormatDateTime(event.startDate || event.start_date)}
                                            {event.location ? ` • ${event.location}` : ''}
                                        </p>
                                        <div className="mt-3">
                                            <RegistrationsCount eventId={event.id} />
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Link
                                            to={`/dashboard/events/${event.id}/registrations`}
                                            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition shadow"
                                        >
                                            Kelola Pendaftaran
                                        </Link>
                                        <Link
                                            to={`/event/${event.id}`}
                                            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium transition"
                                        >
                                            Lihat Event
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
