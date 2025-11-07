/**
 * Cached Supabase Queries
 * Custom hooks with automatic caching and React Query integration
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import {
    getCache,
    setCache,
    clearCache,
    invalidateRelatedCaches,
    CacheKeys,
    CACHE_DURATION,
} from '@/lib/cache-helpers';

type Event = Database['public']['Tables']['events']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type Registration = Database['public']['Tables']['registrations']['Row'];
type Notification = Database['public']['Tables']['notifications']['Row'];

/**
 * Fetch user profile with caching
 */
export function useProfile(userId: string | undefined) {
    return useQuery({
        queryKey: ['profile', userId],
        queryFn: async () => {
            if (!userId) return null;

            // Check cache first
            const cached = getCache<Profile>(CacheKeys.profile(userId));
            if (cached) {
                console.log('📦 Profile loaded from cache');
                return cached;
            }

            // Fetch from Supabase
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;

            // Cache the result
            if (data) {
                setCache(CacheKeys.profile(userId), data, CACHE_DURATION.PROFILE);
            }

            return data;
        },
        enabled: !!userId,
        staleTime: CACHE_DURATION.PROFILE,
        gcTime: CACHE_DURATION.PROFILE * 2,
    });
}

/**
 * Fetch all events with caching
 */
export function useEvents(filter?: 'upcoming' | 'past' | 'all') {
    return useQuery({
        queryKey: ['events', filter || 'all'],
        queryFn: async () => {
            const cacheKey = CacheKeys.events(filter);

            // Check cache first
            const cached = getCache<Event[]>(cacheKey);
            if (cached) {
                console.log('📦 Events loaded from cache');
                return cached;
            }

            // Build query
            let query = supabase
                .from('events')
                .select('*')
                .order('date', { ascending: true });

            const now = new Date().toISOString();

            if (filter === 'upcoming') {
                query = query.gte('date', now);
            } else if (filter === 'past') {
                query = query.lt('date', now);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Cache the result
            if (data) {
                setCache(cacheKey, data, CACHE_DURATION.EVENTS);
            }

            return data || [];
        },
        staleTime: CACHE_DURATION.EVENTS,
        gcTime: CACHE_DURATION.EVENTS * 2,
    });
}

/**
 * Fetch single event with caching
 */
export function useEvent(eventId: string | undefined) {
    return useQuery({
        queryKey: ['event', eventId],
        queryFn: async () => {
            if (!eventId) return null;

            // Check cache first
            const cached = getCache<Event>(CacheKeys.eventDetail(eventId));
            if (cached) {
                console.log('📦 Event detail loaded from cache');
                return cached;
            }

            // Fetch from Supabase
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('id', eventId)
                .single();

            if (error) throw error;

            // Cache the result
            if (data) {
                setCache(CacheKeys.eventDetail(eventId), data, CACHE_DURATION.EVENT_DETAIL);
            }

            return data;
        },
        enabled: !!eventId,
        staleTime: CACHE_DURATION.EVENT_DETAIL,
        gcTime: CACHE_DURATION.EVENT_DETAIL * 2,
    });
}

/**
 * Fetch user's events (organizer)
 */
export function useUserEvents(userId: string | undefined) {
    return useQuery({
        queryKey: ['userEvents', userId],
        queryFn: async () => {
            if (!userId) return [];

            // Check cache first
            const cached = getCache<Event[]>(CacheKeys.userEvents(userId));
            if (cached) {
                console.log('📦 User events loaded from cache');
                return cached;
            }

            // Fetch from Supabase
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('organizer_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Cache the result
            if (data) {
                setCache(CacheKeys.userEvents(userId), data, CACHE_DURATION.EVENTS);
            }

            return data || [];
        },
        enabled: !!userId,
        staleTime: CACHE_DURATION.EVENTS,
        gcTime: CACHE_DURATION.EVENTS * 2,
    });
}

/**
 * Fetch user's registrations
 */
export function useUserRegistrations(userId: string | undefined) {
    return useQuery({
        queryKey: ['userRegistrations', userId],
        queryFn: async () => {
            if (!userId) return [];

            // Check cache first
            const cached = getCache<any[]>(CacheKeys.userRegistrations(userId));
            if (cached) {
                console.log('📦 User registrations loaded from cache');
                return cached;
            }

            // Fetch from Supabase
            const { data, error } = await supabase
                .from('registrations')
                .select(`
                    *,
                    events (
                        id,
                        title,
                        date,
                        location,
                        image_url
                    )
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Cache the result
            if (data) {
                setCache(CacheKeys.userRegistrations(userId), data, CACHE_DURATION.REGISTRATIONS);
            }

            return data || [];
        },
        enabled: !!userId,
        staleTime: CACHE_DURATION.REGISTRATIONS,
        gcTime: CACHE_DURATION.REGISTRATIONS * 2,
    });
}

/**
 * Fetch event registrations (for organizer)
 */
export function useEventRegistrations(eventId: string | undefined) {
    return useQuery({
        queryKey: ['eventRegistrations', eventId],
        queryFn: async () => {
            if (!eventId) return [];

            // Check cache first
            const cached = getCache<any[]>(CacheKeys.eventRegistrations(eventId));
            if (cached) {
                console.log('📦 Event registrations loaded from cache');
                return cached;
            }

            // Fetch from Supabase
            const { data, error } = await supabase
                .from('registrations')
                .select(`
                    *,
                    profiles (
                        full_name,
                        email
                    )
                `)
                .eq('event_id', eventId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Cache the result
            if (data) {
                setCache(CacheKeys.eventRegistrations(eventId), data, CACHE_DURATION.REGISTRATIONS);
            }

            return data || [];
        },
        enabled: !!eventId,
        staleTime: CACHE_DURATION.REGISTRATIONS,
        gcTime: CACHE_DURATION.REGISTRATIONS * 2,
    });
}

/**
 * Fetch user notifications
 */
export function useNotifications(userId: string | undefined) {
    return useQuery({
        queryKey: ['notifications', userId],
        queryFn: async () => {
            if (!userId) return [];

            // Check cache first
            const cached = getCache<Notification[]>(CacheKeys.notifications(userId));
            if (cached) {
                console.log('📦 Notifications loaded from cache');
                return cached;
            }

            // Fetch from Supabase
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            // Cache the result
            if (data) {
                setCache(CacheKeys.notifications(userId), data, CACHE_DURATION.NOTIFICATIONS);
            }

            return data || [];
        },
        enabled: !!userId,
        staleTime: CACHE_DURATION.NOTIFICATIONS,
        gcTime: CACHE_DURATION.NOTIFICATIONS * 2,
    });
}

/**
 * Dashboard stats with caching
 */
export function useDashboardStats(userId: string | undefined) {
    return useQuery({
        queryKey: ['dashboardStats', userId],
        queryFn: async () => {
            if (!userId) return null;

            // Check cache first
            const cached = getCache<any>(CacheKeys.dashboardStats(userId));
            if (cached) {
                console.log('📦 Dashboard stats loaded from cache');
                return cached;
            }

            // Fetch all data in parallel
            const [
                { data: myEvents },
                { data: myRegistrations },
                { data: profile }
            ] = await Promise.all([
                supabase.from('events').select('id').eq('organizer_id', userId),
                supabase.from('registrations').select('id').eq('user_id', userId),
                supabase.from('profiles').select('*').eq('id', userId).single()
            ]);

            const stats = {
                totalEvents: myEvents?.length || 0,
                totalRegistrations: myRegistrations?.length || 0,
                profile: profile || null
            };

            // Cache the result
            setCache(CacheKeys.dashboardStats(userId), stats, CACHE_DURATION.STATS);

            return stats;
        },
        enabled: !!userId,
        staleTime: CACHE_DURATION.STATS,
        gcTime: CACHE_DURATION.STATS * 2,
    });
}

/**
 * Mutation: Create event with cache invalidation
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
            // Invalidate all event caches
            queryClient.invalidateQueries({ queryKey: ['events'] });
            queryClient.invalidateQueries({ queryKey: ['userEvents'] });
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });

            // Clear localStorage cache
            invalidateRelatedCaches('event');
        },
    });
}

/**
 * Mutation: Update event with cache invalidation
 */
export function useUpdateEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ eventId, updates }: { eventId: string; updates: any }) => {
            const { data, error } = await supabase
                .from('events')
                .update(updates)
                .eq('id', eventId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data, variables) => {
            // Invalidate specific event and list caches
            queryClient.invalidateQueries({ queryKey: ['event', variables.eventId] });
            queryClient.invalidateQueries({ queryKey: ['events'] });
            queryClient.invalidateQueries({ queryKey: ['userEvents'] });

            // Clear localStorage cache
            invalidateRelatedCaches('event', variables.eventId);
        },
    });
}

/**
 * Mutation: Delete event with cache invalidation
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
        onSuccess: (data, eventId) => {
            // Invalidate all event caches
            queryClient.invalidateQueries({ queryKey: ['events'] });
            queryClient.invalidateQueries({ queryKey: ['userEvents'] });
            queryClient.invalidateQueries({ queryKey: ['event', eventId] });
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });

            // Clear localStorage cache
            invalidateRelatedCaches('event', eventId);
        },
    });
}

/**
 * Mutation: Create registration with cache invalidation
 */
export function useCreateRegistration() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (registrationData: any) => {
            const { data, error } = await supabase
                .from('registrations')
                .insert(registrationData)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data, variables) => {
            // Invalidate registration caches
            queryClient.invalidateQueries({ queryKey: ['userRegistrations'] });
            queryClient.invalidateQueries({ queryKey: ['eventRegistrations'] });
            queryClient.invalidateQueries({ queryKey: ['event', variables.event_id] });

            // Clear localStorage cache
            invalidateRelatedCaches('registration', variables.event_id);
        },
    });
}

/**
 * Mutation: Update registration status with cache invalidation
 */
export function useUpdateRegistration() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ registrationId, updates }: { registrationId: string; updates: any }) => {
            const { data, error } = await supabase
                .from('registrations')
                .update(updates)
                .eq('id', registrationId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            // Invalidate registration caches
            queryClient.invalidateQueries({ queryKey: ['userRegistrations'] });
            queryClient.invalidateQueries({ queryKey: ['eventRegistrations'] });

            if (data?.event_id) {
                queryClient.invalidateQueries({ queryKey: ['event', data.event_id] });
            }

            // Clear localStorage cache
            invalidateRelatedCaches('registration');
        },
    });
}

/**
 * Mutation: Update profile with cache invalidation
 */
export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userId, updates }: { userId: string; updates: any }) => {
            const { data, error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data, variables) => {
            // Invalidate profile cache
            queryClient.invalidateQueries({ queryKey: ['profile', variables.userId] });
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });

            // Clear localStorage cache
            invalidateRelatedCaches('profile', variables.userId);
        },
    });
}
