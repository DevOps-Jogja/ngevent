'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import toast from 'react-hot-toast';
import { useMyEvents, useMyRegistrations } from '@/hooks/useSupabaseQuery';
import { useAuth } from '@/lib/auth-context';
import { useQueryClient } from '@tanstack/react-query';
import DashboardSkeleton from '@/components/DashboardSkeleton';
import { invalidateRelatedCaches } from '@/lib/cache-helpers';
import { useLanguage } from '@/lib/language-context';

// Components
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardStats from '@/components/dashboard/DashboardStats';
import RoleSwitcher from '@/components/dashboard/RoleSwitcher';
import OrganizerView from '@/components/dashboard/OrganizerView';
import ParticipantView from '@/components/dashboard/ParticipantView';
import DeleteEventModal from '@/components/dashboard/DeleteEventModal';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function DashboardPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    const { user, profile, loading: authLoading } = useAuth();
    const [effectiveRole, setEffectiveRole] = useState<'participant' | 'organizer'>(profile?.role || 'participant');

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [eventToDelete, setEventToDelete] = useState<{ id: string; title: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // React Query hooks
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
            toast.error(t('dashboard.loginRequired'));
            router.push('/auth/login');
        }
    }, [authLoading, user, router]);

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
            toast.success(t('dashboard.roleUpdated'));
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleDeleteClick = (eventId: string, eventTitle: string) => {
        setEventToDelete({ id: eventId, title: eventTitle });
        setDeleteModalOpen(true);
    };

    const confirmDeleteEvent = async () => {
        if (!eventToDelete || !user) return;

        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', eventToDelete.id)
                .eq('organizer_id', user.id);

            if (error) throw error;

            localStorage.removeItem(`event_custom_images_${eventToDelete.id}`);
            toast.success(t('dashboard.eventDeleted'));

            queryClient.invalidateQueries({ queryKey: ['my-events', user.id] });
            refetchEvents();
            setDeleteModalOpen(false);
            setEventToDelete(null);
        } catch (error: any) {
            console.error('Error deleting event:', error);
            toast.error(t('dashboard.deleteFailed'));
        } finally {
            setIsDeleting(false);
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

    // Calculate stats
    const totalEvents = effectiveRole === 'organizer' ? myEvents.length : myRegistrations.length;
    const activeEvents = effectiveRole === 'organizer'
        ? myEvents.filter((e: any) => e.status === 'published').length
        : myRegistrations.filter((r: any) => r.status === 'registered').length;
    const thisMonthEvents = effectiveRole === 'organizer' ? myEvents.length : myRegistrations.length; // Simplified for now as per original logic

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-primary animate-fade-in pb-12">
            <Navbar />

            <div className="container mx-auto px-4 py-8 md:py-12 content-align-navbar">
                <DashboardHeader user={user} profile={profile} />

                <DashboardStats
                    role={effectiveRole}
                    totalEvents={totalEvents}
                    activeEvents={activeEvents}
                    thisMonthEvents={thisMonthEvents}
                />

                <RoleSwitcher
                    currentRole={effectiveRole}
                    onRoleChange={updateRole}
                />

                {effectiveRole === 'organizer' ? (
                    <OrganizerView
                        events={myEvents}
                        onDelete={handleDeleteClick}
                    />
                ) : (
                    <ParticipantView
                        registrations={myRegistrations}
                    />
                )}
            </div>

            <DeleteEventModal
                isOpen={deleteModalOpen}
                onClose={() => !isDeleting && setDeleteModalOpen(false)}
                onConfirm={confirmDeleteEvent}
                eventTitle={eventToDelete?.title || ''}
                isDeleting={isDeleting}
            />
        </div>
    );
}
