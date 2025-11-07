import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getEventOptimized,
    getEventsOptimized,
    getEventWithRelations,
    getFormFieldsOptimized,
    getSpeakersOptimized,
    getEventsWithSpeakers,
    getCategoryCounts,
    getUpcomingEvents,
    getUserRegistrations,
    getOrganizerEvents,
    clearCache
} from '@/lib/supabase-optimized';
import { supabase } from '@/lib/supabase';

/**
 * Hook untuk fetch single event dengan caching
 */
export function useEvent(eventId: string | null) {
    return useQuery({
        queryKey: ['event', eventId],
        queryFn: () => eventId ? getEventOptimized(eventId) : null,
        enabled: !!eventId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Hook untuk fetch event dengan semua relasi (optimized)
 */
export function useEventWithRelations(eventId: string | null) {
    return useQuery({
        queryKey: ['event-full', eventId],
        queryFn: () => eventId ? getEventWithRelations(eventId) : null,
        enabled: !!eventId,
        staleTime: 3 * 60 * 1000, // 3 minutes
    });
}

/**
 * Hook untuk fetch events list dengan pagination
 */
export function useEvents(page: number = 0, pageSize: number = 10, category?: string, search?: string) {
    return useQuery({
        queryKey: ['events', page, pageSize, category, search],
        queryFn: () => getEventsOptimized(page, pageSize, category, search),
        staleTime: 2 * 60 * 1000, // 2 minutes
        retry: 2,
    });
}

/**
 * Hook untuk fetch events dengan speakers (untuk homepage & events list)
 */
export function useEventsWithSpeakers(category?: string, search?: string, limit?: number) {
    return useQuery({
        queryKey: ['events-speakers', category, search, limit],
        queryFn: () => getEventsWithSpeakers(category, search, limit),
        staleTime: 2 * 60 * 1000,
        retry: 2,
    });
}

/**
 * Hook untuk fetch upcoming events
 */
export function useUpcomingEvents(limit: number = 6) {
    return useQuery({
        queryKey: ['upcoming-events', limit],
        queryFn: () => getUpcomingEvents(limit),
        staleTime: 2 * 60 * 1000,
        retry: 2,
    });
}

/**
 * Hook untuk fetch category counts
 */
export function useCategoryCounts() {
    return useQuery({
        queryKey: ['category-counts'],
        queryFn: getCategoryCounts,
        staleTime: 5 * 60 * 1000,
        retry: 2,
    });
}

/**
 * Hook untuk fetch form fields
 */
export function useFormFields(eventId: string | null) {
    return useQuery({
        queryKey: ['form-fields', eventId],
        queryFn: () => eventId ? getFormFieldsOptimized(eventId) : null,
        enabled: !!eventId,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Hook untuk fetch speakers
 */
export function useSpeakers(eventId: string | null) {
    return useQuery({
        queryKey: ['speakers', eventId],
        queryFn: () => eventId ? getSpeakersOptimized(eventId) : null,
        enabled: !!eventId,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Hook untuk fetch user's events (dashboard)
 */
export function useMyEvents(userId: string | null) {
    return useQuery({
        queryKey: ['my-events', userId],
        queryFn: () => userId ? getOrganizerEvents(userId) : [],
        enabled: !!userId,
        staleTime: 1 * 60 * 1000, // 1 minute for dashboard
        retry: 2,
    });
}

/**
 * Hook untuk fetch user's registrations (dashboard)
 */
export function useMyRegistrations(userId: string | null) {
    return useQuery({
        queryKey: ['my-registrations', userId],
        queryFn: () => {
            if (!userId) return Promise.resolve([]);
            return getUserRegistrations(userId);
        },
        enabled: !!userId,
        staleTime: 1 * 60 * 1000,
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
}

/**
 * Hook untuk create event dengan optimistic update
 */
export function useCreateEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (eventData: any) => {
            const { data, error } = await supabase
                .from('events')
                .insert(eventData)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data, variables) => {
            // Invalidate my-events query
            queryClient.invalidateQueries({ queryKey: ['my-events'] });
            // Clear events list cache
            clearCache('events');
        },
    });
}

/**
 * Hook untuk update event
 */
export function useUpdateEvent(eventId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (updates: any) => {
            const { data, error } = await supabase
                .from('events')
                .update(updates)
                .eq('id', eventId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            // Invalidate specific event query
            queryClient.invalidateQueries({ queryKey: ['event', eventId] });
            queryClient.invalidateQueries({ queryKey: ['event-full', eventId] });
            queryClient.invalidateQueries({ queryKey: ['my-events'] });

            // Clear cache
            clearCache(`event_${eventId}`);
            clearCache(`event_full_${eventId}`);
        },
    });
}

/**
 * Hook untuk delete event
 */
export function useDeleteEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (eventId: string) => {
            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', eventId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-events'] });
            queryClient.invalidateQueries({ queryKey: ['events'] });
        },
    });
}

/**
 * Hook untuk check registration status
 */
export function useRegistrationStatus(eventId: string | null, userId: string | null) {
    return useQuery({
        queryKey: ['registration-status', eventId, userId],
        queryFn: async () => {
            if (!eventId || !userId) return false;

            const { data, error } = await supabase
                .from('registrations')
                .select('id')
                .eq('event_id', eventId)
                .eq('user_id', userId)
                .maybeSingle();

            if (error) throw error;
            return !!data;
        },
        enabled: !!eventId && !!userId,
        staleTime: 30 * 1000, // 30 seconds for registration status
    });
}

/**
 * Hook untuk fetch registrations count
 */
export function useRegistrationsCount(eventId: string | null) {
    return useQuery({
        queryKey: ['registrations-count', eventId],
        queryFn: async () => {
            if (!eventId) return 0;

            const { count, error } = await supabase
                .from('registrations')
                .select('*', { count: 'exact', head: true })
                .eq('event_id', eventId);

            if (error) throw error;
            return count || 0;
        },
        enabled: !!eventId,
        staleTime: 1 * 60 * 1000, // 1 minute
    });
}
