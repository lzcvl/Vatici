/**
 * Password Reset Token Queries
 *
 * Uses the same Neon unpooled connection as auth queries.
 * Requires migration 005_password_reset_tokens.sql to be run on Neon.
 */

import { randomBytes } from "crypto"
import { sql } from "./client"

/**
 * Create a new password reset token for a user.
 * Invalidates any existing token for the same user.
 * Token expires in 1 hour.
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1h

  // Invalidate previous tokens for this user
  await sql`
    DELETE FROM password_reset_tokens WHERE user_id = ${userId}
  `

  await sql`
    INSERT INTO password_reset_tokens (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expiresAt.toISOString()})
  `

  return token
}

/**
 * Find a valid (unexpired, unused) token.
 * Returns the associated userId, or null if not found.
 */
export async function findValidToken(
  token: string
): Promise<{ userId: string } | null> {
  const rows = await sql<Array<{ user_id: string }>>`
    SELECT user_id FROM password_reset_tokens
    WHERE token    = ${token}
      AND expires_at > NOW()
      AND used_at IS NULL
    LIMIT 1
  `
  if (!rows[0]) return null
  return { userId: rows[0].user_id }
}

/**
 * Mark a token as used so it cannot be replayed.
 */
export async function consumeToken(token: string): Promise<void> {
  await sql`
    UPDATE password_reset_tokens
    SET used_at = NOW()
    WHERE token = ${token}
  `
}
