/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'avatars.githubusercontent.com',
            },
            {
                protocol: 'https',
                hostname: '**.supabase.co',
            },
            {
                protocol: 'https',
                hostname: 'supabase.noma.my.id',
            },
            {
                protocol: 'https',
                hostname: 'storage.noma.my.id',
            },
        ],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '5mb',
        },
    },
    // Allow dev server to accept requests from custom domain
    allowedDevOrigins: [
        'ngevent.noma.my.id',
        'https://ngevent.noma.my.id',
    ],
}

module.exports = nextConfig
