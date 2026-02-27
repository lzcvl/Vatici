/**
 * Authentication Middleware
 *
 * Verifies the Authorization: Bearer <token> header.
 * The token is a HS256 JWT signed with AUTH_SECRET,
 * created by the NextAuth JWT callback in the frontend.
 */

import { jwtVerify } from 'jose'
import type { Context } from 'hono'

const getSecret = () =>
  new TextEncoder().encode(
    process.env.AUTH_SECRET ?? 'vatici-dev-secret-change-in-production'
  )

/**
 * Verify the Bearer token and return the userId (payload.sub)
 * @throws 401 HTTPException if token is missing or invalid
 */
export async function verifyAuth(c: Context): Promise<string> {
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401) as never
  }

  const token = authHeader.slice(7)

  try {
    const { payload } = await jwtVerify(token, getSecret())
    const userId = payload.sub

    if (!userId) {
      return c.json({ error: 'Invalid token: missing sub' }, 401) as never
    }

    return userId
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401) as never
  }
}
