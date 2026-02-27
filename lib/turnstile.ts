/**
 * Cloudflare Turnstile server-side verification
 *
 * Env vars required (set in Vercel):
 *   TURNSTILE_SECRET_KEY   — server-side secret from Cloudflare dashboard
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY — public site key (embedded in frontend)
 *
 * When TURNSTILE_SECRET_KEY is not set (local dev), verification is skipped.
 */

export async function verifyTurnstile(token: string | null | undefined): Promise<boolean> {
  // Skip in development / when not configured
  if (!process.env.TURNSTILE_SECRET_KEY) return true
  if (!token?.trim()) return false

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
    })
    const data = (await res.json()) as { success: boolean }
    return data.success === true
  } catch {
    // Network error — fail open in dev, fail closed in prod
    return process.env.NODE_ENV !== 'production'
  }
}
