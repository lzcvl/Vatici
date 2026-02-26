/**
 * User Database Queries
 *
 * Replaces mock-users.ts for real database access.
 */

import { sql } from './client'

export interface DbUser {
  id: string
  name: string
  email: string
  password_hash: string
}

/**
 * Find user by email
 * Used by NextAuth credentials provider and backend auth checks
 */
export async function findUserByEmail(email: string): Promise<DbUser | null> {
  try {
    const rows = (await sql`
      SELECT id, name, email, password_hash
      FROM users
      WHERE LOWER(email) = LOWER(${email})
      AND deleted_at IS NULL
      LIMIT 1
    `) as DbUser[]
    return rows[0] || null
  } catch (err) {
    console.error('findUserByEmail error:', err)
    throw err
  }
}

/**
 * Create new user with email verification
 * Also creates the user_balances record (default balance: 1,000,000 cents = R$10,000)
 */
export async function createUser(data: {
  name: string
  email: string
  passwordHash: string
}): Promise<DbUser> {
  try {
    // Insert user
    const userRows = (await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${data.name}, LOWER(${data.email}), ${data.passwordHash})
      RETURNING id, name, email, password_hash
    `) as DbUser[]

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
    console.error('createUser error:', err)
    throw err
  }
}

/**
 * Find user by ID (for session reconstruction)
 */
export async function findUserById(id: string): Promise<DbUser | null> {
  try {
    const rows = (await sql`
      SELECT id, name, email, password_hash
      FROM users
      WHERE id = ${id}
      AND deleted_at IS NULL
      LIMIT 1
    `) as DbUser[]
    return rows[0] || null
  } catch (err) {
    console.error('findUserById error:', err)
    throw err
  }
}

/**
 * Get user balance
 */
export async function getUserBalance(userId: string): Promise<number> {
  try {
    const rows = (await sql`
      SELECT balance
      FROM user_balances
      WHERE user_id = ${userId}
      LIMIT 1
    `) as { balance: number }[]
    return rows[0]?.balance ?? 0
  } catch (err) {
    console.error('getUserBalance error:', err)
    throw err
  }
}
