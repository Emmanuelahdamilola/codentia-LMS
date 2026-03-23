// PATH: src/lib/utils.ts

// ─── Class name merging (no clsx dependency) ─────────────────
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ')
}

// ─── String utilities ─────────────────────────────────────────

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '…'
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function enumToLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}

// ─── Number utilities ─────────────────────────────────────────

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function toPercent(value: number, total: number): string {
  if (total === 0) return '0%'
  return `${Math.round((value / total) * 100)}%`
}

// ─── Date utilities ───────────────────────────────────────────

export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  const intervals: [number, string][] = [
    [31536000, 'year'],
    [2592000,  'month'],
    [604800,   'week'],
    [86400,    'day'],
    [3600,     'hour'],
    [60,       'minute'],
  ]
  for (const [secs, label] of intervals) {
    const count = Math.floor(seconds / secs)
    if (count >= 1) return `${count} ${label}${count !== 1 ? 's' : ''} ago`
  }
  return 'just now'
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short', month: 'long', day: 'numeric', year: 'numeric',
  })
}

export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  })
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString()
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

export function minutesUntil(date: Date): number {
  return Math.round((date.getTime() - Date.now()) / 60000)
}

// ─── Array utilities ──────────────────────────────────────────

export function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = key(item)
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {} as Record<string, T[]>)
}

export function sortBy<T>(arr: T[], key: keyof T, dir: 'asc' | 'desc' = 'asc'): T[] {
  return [...arr].sort((a, b) => {
    const av = a[key], bv = b[key]
    if (av < bv) return dir === 'asc' ? -1 : 1
    if (av > bv) return dir === 'asc' ? 1 : -1
    return 0
  })
}

// ─── API response helper ──────────────────────────────────────

export function apiError(message: string, status = 400): Response {
  return Response.json({ error: message }, { status })
}