/**
 * Neon PostgreSQL Client for Frontend (Auth only)
 *
 * The frontend ONLY accesses the database for authentication.
 * All business logic queries go through the backend API.
 *
 * This uses the unpooled connection for auth reliability.
 */

import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL_UNPOOLED && !process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL_UNPOOLED or DATABASE_URL must be set')
}

const connectionUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL!

/**
 * Single instance for auth queries only
 */
export const sql = neon(connectionUrl)
