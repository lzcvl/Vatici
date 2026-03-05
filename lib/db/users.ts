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
  is_banned?: boolean
}

/**
 * Find user by email - called by NextAuth
 */
export async function findUserByEmail(email: string): Promise<DbUser | null> {
  try {
    const rows = await sql`
      SELECT id, name, email, password_hash, is_banned
      FROM users
      WHERE LOWER(email) = LOWER(${email})
      AND deleted_at IS NULL
      LIMIT 1
    `
    return (rows[0] as DbUser) || null
  } catch (err) {
    console.error('[Auth] findUserByEmail error:', err)
    throw err
  }
}

/**
 * Update user IP - called on successful login
 */
export async function updateUserIp(userId: string, ip: string): Promise<void> {
  try {
    await sql`
      UPDATE users 
      SET last_ip = ${ip}, last_login_at = CURRENT_TIMESTAMP
      WHERE id = ${userId}
    `
  } catch (err) {
    console.error('[Auth] updateUserIp error:', err)
  }
}

/**
 * Create new user - called by signup action
 */
export async function createUser(data: {
  name: string
  email: string
  passwordHash: string
  registrationIp: string
}): Promise<DbUser> {
  try {
    // Insert user
    const userRows = await sql`
      INSERT INTO users (name, email, password_hash, registration_ip, last_ip)
      VALUES (${data.name}, LOWER(${data.email}), ${data.passwordHash}, ${data.registrationIp}, ${data.registrationIp})
      RETURNING id, name, email, password_hash
    `

    const user = userRows[0] as DbUser
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

/**
 * Update password hash — called after a successful password reset
 */
export async function updateUserPassword(
  userId: string,
  passwordHash: string
): Promise<void> {
  try {
    await sql`
      UPDATE users SET password_hash = ${passwordHash} WHERE id = ${userId}
    `
  } catch (err) {
    console.error('[Auth] updateUserPassword error:', err)
    throw err
  }
}
