'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import NotificationsCenter from '@/components/NotificationsCenter';
import UpcomingEventsWidget from '@/components/UpcomingEventsWidget';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useMyEvents, useMyRegistrations } from '@/hooks/useSupabaseQuery';
import { useAuth } from '@/lib/auth-context';
import { useQueryClient } from '@tanstack/react-query';
import DashboardSkeleton from '@/components/DashboardSkeleton';
import { invalidateRelatedCaches } from '@/lib/cache-helpers';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function DashboardPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user, profile, loading: authLoading } = useAuth();
    const [effectiveRole, setEffectiveRole] = useState<'participant' | 'organizer'>(profile?.role || 'participant');

    // Menggunakan React Query hooks
    const { data: myEvents = [], isLoading: loadingEvents, refetch: refetchEvents } = useMyEvents(user?.id || null);
    const { data: myRegistrations = [], isLoading: loadingRegistrations } = useMyRegistrations(user?.id || null);

    const loading = loadingEvents || loadingRegistrations;

    // Keep effectiveRole in sync with profile changes
    useEffect(() => {
        if (profile?.role) {
            setEffectiveRole(profile.role as 'participant' | 'organizer');
        }
    }, [profile?.role]);

    useEffect(() => {
        if (!authLoading && !user) {
            toast.error('Silakan login terlebih dahulu untuk mengakses dashboard');
            router.push('/auth/login');
        }
    }, [authLoading, user, router]);

    // Functions no longer needed as we use React Query
    // const loadMyEvents = async (userId: string) => {...}
    // const loadMyRegistrations = async (userId: string) => {...}

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    const updateRole = async (newRole: 'participant' | 'organizer') => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', user.id);

            if (error) throw error;
            // Immediately reflect role in UI and clear related caches
            setEffectiveRole(newRole);
            invalidateRelatedCaches('profile', user.id);
            toast.success('Role berhasil diupdate!');
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
        if (effectiveRole !== 'organizer') {
            toast.error('Hanya organizer yang dapat menghapus event');
            return;
        }
        if (!confirm(`Apakah Anda yakin ingin menghapus event "${eventTitle}"? Tindakan ini tidak dapat dibatalkan.`)) {
            return;
        }

        try {
            // Delete registrations first (foreign key constraint)
            const { error: regError } = await supabase
                .from('registrations')
                .delete()
                .eq('event_id', eventId);

            if (regError) throw regError;

            // Delete the event
            const { error: eventError } = await supabase
                .from('events')
                .delete()
                .eq('id', eventId)
                .eq('organizer_id', user!.id); // user checked earlier

            if (eventError) throw eventError;

            // Remove custom images from localStorage
            localStorage.removeItem(`event_custom_images_${eventId}`);

            toast.success('Event berhasil dihapus!');

            // Reload events menggunakan React Query
            if (user) {
                queryClient.invalidateQueries({ queryKey: ['my-events', user.id] });
            }
            refetchEvents();
        } catch (error: any) {
            console.error('Error deleting event:', error);
            toast.error(error.message || 'Gagal menghapus event');
        }
    };

    if (authLoading || loading) {
        return (
            <>
                <Navbar />
                <DashboardSkeleton />
            </>
        );
    }
    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-primary animate-fade-in">
            <Navbar />

            <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-12 max-w-7xl">
                <div className="max-w-6xl mx-auto">
                    {/* Header with Notifications */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                Dashboard
                            </h1>
                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                                Welcome back, {profile?.full_name || user?.email?.split('@')[0]}!
                            </p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
                            <NotificationsCenter userId={user.id} />
                            <Link
                                href="/profile/edit"
                                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Edit Profile"
                            >
                                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </Link>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 my-4 sm:my-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        <div className="bg-white dark:bg-dark-card rounded-xl shadow-md dark:shadow-xl p-4 sm:p-6 border border-transparent dark:border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-medium">Total Events</span>
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                {effectiveRole === 'organizer' ? myEvents.length : myRegistrations.length}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {effectiveRole === 'organizer' ? 'Events created' : 'Events joined'}
                            </p>
                        </div>

                        <div className="bg-white dark:bg-dark-card rounded-xl shadow-md dark:shadow-xl p-4 sm:p-6 border border-transparent dark:border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-medium">Active</span>
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                {effectiveRole === 'organizer'
                                    ? myEvents.filter((e: any) => e.status === 'published').length
                                    : myRegistrations.filter((r: any) => r.status === 'registered').length}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {effectiveRole === 'organizer' ? 'Published events' : 'Registered'}
                            </p>
                        </div>

                        <div className="bg-white dark:bg-dark-card rounded-xl shadow-md dark:shadow-xl p-4 sm:p-6 border border-transparent dark:border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-medium">This Month</span>
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                {effectiveRole === 'organizer' ? myEvents.length : myRegistrations.length}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                New this month
                            </p>
                        </div>
                    </div>

                    {/* Profile Section */}
                    <div className="bg-white dark:bg-dark-card rounded-lg shadow-md dark:shadow-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-transparent dark:border-gray-700 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="w-full sm:w-auto">
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    Welcome, {profile?.full_name || user?.email}!
                                </h1>
                                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                                    Role: <span className="font-semibold capitalize">{effectiveRole}</span>
                                </p>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button
                                    aria-pressed={effectiveRole === 'participant'}
                                    disabled={effectiveRole === 'participant'}
                                    onClick={() => {
                                        if (effectiveRole !== 'participant') updateRole('participant');
                                    }}
                                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed ${effectiveRole === 'participant'
                                        ? 'bg-primary-600 text-white shadow'
                                        : 'bg-gray-200 dark:bg-dark-secondary text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    Participant
                                </button>
                                <button
                                    aria-pressed={effectiveRole === 'organizer'}
                                    disabled={effectiveRole === 'organizer'}
                                    onClick={() => {
                                        if (effectiveRole !== 'organizer') updateRole('organizer');
                                    }}
                                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed ${effectiveRole === 'organizer'
                                        ? 'bg-primary-600 text-white shadow'
                                        : 'bg-gray-200 dark:bg-dark-secondary text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    Organizer
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Organizer Dashboard */}
                    {effectiveRole === 'organizer' && (
                        <div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">My Events</h2>
                                <Link
                                    href="/dashboard/events/create"
                                    className="w-full sm:w-auto bg-primary-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-primary-700 text-center text-sm sm:text-base font-medium transition-colors"
                                >
                                    + Create Event
                                </Link>
                            </div>

                            {myEvents.length === 0 ? (
                                <div className="bg-white dark:bg-dark-card rounded-lg shadow-md dark:shadow-xl p-8 sm:p-12 text-center border border-transparent dark:border-gray-700">
                                    <svg
                                        className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400 dark:text-gray-600 mb-3 sm:mb-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                    </svg>
                                    <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2">
                                        Belum ada event
                                    </h3>
                                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4 sm:mb-6">
                                        Mulai buat event pertama Anda sekarang!
                                    </p>
                                    <Link
                                        href="/dashboard/events/create"
                                        className="inline-block bg-primary-600 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-primary-700 text-sm sm:text-base transition-colors"
                                    >
                                        Create Event
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:gap-6">
                                    {myEvents.map((event: any, index: number) => (
                                        <div
                                            key={event.id}
                                            className="bg-white dark:bg-dark-card rounded-xl shadow-md dark:shadow-xl hover:shadow-xl dark:hover:shadow-2xl transition-all border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in"
                                            style={{ animationDelay: `${index * 0.1}s` }}
                                        >
                                            <div className="flex flex-col md:flex-row">
                                                {/* Event Image */}
                                                {event.image_url ? (
                                                    <div className="md:w-64 h-40 sm:h-48 md:h-auto flex-shrink-0 bg-gray-200 dark:bg-gray-700">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={event.image_url}
                                                            alt={event.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="md:w-64 h-40 sm:h-48 md:h-auto flex-shrink-0 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center">
                                                        <svg className="w-12 h-12 sm:w-16 sm:h-16 text-primary-400 dark:text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                )}

                                                {/* Event Details */}
                                                <div className="flex-1 p-4 sm:p-6">
                                                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                                                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                                                                    {event.title}
                                                                </h3>
                                                                <span
                                                                    className={`inline-flex self-start px-2 sm:px-3 py-1 text-xs font-semibold rounded-full ${event.status === 'published'
                                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                                                                        : event.status === 'draft'
                                                                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                                                                            : event.status === 'cancelled'
                                                                                ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                                                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400'
                                                                        }`}
                                                                >
                                                                    {event.status}
                                                                </span>
                                                            </div>
                                                            {event.category && (
                                                                <span className="inline-block px-2 py-1 text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded mb-2">
                                                                    {event.category}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 line-clamp-2">
                                                        {event.description}
                                                    </p>

                                                    {/* Event Meta Information */}
                                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
                                                        {/* Date & Time */}
                                                        <div className="flex items-start gap-2">
                                                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            <div className="min-w-0">
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">Date</div>
                                                                <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                                                                    {format(new Date(event.start_date), 'dd MMM yyyy', { locale: id })}
                                                                </div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {format(new Date(event.start_date), 'HH:mm', { locale: id })}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Location */}
                                                        {event.location && (
                                                            <div className="flex items-start gap-2">
                                                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                </svg>
                                                                <div className="min-w-0">
                                                                    <div className="text-xs text-gray-500 dark:text-gray-400">Location</div>
                                                                    <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                                                                        {event.location}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Capacity */}
                                                        {event.capacity && (
                                                            <div className="flex items-start gap-2">
                                                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                                </svg>
                                                                <div className="min-w-0">
                                                                    <div className="text-xs text-gray-500 dark:text-gray-400">Capacity</div>
                                                                    <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                                                                        {event.capacity}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Registration Fee */}
                                                        <div className="flex items-start gap-2">
                                                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <div className="min-w-0">
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">Fee</div>
                                                                <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                                                                    {event.registration_fee && event.registration_fee > 0
                                                                        ? `Rp ${event.registration_fee.toLocaleString('id-ID')}`
                                                                        : 'FREE'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="grid grid-cols-2 sm:flex gap-2 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
                                                        <Link
                                                            href={`/events/${event.id}`}
                                                            className="px-3 py-2 bg-primary-600 text-white text-xs sm:text-sm rounded-lg hover:bg-primary-700 transition-colors text-center font-medium"
                                                        >
                                                            View
                                                        </Link>
                                                        <Link
                                                            href={`/dashboard/events/${event.id}/edit`}
                                                            className="px-3 py-2 bg-gray-600 text-white text-xs sm:text-sm rounded-lg hover:bg-gray-700 transition-colors text-center font-medium"
                                                        >
                                                            Edit
                                                        </Link>
                                                        <Link
                                                            href={`/dashboard/events/${event.id}/registrations`}
                                                            className="px-3 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
                                                        >
                                                            Data
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDeleteEvent(event.id, event.title)}
                                                            className="px-3 py-2 bg-red-600 text-white text-xs sm:text-sm rounded-lg hover:bg-red-700 transition-colors text-center font-medium"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Participant Dashboard */}
                    {effectiveRole === 'participant' && (
                        <div>
                            {/* Upcoming Events Widget */}
                            <div className="mb-6 sm:mb-8">
                                <UpcomingEventsWidget
                                    events={myRegistrations.map((reg: any) => reg.events).filter(Boolean)}
                                />
                            </div>

                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">My Registrations</h2>

                            {myRegistrations.length === 0 ? (
                                <div className="bg-white dark:bg-dark-card rounded-lg shadow-md dark:shadow-xl p-8 sm:p-12 text-center border border-transparent dark:border-gray-700">
                                    <svg
                                        className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400 dark:text-gray-600 mb-3 sm:mb-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                        />
                                    </svg>
                                    <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2">
                                        Belum ada pendaftaran
                                    </h3>
                                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4 sm:mb-6">
                                        Jelajahi event menarik dan daftar sekarang!
                                    </p>
                                    <Link
                                        href="/events"
                                        className="inline-block bg-primary-600 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-primary-700 text-sm sm:text-base transition-colors"
                                    >
                                        Browse Events
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:gap-6">
                                    {myRegistrations.map((registration: any, index: number) => {
                                        const eventData = registration.events;
                                        if (!eventData) return null;

                                        return (
                                            <div
                                                key={registration.id}
                                                className="bg-white dark:bg-dark-card rounded-xl shadow-md dark:shadow-xl hover:shadow-xl dark:hover:shadow-2xl transition-all border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in"
                                                style={{ animationDelay: `${index * 0.1}s` }}
                                            >
                                                <div className="flex flex-col md:flex-row">
                                                    {/* Event Image */}
                                                    {eventData.image_url ? (
                                                        <div className="md:w-64 h-40 sm:h-48 md:h-auto flex-shrink-0 bg-gray-200 dark:bg-gray-700">
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img
                                                                src={eventData.image_url}
                                                                alt={eventData.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="md:w-64 h-40 sm:h-48 md:h-auto flex-shrink-0 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center">
                                                            <svg className="w-12 h-12 sm:w-16 sm:h-16 text-primary-400 dark:text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                    )}

                                                    {/* Event Details */}
                                                    <div className="flex-1 p-4 sm:p-6">
                                                        <div className="flex items-start justify-between mb-3 sm:mb-4">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                                                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                                                                        {eventData.title}
                                                                    </h3>
                                                                    <span
                                                                        className={`inline-flex self-start px-2 sm:px-3 py-1 text-xs font-semibold rounded-full ${registration.status === 'registered'
                                                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                                                                            : registration.status === 'attended'
                                                                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400'
                                                                                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                                                                            }`}
                                                                    >
                                                                        {registration.status}
                                                                    </span>
                                                                </div>
                                                                {eventData.category && (
                                                                    <span className="inline-block px-2 py-1 text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded mb-2">
                                                                        {eventData.category}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 line-clamp-2">
                                                            {eventData.description}
                                                        </p>

                                                        {/* Event Meta Information */}
                                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
                                                            {/* Date & Time */}
                                                            <div className="flex items-start gap-2">
                                                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                                <div className="min-w-0">
                                                                    <div className="text-xs text-gray-500 dark:text-gray-400">Date</div>
                                                                    <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                                                                        {format(new Date(eventData.start_date), 'dd MMM yyyy', { locale: id })}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                        {format(new Date(eventData.start_date), 'HH:mm', { locale: id })}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Location */}
                                                            {eventData.location && (
                                                                <div className="flex items-start gap-2">
                                                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    </svg>
                                                                    <div className="min-w-0">
                                                                        <div className="text-xs text-gray-500 dark:text-gray-400">Location</div>
                                                                        <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                                                                            {eventData.location}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Registered Date */}
                                                            <div className="flex items-start gap-2">
                                                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                                                </svg>
                                                                <div className="min-w-0">
                                                                    <div className="text-xs text-gray-500 dark:text-gray-400">Registered</div>
                                                                    <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                                                                        {format(new Date(registration.registered_at), 'dd MMM yyyy', { locale: id })}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                        {format(new Date(registration.registered_at), 'HH:mm', { locale: id })}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Registration Fee */}
                                                            <div className="flex items-start gap-2">
                                                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                <div className="min-w-0">
                                                                    <div className="text-xs text-gray-500 dark:text-gray-400">Fee</div>
                                                                    <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                                                                        {eventData.registration_fee && eventData.registration_fee > 0
                                                                            ? `Rp ${eventData.registration_fee.toLocaleString('id-ID')}`
                                                                            : 'FREE'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Action Buttons */}
                                                        <div className="flex flex-col sm:flex-row gap-2 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
                                                            <Link
                                                                href={`/events/${eventData.id}`}
                                                                className="sm:flex-none px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-center font-medium text-sm"
                                                            >
                                                                👁️ View Event
                                                            </Link>
                                                            {registration.status === 'registered' && (
                                                                <div className="sm:flex-none px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-center font-medium border border-green-200 dark:border-green-800 text-sm">
                                                                    ✅ Confirmed
                                                                </div>
                                                            )}
                                                            {registration.status === 'attended' && (
                                                                <div className="sm:flex-none px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-lg text-center font-medium border border-purple-200 dark:border-purple-800 text-sm">
                                                                    🎉 Attended
                                                                </div>
                                                            )}
                                                            {registration.status === 'cancelled' && (
                                                                <div className="sm:flex-none px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-center font-medium border border-red-200 dark:border-red-800 text-sm">
                                                                    ❌ Cancelled
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
