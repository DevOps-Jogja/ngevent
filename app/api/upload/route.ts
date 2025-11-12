import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Helper to validate required env vars for R2 storage operations
function getR2EnvOrReport() {
    const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
    const accessKey = process.env.CLOUDFLARE_R2_ACCESS_KEY;
    const secretKey = process.env.CLOUDFLARE_R2_SECRET_KEY;
    const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;

    if (!accountId || !accessKey || !secretKey || !bucketName) {
        // Structured logs to make issues obvious in Vercel/Netlify logs
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'error',
            message: 'Cloudflare R2 environment variables missing for upload route',
            env_check: {
                CLOUDFLARE_R2_ACCOUNT_ID: accountId ? 'present' : 'missing',
                CLOUDFLARE_R2_ACCESS_KEY: accessKey ? 'present' : 'missing',
                CLOUDFLARE_R2_SECRET_KEY: secretKey ? 'present' : 'missing',
                CLOUDFLARE_R2_BUCKET_NAME: bucketName ? 'present' : 'missing',
                node_env: process.env.NODE_ENV || 'development'
            },
            action: 'Add missing env vars to .env.local and restart dev server'
        }));
    }

    return { accountId, accessKey, secretKey, bucketName };
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

// Create R2 client for storage operations
function createR2Client() {
    const { accountId, accessKey, secretKey } = getR2EnvOrReport();

    if (!accountId || !accessKey || !secretKey) {
        return null;
    }

    return new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: accessKey,
            secretAccessKey: secretKey,
        },
    });
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

        // Determine storage client: use R2 client for uploads
        const r2Client = createR2Client();
        const { accountId, bucketName } = getR2EnvOrReport();

        if (!r2Client || !bucketName || !accountId) {
            return NextResponse.json(
                {
                    error: 'R2 configuration missing',
                    details: 'Cloudflare R2 credentials not configured',
                },
                { status: 500 }
            );
        }

        // Convert File to Buffer for R2 upload
        const fileBuffer = Buffer.from(await file.arrayBuffer());

        // Upload to R2
        const uploadCommand = new PutObjectCommand({
            Bucket: bucketName,
            Key: filePath,
            Body: fileBuffer,
            ContentType: file.type,
        });

        const uploadResult = await r2Client.send(uploadCommand);

        if (!uploadResult) {
            console.error('Upload failed');
            return NextResponse.json(
                { error: 'Failed to upload file' },
                { status: 500 }
            );
        }

        // Use custom domain for public access
        const customDomain = process.env.CLOUDFLARE_R2_CUSTOM_DOMAIN || `https://${accountId}.r2.cloudflarestorage.com`;
        const publicUrl = `${customDomain}/${filePath}`;

        return NextResponse.json({
            url: publicUrl,
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

        // Use R2 client for storage delete
        const r2Client = createR2Client();
        const { bucketName } = getR2EnvOrReport();

        if (!r2Client || !bucketName) {
            return NextResponse.json(
                {
                    error: 'R2 configuration missing',
                    details: 'Cloudflare R2 credentials not configured',
                },
                { status: 500 }
            );
        }

        // Delete from R2
        const deleteCommand = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: path,
        });

        const deleteResult = await r2Client.send(deleteCommand);

        if (!deleteResult) {
            console.error('Delete failed');
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
