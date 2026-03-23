// PATH: src/lib/db.ts
//
// Neon free tier pauses after ~5 min of inactivity — the first request
// after a pause throws "Can't reach database server". This helper retries
// once after a short wait, giving Neon time to wake up.
//
// Usage:
//   import { withDb } from '@/lib/db'
//   const [users, courses] = await withDb(() => Promise.all([...]))

export async function withDb<T>(fn: () => Promise<T>, retries = 1, waitMs = 3000): Promise<T> {
  try {
    return await fn()
  } catch (err: unknown) {
    const isConnectionError =
      err instanceof Error &&
      (err.message.includes("Can't reach database") ||
       err.message.includes('connect ECONNREFUSED') ||
       err.message.includes('Connection terminated') ||
       err.message.includes('pool timeout') ||
       err.message.includes('Server has closed the connection'))

    if (isConnectionError && retries > 0) {
      console.warn(`[db] Connection failed, retrying in ${waitMs}ms...`)
      await new Promise(r => setTimeout(r, waitMs))
      return withDb(fn, retries - 1, waitMs)
    }

    throw err
  }
}