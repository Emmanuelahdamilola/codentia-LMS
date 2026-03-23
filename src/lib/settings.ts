// PATH: src/lib/settings.ts
// Fetches platform settings with a 60s in-memory cache to avoid a DB hit on every request.
import { prisma } from '@/lib/prisma'

interface PlatformSettings {
  id:                   string
  platformName:         string
  supportEmail:         string
  timezone:             string
  logoUrl:              string | null
  aiCodingAssistant:    boolean
  aiAssignmentFeedback: boolean
  aiQuizGenerator:      boolean
  aiAtRiskDetection:    boolean
  pointsSystem:         boolean
  badges:               boolean
  leaderboard:          boolean
  emailLiveReminders:   boolean
  emailDeadlines:       boolean
  emailAiRecommend:     boolean
  emailReEngagement:    boolean
  emailNewCourse:       boolean
}

const DEFAULT: PlatformSettings = {
  id:                   'global',
  platformName:         'Codentia',
  supportEmail:         'hello@codentia.dev',
  timezone:             'Africa/Lagos',
  logoUrl:              null,
  aiCodingAssistant:    true,
  aiAssignmentFeedback: true,
  aiQuizGenerator:      true,
  aiAtRiskDetection:    true,
  pointsSystem:         true,
  badges:               true,
  leaderboard:          true,
  emailLiveReminders:   true,
  emailDeadlines:       true,
  emailAiRecommend:     true,
  emailReEngagement:    true,
  emailNewCourse:       true,
}

let cache: PlatformSettings | null = null
let cacheAt = 0
const TTL   = 60_000 // 60 seconds

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const now = Date.now()
  if (cache && now - cacheAt < TTL) return cache

  try {
    const p = prisma as any
    let row = await p.platformSettings.findUnique({ where: { id: 'global' } })
    if (!row) {
      row = await p.platformSettings.create({ data: { id: 'global' } })
    }
    cache  = row as PlatformSettings
    cacheAt = now
    return cache
  } catch {
    // If PlatformSettings table doesn't exist yet (before migration), return defaults
    return DEFAULT
  }
}

// Invalidate cache (call after PATCH)
export function invalidateSettingsCache() {
  cache   = null
  cacheAt = 0
}