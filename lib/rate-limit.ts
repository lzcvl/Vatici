/**
 * In-memory rate limiter for Next.js server actions
 * Keyed by IP + action name — resets on process restart (fine for MVP)
 */

const store = new Map<string, { count: number; resetAt: number }>()

/**
 * Returns true if the request is within limits, false if it should be blocked.
 * @param key       Unique key — e.g. `login:1.2.3.4`
 * @param max       Max allowed requests in the window
 * @param windowMs  Window duration in milliseconds
 */
export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= max) return false
  entry.count++
  return true
}
