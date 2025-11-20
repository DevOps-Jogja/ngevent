/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.com',
            },
            {
                protocol: 'https',
                hostname: '**.id',
            },
            {
                protocol: 'https',
                hostname: '**.my.id',
            },
            {
                protocol: 'https',
                hostname: '**.org',
            },
            {
                protocol: 'https',
                hostname: '**.net',
            },
            {
                protocol: 'https',
                hostname: '**.io',
            },
            {
                protocol: 'https',
                hostname: '**.dev',
            },
            {
                protocol: 'https',
                hostname: '**.app',
            },
            {
                protocol: 'https',
                hostname: '**.co',
            },
            {
                protocol: 'https',
                hostname: '**.me',
            },
            {
                protocol: 'https',
                hostname: '**.info',
            },
            {
                protocol: 'https',
                hostname: '**.biz',
            },
            {
                protocol: 'https',
                hostname: '**.edu',
            },
            {
                protocol: 'https',
                hostname: '**.gov',
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
