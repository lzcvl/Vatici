/**
 * User Queries for Frontend Authentication
 *
 * Replaces mock-users.ts. This is the ONLY place the frontend accesses the database.
 * All other data comes from the backend API.
 */

import { sql } from './client'

export interface DbUser {
  id: string
  name: string
  email: string
  password_hash: string
}

/**
 * Find user by email - called by NextAuth
 */
export async function findUserByEmail(email: string): Promise<DbUser | null> {
  try {
    const rows = await sql<DbUser[]>`
      SELECT id, name, email, password_hash
      FROM users
      WHERE LOWER(email) = LOWER(${email})
      AND deleted_at IS NULL
      LIMIT 1
    `
    return rows[0] || null
  } catch (err) {
    console.error('[Auth] findUserByEmail error:', err)
    throw err
  }
}

/**
 * Create new user - called by signup action
 */
export async function createUser(data: {
  name: string
  email: string
  passwordHash: string
}): Promise<DbUser> {
  try {
    // Insert user
    const userRows = await sql<DbUser[]>`
      INSERT INTO users (name, email, password_hash)
      VALUES (${data.name}, LOWER(${data.email}), ${data.passwordHash})
      RETURNING id, name, email, password_hash
    `

    const user = userRows[0]
    if (!user) throw new Error('Failed to create user')

    // Create initial balance entry (1M cents = R$10,000)
    await sql`
      INSERT INTO user_balances (user_id, balance)
      VALUES (${user.id}, 1000000)
      ON CONFLICT (user_id) DO NOTHING
    `

    return user
  } catch (err) {
    console.error('[Auth] createUser error:', err)
    throw err
  }
}
