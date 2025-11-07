'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import RegistrationsSkeleton from '@/components/RegistrationsSkeleton';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import toast from 'react-hot-toast';

type Event = Database['public']['Tables']['events']['Row'];
type FormField = Database['public']['Tables']['form_fields']['Row'];
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
    const [formFields, setFormFields] = useState<FormField[]>([]);
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

            // Load form fields
            const { data: fieldsData, error: fieldsError } = await supabase
                .from('form_fields')
                .select('*')
                .eq('event_id', eventId)
                .order('order_index', { ascending: true });

            if (fieldsError) throw fieldsError;
            setFormFields(fieldsData || []);

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

    const deleteRegistration = async (registrationId: string, participantName: string) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus pendaftaran ${participantName}? Tindakan ini tidak dapat dibatalkan.`)) {
            return;
        }

        try {
            console.log('Deleting registration:', registrationId);

            // First, verify the registration exists and we have permission
            const { data: checkData, error: checkError } = await supabase
                .from('registrations')
                .select('id, event_id')
                .eq('id', registrationId)
                .single();

            console.log('Check result:', { checkData, checkError });

            if (checkError || !checkData) {
                console.error('Registration not found or no permission to view');
                toast.error('Registrasi tidak ditemukan atau Anda tidak memiliki izin untuk menghapusnya.');
                return;
            }

            // Verify event ownership
            if (checkData.event_id !== eventId) {
                console.error('Registration does not belong to this event');
                toast.error('Registrasi tidak sesuai dengan event ini.');
                return;
            }

            // Now delete
            const { error, count } = await supabase
                .from('registrations')
                .delete({ count: 'exact' })
                .eq('id', registrationId);

            console.log('Delete result:', { error, count });

            if (error) {
                console.error('Delete error:', error);
                throw error;
            }

            // Check if any rows were deleted
            if (count === 0) {
                console.warn('No rows were deleted - RLS policy issue');
                toast.error('Gagal menghapus pendaftaran. RLS policy di Supabase mungkin tidak mengizinkan DELETE. Silakan tambahkan policy: USING (event_id IN (SELECT id FROM events WHERE organizer_id = auth.uid()))');
                return;
            }

            toast.success('Pendaftaran berhasil dihapus');

            // Update local state - remove deleted registration
            setRegistrations(prevRegistrations =>
                prevRegistrations.filter(reg => reg.id !== registrationId)
            );

            console.log('Registration deleted successfully, count:', count);
        } catch (error: any) {
            console.error('Error deleting registration:', error);
            toast.error(error.message || 'Gagal menghapus pendaftaran');
        }
    }; const exportToCSV = () => {
        const csvData = filteredRegistrations.map(reg => {
            const registrationData = reg.registration_data as Record<string, any> | null;
            const row: Record<string, any> = {
                'Registration ID': reg.id,
                'Name': reg.profiles?.full_name || 'N/A',
            };

            // Add all form field values
            formFields.forEach(field => {
                row[field.field_name] = registrationData?.[field.field_name] || '-';
            });

            // Add status and date
            row['Status'] = reg.status;
            row['Registered At'] = format(new Date(reg.registered_at), 'dd MMM yyyy, HH:mm', { locale: id });

            return row;
        });

        const headers = Object.keys(csvData[0] || {});
        const csv = [
            headers.join(','),
            ...csvData.map(row => headers.map(header => `"${row[header]}"`).join(','))
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
            <>
                <Navbar />
                <RegistrationsSkeleton />
            </>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-primary animate-fade-in">
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
                                            {formFields.map((field) => (
                                                <th key={field.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    {field.field_name}
                                                </th>
                                            ))}
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
                                                {formFields.map((field) => {
                                                    const registrationData = registration.registration_data as Record<string, any> | null;
                                                    const value = registrationData?.[field.field_name];
                                                    return (
                                                        <td key={field.id} className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                            {field.field_type === 'file' ? (
                                                                value ? (
                                                                    <a
                                                                        href={value}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                                        </svg>
                                                                        View File
                                                                    </a>
                                                                ) : (
                                                                    <span className="text-gray-400">-</span>
                                                                )
                                                            ) : field.field_type === 'checkbox' ? (
                                                                <span className={`px-2 py-1 text-xs rounded ${value ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                                                                    {value ? 'Yes' : 'No'}
                                                                </span>
                                                            ) : (
                                                                <span className="line-clamp-2">{value || '-'}</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
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

                                                        <button
                                                            onClick={() => deleteRegistration(
                                                                registration.id,
                                                                registration.profiles?.full_name || 'Unknown'
                                                            )}
                                                            className="p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                                                            title="Delete Registration"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
