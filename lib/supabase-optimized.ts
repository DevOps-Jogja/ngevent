import { supabase } from './supabase';

// Cache untuk menyimpan data sementara
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached data atau fetch dari Supabase
 */
export async function getCached<T>(
    key: string,
    fetcher: () => Promise<T>,
    cacheDuration: number = CACHE_DURATION
): Promise<T> {
    const cached = cache.get(key);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < cacheDuration) {
        return cached.data as T;
    }

    const data = await fetcher();
    cache.set(key, { data, timestamp: now });
    return data;
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

        if (error) throw error;
        return data;
    });
}

/**
 * Optimized events list - dengan pagination
 */
export async function getEventsOptimized(
    page: number = 0,
    pageSize: number = 10,
    category?: string,
    search?: string
) {
    const cacheKey = `events_${page}_${pageSize}_${category}_${search}`;

    return getCached(cacheKey, async () => {
        let query = supabase
            .from('events')
            .select(`
                id,
                title,
                start_date,
                end_date,
                location,
                category,
                capacity,
                registration_fee,
                image_url,
                status
            `, { count: 'exact' })
            .eq('status', 'published')
            .order('start_date', { ascending: true })
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (category) {
            query = query.eq('category', category);
        }

        if (search) {
            query = query.ilike('title', `%${search}%`);
        }

        const { data, error, count } = await query;

        if (error) throw error;
        return { data, count };
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

        if (error) throw error;
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

        if (error) throw error;
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

        if (error) throw error;
        return data;
    }, 10 * 60 * 1000); // 10 minutes cache for profiles
}

/**
 * Batch fetch untuk multiple resources
 */
export async function getEventWithRelations(eventId: string) {
    return getCached(`event_full_${eventId}`, async () => {
        const [event, formFields, speakers] = await Promise.all([
            getEventOptimized(eventId),
            getFormFieldsOptimized(eventId),
            getSpeakersOptimized(eventId)
        ]);

        const organizer = await getOrganizerOptimized(event.organizer_id);

        return {
            event,
            formFields,
            speakers,
            organizer
        };
    }, 3 * 60 * 1000); // 3 minutes cache
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
