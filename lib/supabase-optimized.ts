import { supabase } from './supabase';
import type { UpcomingEvent, CategoryCounts } from './types';
import type { Database } from './database.types';

// Test Supabase connection on module load
if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Testing Supabase connection...');
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...');
    console.log('Supabase client initialized:', !!supabase);
}

/**
 * Optimized event fetch - hanya ambil field yang diperlukan
 */
export async function getEventOptimized(eventId: string) {
    const { data, error } = await supabase
        .from('events')
        .select(`
            id,
            title,
            description,
            start_date,
            end_date,
            location,
            category,
            capacity,
            registration_fee,
            status,
            image_url,
            organizer_id,
            created_at
        `)
        .eq('id', eventId)
        .single();

    if (error) {
        console.error('Error fetching event:', error);
        throw error;
    }
    return data;
}

/**
 * Get events with speakers in single query (JOIN) - menghindari N+1 problem
 */
export async function getEventsWithSpeakers(
    category?: string,
    search?: string,
    limit?: number
) {
    console.log('🔍 getEventsWithSpeakers called with:', { category, search, limit });

    let query = supabase
        .from('events')
        .select(`
            *,
            speakers (
                *
            ),
            profiles!events_organizer_id_fkey (
                full_name,
                avatar_url
            )
        `)
        .eq('status', 'published')
        .order('start_date', { ascending: true });

    if (category && category !== 'all') {
        query = query.eq('category', category);
    }
    if (search) {
        query = query.ilike('title', `%${search}%`);
    }

    if (limit) {
        query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching events with speakers:', error);
        throw error;
    }

    return data || [];
}

/**
 * Optimized events list - dengan pagination dan server-side filtering
 */
export async function getEventsOptimized(
    page: number = 0,
    pageSize: number = 10,
    category?: string,
    search?: string
) {
    let query = supabase
        .from('events')
        .select(`
            *,
            speakers (
                *
            )
        `, { count: 'exact' })
        .eq('status', 'published')
        .order('start_date', { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1);

    if (category && category !== 'all') {
        query = query.eq('category', category);
    }

    if (search) {
        query = query.ilike('title', `%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
        console.error('Error fetching events:', error);
        throw error;
    }
    return { data: data || [], count: count || 0 };
}

/**
 * Optimized form fields fetch
 */
export async function getFormFieldsOptimized(eventId: string) {
    const { data, error } = await supabase
        .from('form_fields')
        .select('id, field_name, field_type, is_required, options, order_index')
        .eq('event_id', eventId)
        .order('order_index', { ascending: true });

    if (error) {
        console.error('Error fetching form fields:', error);
        throw error;
    }
    return data || [];
}

/**
 * Optimized speakers fetch
 */
export async function getSpeakersOptimized(eventId: string) {
    const { data, error } = await supabase
        .from('speakers')
        .select('id, name, title, company, bio, photo_url, linkedin_url, twitter_url, website_url, order_index')
        .eq('event_id', eventId)
        .order('order_index', { ascending: true });

    if (error) {
        console.error('Error fetching speakers:', error);
        throw error;
    }
    return data || [];
}

/**
 * Optimized organizer fetch
 */
export async function getOrganizerOptimized(userId: string) {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, city')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching organizer:', error);
        throw error;
    }
    return data;
}

/**
 * Get event with all relations in optimized way using JOIN
 */
export async function getEventWithRelations(eventId: string) {
    // Single query with JOIN untuk menghindari multiple requests
    const { data: event, error: eventError } = await supabase
        .from('events')
        .select(`
            id,
            title,
            description,
            start_date,
            end_date,
            location,
            category,
            capacity,
            registration_fee,
            status,
            image_url,
            organizer_id,
            created_at,
            speakers (
                id,
                name,
                title,
                company,
                bio,
                photo_url,
                linkedin_url,
                twitter_url,
                website_url,
                order_index
            ),
            form_fields (
                id,
                field_name,
                field_type,
                is_required,
                options,
                order_index
            )
        `)
        .eq('id', eventId)
        .single();

    if (eventError) {
        console.error('Error fetching event with relations:', eventError);
        throw eventError;
    }

    // Fetch organizer separately (karena tidak bisa JOIN ke profiles dari events)
    const { data: organizer, error: organizerError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, city, phone')
        .eq('id', event.organizer_id)
        .single();

    if (organizerError) {
        console.warn('Error fetching organizer:', organizerError);
    }

    return {
        ...event,
        organizer: organizer || null,
        speakers: event.speakers || [],
        formFields: event.form_fields || []
    };
}

/**
 * Get category counts efficiently
 */
export async function getCategoryCounts(): Promise<CategoryCounts> {
    const { data, error } = await supabase
        .from('events')
        .select('category')
        .eq('status', 'published');

    if (error) {
        console.error('Error fetching category counts:', error);
        throw error;
    }

    // Count occurrences
    const counts: CategoryCounts = {};
    (data || []).forEach((event: { category: string | null }) => {
        const key = event.category ?? 'uncategorized';
        counts[key] = (counts[key] || 0) + 1;
    });

    return counts;
}

/**
 * Get upcoming events with limit
 */
export async function getUpcomingEvents(limit: number = 6): Promise<UpcomingEvent[]> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from('events')
        .select(`
            id,
            title,
            description,
            start_date,
            end_date,
            location,
            category,
            capacity,
            image_url,
            speakers (
                id,
                name,
                photo_url
            )
        `)
        .eq('status', 'published')
        .gte('start_date', now)
        .order('start_date', { ascending: true })
        .limit(limit);

    if (error) {
        console.error('Error fetching upcoming events:', error);
        throw error;
    }
    return (data as UpcomingEvent[]) || [];
}

/**
 * Get user's registrations with event details
 */
export async function getUserRegistrations(userId: string) {
    // Fetch registrations first (only fields that exist in schema)
    const { data: registrations, error: regError } = await supabase
        .from('registrations')
        .select('id, status, registered_at, event_id')
        .eq('user_id', userId)
        .order('registered_at', { ascending: false });

    if (regError) {
        console.error('❌ Error fetching registrations:', regError);
        throw new Error(`Failed to fetch registrations: ${regError.message || 'Unknown error'}`);
    }

    if (!registrations || registrations.length === 0) {
        return [];
    }

    // Fetch events separately for better compatibility
    const eventIds = (registrations as Array<Pick<Database['public']['Tables']['registrations']['Row'], 'event_id'>>)
        .map((r) => r.event_id)
        .filter((id): id is string => Boolean(id));
    if (eventIds.length === 0) {
        return (registrations as Array<Pick<Database['public']['Tables']['registrations']['Row'], 'id' | 'status' | 'registered_at' | 'event_id'>>).map((reg) => ({
            ...reg,
            events: null
        }));
    }

    const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, title, description, start_date, end_date, location, category, registration_fee, image_url')
        .in('id', eventIds);

    if (eventsError) {
        console.error('❌ Error fetching events for registrations:', eventsError);
        // Return registrations without event details instead of throwing
        const regs = registrations as Array<Pick<Database['public']['Tables']['registrations']['Row'], 'id' | 'status' | 'registered_at' | 'event_id'>>;
        return regs.map((reg) => ({ ...reg, events: null }));
    }

    // Combine data
    const eventsArray = (events ?? []) as Array<Pick<Database['public']['Tables']['events']['Row'], 'id' | 'title' | 'description' | 'start_date' | 'end_date' | 'location' | 'category' | 'registration_fee' | 'image_url'>>;
    const eventsMap = new Map(eventsArray.map((e) => [e.id, e]));
    const regs = registrations as Array<Pick<Database['public']['Tables']['registrations']['Row'], 'id' | 'status' | 'registered_at' | 'event_id'>>;
    return regs.map((reg) => ({
        ...reg,
        events: eventsMap.get(reg.event_id) || null
    }));
}

/**
 * Get organizer's events
 */
export async function getOrganizerEvents(userId: string) {
    const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('organizer_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching organizer events:', error);
        throw error;
    }
    return data || [];
}

/**
 * Clear cache - No-op since cache is removed, kept for compatibility
 */
export function clearCache(key?: string) {
    // No-op
}
