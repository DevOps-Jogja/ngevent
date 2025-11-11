import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdminClient } from '@/lib/supabase-admin';
import { supabaseFetch } from '@/lib/supabase';
import { cookies } from 'next/headers';

// Helper to validate required env vars for admin storage operations
function getEnvOrReport() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
        // Structured logs to make issues obvious in Vercel/Netlify logs
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'error',
            message: 'Supabase environment variables missing for upload route',
            env_check: {
                NEXT_PUBLIC_SUPABASE_URL: url ? 'present' : 'missing',
                SUPABASE_SERVICE_ROLE_KEY: serviceKey ? 'present' : 'missing',
                node_env: process.env.NODE_ENV || 'development'
            },
            action: 'Add missing env vars to .env.local and restart dev server'
        }));
    }

    return { url, serviceKey };
}

async function createAuthClient() {
    const cookieStore = await cookies();

    return createServerClient(
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
}

function createUserStorageClient(accessToken: string) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(url, anon, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            fetch: supabaseFetch,
        },
    });
}

// Create admin client with service role for storage operations (bypasses RLS)
function createAdminClient() {
    const { client } = getSupabaseAdminClient();
    return client; // may be null when missing service role key
}

export async function POST(request: NextRequest) {
    try {
        // Check authentication using auth client
        const supabase = await createAuthClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        const sessionRes = await supabase.auth.getSession();
        const accessToken = sessionRes.data.session?.access_token;

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'File size must be less than 5MB' },
                { status: 400 }
            );
        }

        // Validate file type based on folder
        const url = new URL(request.url);
        const folder = url.searchParams.get('folder') || 'event-images';

        // Allow images for most folders, but allow PDF for payment-proofs
        const allowedTypes = folder === 'payment-proofs'
            ? ['image/', 'application/pdf']
            : ['image/'];

        const isValidType = allowedTypes.some(type => file.type.startsWith(type));

        if (!isValidType) {
            const allowedTypesStr = folder === 'payment-proofs'
                ? 'images and PDF files'
                : 'image files';
            return NextResponse.json(
                { error: `Only ${allowedTypesStr} are allowed` },
                { status: 400 }
            );
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        // Determine storage client: prefer admin when available; fallback to user client for non-sensitive image uploads
        const adminClient = createAdminClient();
        const isImage = file.type.startsWith('image/');

        if (!adminClient && (!isImage || folder === 'payment-proofs')) {
            // For sensitive folders (payment proofs) or non-image types, require admin key
            return NextResponse.json(
                {
                    error: 'Admin key required',
                    details: 'Uploading to this folder requires SUPABASE_SERVICE_ROLE_KEY',
                },
                { status: 403 }
            );
        }

        // If no admin client, construct a user storage client with explicit bearer token to satisfy RLS owner assignment
        const storageClient = adminClient ?? (accessToken ? createUserStorageClient(accessToken) : supabase);

        const { error: uploadError } = await storageClient.storage
            .from('events')
            .upload(filePath, file, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return NextResponse.json(
                { error: 'Failed to upload file' },
                { status: 500 }
            );
        }

        // Get public URL
        const { data: urlData } = storageClient.storage
            .from('events')
            .getPublicUrl(filePath);

        return NextResponse.json({
            url: urlData.publicUrl,
            path: filePath,
        });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        // Check authentication using auth client
        const supabase = await createAuthClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const path = searchParams.get('path');
        const sessionRes = await supabase.auth.getSession();
        const accessToken = sessionRes.data.session?.access_token;

        if (!path) {
            return NextResponse.json(
                { error: 'No path provided' },
                { status: 400 }
            );
        }

        // Use admin client for storage delete when available, otherwise fallback to user client for safe paths
        const adminClient = createAdminClient();

        if (!adminClient) {
            // Only allow user to delete their own image files in non-sensitive folders when admin key is missing
            const isOwnFile = path.includes(`/${user.id}-`);
            const isSensitiveFolder = path.startsWith('payment-proofs/');
            const isImagePath = /(\.png|\.jpg|\.jpeg|\.gif|\.webp|\.avif)$/i.test(path);

            if (!isOwnFile || isSensitiveFolder || !isImagePath) {
                return NextResponse.json(
                    {
                        error: 'Admin key required for this deletion',
                        details: 'You can only delete your own image files when service role is not configured',
                    },
                    { status: 403 }
                );
            }

            const userStorage = accessToken ? createUserStorageClient(accessToken) : supabase;
            const { error: deleteError } = await userStorage.storage
                .from('events')
                .remove([path]);

            if (deleteError) {
                console.error('Delete error:', deleteError);
                return NextResponse.json(
                    { error: 'Failed to delete file' },
                    { status: 500 }
                );
            }

            return NextResponse.json({ success: true });
        }

        const { error: deleteError } = await adminClient.storage
            .from('events')
            .remove([path]);

        if (deleteError) {
            console.error('Delete error:', deleteError);
            return NextResponse.json(
                { error: 'Failed to delete file' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
