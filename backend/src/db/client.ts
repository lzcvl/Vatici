/**
 * Neon PostgreSQL Client
 *
 * - sql (neon HTTP driver): fast, serverless-compatible, for simple queries
 * - pool (pg native): TCP connection pool, supports real transactions with
 *   BEGIN/COMMIT/ROLLBACK — required for atomic multi-step operations.
 *   Uses unpooled connection URL to bypass PgBouncer (which doesn't support
 *   multi-statement transactions in transaction mode).
 */

import { neon, type NeonQueryFunction } from '@neondatabase/serverless'
import { Pool } from 'pg'

if (!process.env.DATABASE_URL_UNPOOLED && !process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL_UNPOOLED or DATABASE_URL must be set in .env')
}

const connectionUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL!

/**
 * HTTP-based SQL client for simple (non-transactional) queries.
 */
export const sql: NeonQueryFunction<false, false> = neon(connectionUrl)

/**
 * TCP connection pool (pg native) for transactional operations.
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
