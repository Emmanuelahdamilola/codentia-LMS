// PATH: next.config.ts
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },

  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
      bodySizeLimit:  '10mb',   // allows video/file uploads via server actions
    },
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key:   'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key:   'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key:   'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      // Allow iframe embeds from video providers on lesson pages
      {
        source:  '/courses/:courseId/learn/:lessonId',
        headers: [
          {
            key:   'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "media-src 'self' https: blob:",
              // Allow YouTube, Vimeo, Loom, and R2 self-hosted video
              "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.loom.com https://js.stripe.com",
              "connect-src 'self' https://api.groq.com https://api.stripe.com https://api.resend.com",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig