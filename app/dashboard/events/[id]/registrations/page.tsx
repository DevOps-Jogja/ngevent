'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import toast from 'react-hot-toast';

type Event = Database['public']['Tables']['events']['Row'];
type Registration = Database['public']['Tables']['registrations']['Row'] & {
    profiles?: {
        full_name: string | null;
        avatar_url: string | null;
    };
};

export default function EventRegistrationsPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [eventId, setEventId] = useState<string>('');
    const [event, setEvent] = useState<Event | null>(null);
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);
    const [filter, setFilter] = useState<'all' | 'registered' | 'attended' | 'cancelled'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        params.then((resolvedParams) => {
            setEventId(resolvedParams.id);
        });
    }, [params]);

    useEffect(() => {
        if (eventId) {
            checkAuth();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventId]);

    useEffect(() => {
        checkAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const checkAuth = async () => {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();

            if (error || !user) {
                toast.error('Silakan login terlebih dahulu');
                router.push('/auth/login');
                return;
            }

            setAuthChecked(true);
            loadData(user.id);
        } catch (error) {
            toast.error('Terjadi kesalahan saat verifikasi login');
            router.push('/auth/login');
        }
    };

    const loadData = async (userId: string) => {
        if (!eventId) {
            return;
        }

        try {
            // Load event data
            const { data: eventData, error: eventError } = await supabase
                .from('events')
                .select('*')
                .eq('id', eventId)
                .single();

            if (eventError) throw eventError;

            // Check if user is the organizer
            if (eventData.organizer_id !== userId) {
                toast.error('Anda tidak memiliki akses ke halaman ini');
                router.push('/dashboard');
                return;
            }

            setEvent(eventData);

            // Load registrations
            const { data: registrationsData, error: registrationsError } = await supabase
                .from('registrations')
                .select(`
                    *,
                    profiles (
                        full_name,
                        avatar_url
                    )
                `)
                .eq('event_id', eventId)
                .order('registered_at', { ascending: false });

            if (registrationsError) throw registrationsError;

            setRegistrations(registrationsData || []);
        } catch (error: any) {
            console.error('Error loading data:', error);
            toast.error('Gagal memuat data registrasi');
        } finally {
            setLoading(false);
        }
    };

    const updateRegistrationStatus = async (registrationId: string, status: 'registered' | 'attended' | 'cancelled') => {
        try {
            const { error } = await supabase
                .from('registrations')
                .update({ status })
                .eq('id', registrationId);

            if (error) throw error;

            toast.success('Status berhasil diupdate');

            // Update local state
            setRegistrations(registrations.map(reg =>
                reg.id === registrationId ? { ...reg, status } : reg
            ));
        } catch (error: any) {
            console.error('Error updating status:', error);
            toast.error('Gagal update status');
        }
    };

    const exportToCSV = () => {
        const csvData = filteredRegistrations.map(reg => ({
            'Registration ID': reg.id,
            'Name': reg.profiles?.full_name || 'N/A',
            'Status': reg.status,
            'Registered At': format(new Date(reg.registered_at), 'dd MMM yyyy, HH:mm', { locale: id }),
            'Registration Data': JSON.stringify(reg.registration_data),
        }));

        const headers = Object.keys(csvData[0] || {});
        const csv = [
            headers.join(','),
            ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `registrations-${event?.title}-${Date.now()}.csv`;
        a.click();

        toast.success('Data berhasil diexport');
    };

    const filteredRegistrations = registrations.filter(reg => {
        const matchesFilter = filter === 'all' || reg.status === filter;
        const matchesSearch = !searchQuery ||
            reg.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            reg.id.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    const stats = {
        total: registrations.length,
        registered: registrations.filter(r => r.status === 'registered').length,
        attended: registrations.filter(r => r.status === 'attended').length,
        cancelled: registrations.filter(r => r.status === 'cancelled').length,
    };

    if (!authChecked || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-primary">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 dark:border-primary-400"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-primary">
            <Navbar />

            <div className="container mx-auto px-4 py-12 max-w-7xl">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Dashboard
                        </Link>

                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                    Event Registrations
                                </h1>
                                <p className="text-lg text-gray-600 dark:text-gray-400">
                                    {event?.title}
                                </p>
                            </div>

                            <button
                                onClick={exportToCSV}
                                disabled={filteredRegistrations.length === 0}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Export CSV
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white dark:bg-dark-card rounded-lg shadow-md dark:shadow-xl p-6 border border-transparent dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-dark-card rounded-lg shadow-md dark:shadow-xl p-6 border border-transparent dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Registered</p>
                                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.registered}</p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-dark-card rounded-lg shadow-md dark:shadow-xl p-6 border border-transparent dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Attended</p>
                                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.attended}</p>
                                </div>
                                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-dark-card rounded-lg shadow-md dark:shadow-xl p-6 border border-transparent dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Cancelled</p>
                                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.cancelled}</p>
                                </div>
                                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters and Search */}
                    <div className="bg-white dark:bg-dark-card rounded-lg shadow-md dark:shadow-xl p-6 mb-6 border border-transparent dark:border-gray-700">
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Search */}
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Search by name or ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white"
                                />
                            </div>

                            {/* Status Filter */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFilter('all')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-gray-100 dark:bg-dark-secondary text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setFilter('registered')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'registered'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-100 dark:bg-dark-secondary text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    Registered
                                </button>
                                <button
                                    onClick={() => setFilter('attended')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'attended'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-100 dark:bg-dark-secondary text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    Attended
                                </button>
                                <button
                                    onClick={() => setFilter('cancelled')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'cancelled'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-100 dark:bg-dark-secondary text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    Cancelled
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Registrations List */}
                    <div className="bg-white dark:bg-dark-card rounded-lg shadow-md dark:shadow-xl border border-transparent dark:border-gray-700 overflow-hidden">
                        {filteredRegistrations.length === 0 ? (
                            <div className="p-12 text-center">
                                <svg className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    No registrations found
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {searchQuery || filter !== 'all'
                                        ? 'Try adjusting your filters or search query'
                                        : 'No one has registered for this event yet'
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-dark-secondary border-b border-gray-200 dark:border-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Participant
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Registered At
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {filteredRegistrations.map((registration) => (
                                            <tr key={registration.id} className="hover:bg-gray-50 dark:hover:bg-dark-secondary transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                                                            {registration.profiles?.full_name?.charAt(0).toUpperCase() || '?'}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900 dark:text-white">
                                                                {registration.profiles?.full_name || 'Unknown'}
                                                            </div>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                ID: {registration.id.slice(0, 8)}...
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                    {format(new Date(registration.registered_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${registration.status === 'registered'
                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                                                        : registration.status === 'attended'
                                                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400'
                                                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                                                        }`}>
                                                        {registration.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <select
                                                            value={registration.status}
                                                            onChange={(e) => updateRegistrationStatus(
                                                                registration.id,
                                                                e.target.value as 'registered' | 'attended' | 'cancelled'
                                                            )}
                                                            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white"
                                                        >
                                                            <option value="registered">Registered</option>
                                                            <option value="attended">Attended</option>
                                                            <option value="cancelled">Cancelled</option>
                                                        </select>

                                                        <button
                                                            onClick={() => {
                                                                // Show registration details
                                                                const details = JSON.stringify(registration.registration_data, null, 2);
                                                                alert(`Registration Data:\n\n${details}`);
                                                            }}
                                                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                                            title="View Details"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Summary Info */}
                    {filteredRegistrations.length > 0 && (
                        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                            Showing {filteredRegistrations.length} of {registrations.length} registrations
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
