import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

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

// Create admin client with service role for storage operations (bypasses RLS)
function createAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );
}

export async function POST(request: NextRequest) {
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
        const filePath = `${folder}/${fileName}`;        // Use admin client for storage upload to bypass RLS
        const adminClient = createAdminClient();
        const { error: uploadError } = await adminClient.storage
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
        const { data: urlData } = adminClient.storage
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

        if (!path) {
            return NextResponse.json(
                { error: 'No path provided' },
                { status: 400 }
            );
        }

        // Use admin client for storage delete to bypass RLS
        const adminClient = createAdminClient();
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
