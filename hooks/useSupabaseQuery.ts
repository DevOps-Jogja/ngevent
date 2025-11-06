import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getEventOptimized,
    getEventsOptimized,
    getEventWithRelations,
    getFormFieldsOptimized,
    getSpeakersOptimized,
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
        queryFn: async () => {
            if (!userId) return [];

            const { data, error } = await supabase
                .from('events')
                .select('id, title, start_date, status, image_url, category')
                .eq('organizer_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
        enabled: !!userId,
        staleTime: 1 * 60 * 1000, // 1 minute for dashboard
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
