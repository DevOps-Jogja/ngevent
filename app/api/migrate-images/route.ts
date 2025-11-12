import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const cookieStore = await cookies();
        const supabaseServer = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    },
                },
            }
        );

        const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get all events with image_url
        const { data: events, error: eventsError } = await supabase
            .from('events')
            .select('id, image_url')
            .not('image_url', 'is', null)
            .eq('organizer_id', user.id);

        if (eventsError) {
            console.error('Error fetching events:', eventsError);
            return NextResponse.json(
                { error: 'Failed to fetch events' },
                { status: 500 }
            );
        }

        const customDomain = process.env.CLOUDFLARE_R2_CUSTOM_DOMAIN;
        if (!customDomain) {
            return NextResponse.json(
                { error: 'Custom domain not configured' },
                { status: 500 }
            );
        }

        let migratedCount = 0;
        const results = [];

        for (const event of events) {
            if (event.image_url && event.image_url.includes('supabase.co')) {
                // Extract filename from Supabase URL
                // URL format: https://[project].supabase.co/storage/v1/object/public/events/[path]
                const urlParts = event.image_url.split('/storage/v1/object/public/events/');
                if (urlParts.length === 2) {
                    const filePath = urlParts[1];
                    const newUrl = `${customDomain}/event-images/${filePath}`;

                    // Update the event with new URL
                    const { error: updateError } = await supabase
                        .from('events')
                        .update({ image_url: newUrl })
                        .eq('id', event.id)
                        .eq('organizer_id', user.id);

                    if (updateError) {
                        console.error(`Error updating event ${event.id}:`, updateError);
                        results.push({
                            eventId: event.id,
                            status: 'error',
                            error: updateError.message
                        });
                    } else {
                        migratedCount++;
                        results.push({
                            eventId: event.id,
                            oldUrl: event.image_url,
                            newUrl: newUrl,
                            status: 'success'
                        });
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Migrated ${migratedCount} event images to R2 custom domain`,
            results: results
        });

    } catch (error) {
        console.error('Migration error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}