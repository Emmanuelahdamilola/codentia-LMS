// PATH: src/lib/prisma.ts
//
// Neon free tier databases pause after ~5 min of inactivity.
// The pooler URL + connect_timeout handles cold-start wakeups gracefully.
// Always use the *-pooler.* hostname in DATABASE_URL.

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        // Append connection params if not already in the URL
        url: (() => {
          const url = process.env.DATABASE_URL ?? ''
          if (!url) throw new Error('DATABASE_URL is not set')
          // Don't double-append params
          if (url.includes('connect_timeout')) return url
          const sep = url.includes('?') ? '&' : '?'
          return `${url}${sep}connect_timeout=15&pool_timeout=15&sslmode=require`
        })(),
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma