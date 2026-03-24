/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'codentia.vercel.app'],
    },
  },
  async headers() {
    return [
      {
        // Never cache auth pages — prevents Vercel CDN redirect loops
        source: '/(login|register|verify-email)',
        headers: [
          {
            key:   'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig