import { supabase } from './supabase';
import type { UpcomingEvent, CategoryCounts } from './types';
import type { Database } from './database.types';

// Test Supabase connection on module load
console.log('🔍 Testing Supabase connection...');
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...');
console.log('Supabase client initialized:', !!supabase);

// Cache untuk menyimpan data sementara
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const REQUEST_TIMEOUT = 30000; // 30 seconds (increased from 15s)

/**
 * Sleep helper for retry delay
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry wrapper with exponential backoff
 */
async function withRetry<T>(
    fn: () => Promise<T>,
    retries: number = MAX_RETRIES,
    delay: number = RETRY_DELAY
): Promise<T> {
    try {
        return await fn();
    } catch (error: any) {
        if (retries === 0) {
            console.error('❌ Max retries reached:', error.message || error);
            throw error;
        }

        // Don't retry on timeout errors
        if (error.message?.includes('timeout')) {
            console.error('❌ Request timeout (not retrying):', error.message);
            throw error;
        }

        // Don't retry on certain errors
        if (error.code === 'PGRST116' || error.message?.includes('not found')) {
            throw error;
        }

        // Don't retry on syntax or permission errors
        if (error.code === 'PGRST301' || error.code === 'PGRST204' || error.message?.includes('syntax')) {
            console.error('❌ Query error (not retrying):', error.message || error);
            throw error;
        }

        if (process.env.NODE_ENV === 'development') {
            console.warn(`⚠️ Retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`, error.message || error);
        }
        await sleep(delay);
        return withRetry(fn, retries - 1, delay * 2); // Exponential backoff
    }
}

/**
 * Timeout wrapper
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = REQUEST_TIMEOUT): Promise<T> {
    const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs)
    );
    return Promise.race([promise, timeout]);
}

/**
 * Get cached data atau fetch dari Supabase with retry and timeout
 * IMPORTANT: Don't cache errors or empty results from errors
 */
export async function getCached<T>(
    key: string,
    fetcher: () => Promise<T>,
    cacheDuration: number = CACHE_DURATION,
    timeoutMs: number = REQUEST_TIMEOUT
): Promise<T> {
    const cached = cache.get(key);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < cacheDuration) {
        // Reduce console noise - only log in development
        console.log(`✅ Cache hit: ${key}`);
        return cached.data as T;
    }

    // Only log cache misses in development
    console.log(`🔄 Fetching: ${key}`);

    try {
        const data = await withRetry(() => withTimeout(fetcher(), timeoutMs));
        // Only cache successful results
        cache.set(key, { data, timestamp: now });
        console.log(`✅ Cached ${key}, data:`, Array.isArray(data) ? `Array(${data.length})` : typeof data);
        return data;
    } catch (error: any) {
        // Don't cache errors - let them propagate
        console.error(`❌ Error fetching ${key}:`, error.message || error);
        cache.delete(key); // Remove any stale cache on error
        throw error;
    }
}

/**
 * Clear cache by key atau clear all
 */
export function clearCache(key?: string) {
    if (key) {
        cache.delete(key);
    } else {
        cache.clear();
    }
}

/**
 * Optimized event fetch - hanya ambil field yang diperlukan
 */
export async function getEventOptimized(eventId: string) {
    return getCached(`event_${eventId}`, async () => {
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
    });
}

/**
 * Get events with speakers in single query (JOIN) - menghindari N+1 problem
 */
export async function getEventsWithSpeakers(
    category?: string,
    search?: string,
    limit?: number
) {
    // Create a clean cache key without undefined values
    const cacheKey = `events_speakers_${category || 'all'}_${search || 'all'}_${limit || 'all'}`;

    console.log('🔍 getEventsWithSpeakers called with:', { category, search, limit });

    // Use longer timeout for complex JOIN query, with graceful fallback if embed fails
    return getCached(cacheKey, async () => {
        console.log('🔍 Building query for events with speakers...');

        let query = supabase
            .from('events')
            .select(`
                *,
                speakers (
                    *
                )
            `)
            .eq('status', 'published')
            .order('start_date', { ascending: true });

        if (category) {
            query = query.eq('category', category);
        } if (search) {
            query = query.ilike('title', `%${search}%`);
        }

        if (limit) {
            query = query.limit(limit);
        }

        console.log('🔍 Executing query to Supabase...');
        const { data, error } = await query;

        if (error) {
            // If relational embed fails, gracefully fallback to plain events
            console.warn('⚠️ Embed query failed, falling back to plain events:', error.message || error);
            let fallback = supabase
                .from('events')
                .select('*')
                .eq('status', 'published')
                .order('start_date', { ascending: true });
            if (category) fallback = fallback.eq('category', category);
            if (search) fallback = fallback.ilike('title', `%${search}%`);
            if (limit) fallback = fallback.limit(limit);
            const { data: plainData, error: plainError } = await fallback;
            if (plainError) {
                console.error('❌ Plain events query also failed:', plainError);
                throw plainError;
            }
            console.log('✅ Fallback query successful, received', plainData?.length || 0, 'events');
            return plainData || [];
        }

        console.log('✅ Query successful, received', data?.length || 0, 'events');
        return data || [];
    }, 2 * 60 * 1000, 45000); // 2 min cache, 45s timeout for complex JOIN
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
    // Create a clean cache key without undefined values
    const cacheKey = `events_${page}_${pageSize}_${category || 'all'}_${search || 'all'}`;

    return getCached(cacheKey, async () => {
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
    }, 2 * 60 * 1000); // 2 minutes cache untuk list
}

/**
 * Optimized form fields fetch
 */
export async function getFormFieldsOptimized(eventId: string) {
    return getCached(`form_fields_${eventId}`, async () => {
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
    });
}

/**
 * Optimized speakers fetch
 */
export async function getSpeakersOptimized(eventId: string) {
    return getCached(`speakers_${eventId}`, async () => {
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
    });
}

/**
 * Optimized organizer fetch
 */
export async function getOrganizerOptimized(userId: string) {
    return getCached(`organizer_${userId}`, async () => {
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
    }, 10 * 60 * 1000); // 10 minutes cache for profiles
}

/**
 * Get event with all relations in optimized way using JOIN
 */
export async function getEventWithRelations(eventId: string) {
    return getCached(`event_full_${eventId}`, async () => {
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
            .select('id, full_name, avatar_url, city')
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
    }, 3 * 60 * 1000); // 3 minutes cache
}

/**
 * Get category counts efficiently
 */
export async function getCategoryCounts(): Promise<CategoryCounts> {
    return getCached('category_counts', async () => {
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
    }, 5 * 60 * 1000);
}

/**
 * Get upcoming events with limit
 */
export async function getUpcomingEvents(limit: number = 6): Promise<UpcomingEvent[]> {
    return getCached(`upcoming_events_${limit}`, async () => {
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
    }, 2 * 60 * 1000);
}

/**
 * Get user's registrations with event details
 */
/**
 * Get user's registrations with event details
 */
export async function getUserRegistrations(userId: string) {
    return getCached(`user_registrations_${userId}`, async () => {
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
            console.log('ℹ️ No registrations found for user:', userId);
            return [];
        }

        // Fetch events separately for better compatibility
        const eventIds = (registrations as Array<Pick<Database['public']['Tables']['registrations']['Row'], 'event_id'>>)
            .map((r) => r.event_id)
            .filter((id): id is string => Boolean(id));
        if (eventIds.length === 0) {
            console.warn('⚠️ No event_id found in registrations');
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
    }, 1 * 60 * 1000); // 1 minute cache
}

/**
 * Get organizer's events
 */
export async function getOrganizerEvents(userId: string) {
    return getCached(`organizer_events_${userId}`, async () => {
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
    }, 1 * 60 * 1000);
}

/**
 * Debounce helper untuk auto-save
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            timeout = null;
            func(...args);
        };

        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(later, wait);
    };
}

/**
 * Prefetch data untuk better UX
 */
export async function prefetchEvent(eventId: string) {
    // Prefetch in background, don't await
    getEventWithRelations(eventId).catch(err => {
        console.error('Prefetch error:', err);
    });
}
