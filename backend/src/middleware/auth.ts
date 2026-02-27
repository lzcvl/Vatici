/**
 * Authentication Middleware
 *
 * Verifies the Authorization: Bearer <token> header.
 * The token is a HS256 JWT signed with AUTH_SECRET,
 * created by the NextAuth JWT callback in the frontend.
 */

import { jwtVerify } from 'jose'
import { HTTPException } from 'hono/http-exception'
import type { Context } from 'hono'

const getSecret = () => {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET environment variable is not set')
  return new TextEncoder().encode(secret)
}

/**
 * Verify the Bearer token and return the userId (payload.sub).
 * Throws HTTPException(401) if the token is missing, invalid, or expired —
 * which causes Hono to immediately return a 401 response and stop route execution.
 */
export async function verifyAuth(c: Context): Promise<string> {
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Unauthorized' })
  }

  const token = authHeader.slice(7)

  try {
    const { payload } = await jwtVerify(token, getSecret())
    const userId = payload.sub

    if (!userId) {
      throw new HTTPException(401, { message: 'Invalid token: missing sub' })
    }

    return userId
  } catch (err) {
    if (err instanceof HTTPException) throw err
    throw new HTTPException(401, { message: 'Invalid or expired token' })
  }
}
