/**
 * Neon PostgreSQL Client
 *
 * Single instance for all database queries.
 * Uses unpooled connection for transactions (pgBouncer doesn't support
 * multi-statement transactions in transaction mode).
 */

import { neon, Pool, type NeonQueryFunction } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL_UNPOOLED && !process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL_UNPOOLED or DATABASE_URL must be set in .env')
}

const connectionUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL!

/**
 * Main SQL client for simple (non-transactional) queries.
 */
export const sql: NeonQueryFunction<false, false> = neon(connectionUrl)

/**
 * Connection pool for transactional operations.
 * Use pool.connect() + BEGIN/COMMIT/ROLLBACK for atomic multi-step operations.
 */
export const pool = new Pool({ connectionString: connectionUrl })

/**
 * Test the connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await sql`SELECT 1 as ok`
    return result[0]?.ok === 1
  } catch (err) {
    console.error('Database connection failed:', err)
    return false
  }
}

/**
 * Health check function
 */
export async function healthCheck(): Promise<{ status: 'ok' | 'error' }> {
  try {
    await sql`SELECT 1`
    return { status: 'ok' }
  } catch {
    return { status: 'error' }
  }
}
