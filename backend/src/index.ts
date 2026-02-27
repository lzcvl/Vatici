/**
 * Vatici Backend API Server
 *
 * Hono + PostgreSQL (Neon)
 * Routes: /markets, /bets, /me
 */

import 'dotenv/config'
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { healthCheck } from './db/client'
import marketsRoute from './routes/markets'
import betsRoute from './routes/bets'
import meRoute from './routes/me'
import resolutionsRoute from './routes/resolutions'
import adminRoute from './routes/admin'
import commentsRoute from './routes/comments'

const app = new Hono()

/**
 * CORS middleware - allow Vercel frontend origins
 */
app.use('*', async (c, next) => {
  const origin = c.req.header('origin') ?? ''
  const allowed =
    origin.endsWith('.vercel.app') ||
    origin === 'http://localhost:3000' ||
    origin === 'http://localhost:3001'

  const allowOrigin = allowed ? origin : 'https://v0-vatici-three.vercel.app'

  c.header('Access-Control-Allow-Origin', allowOrigin)
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  c.header('Vary', 'Origin')

  if (c.req.method === 'OPTIONS') {
    return c.body(null, 204)
  }

  await next()
})

/**
 * Health check route
 */
app.get('/health', async (c) => {
  const health = await healthCheck()
  if (health.status === 'error') {
    return c.json({ status: 'error', message: 'Database connection failed' }, 503)
  }
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

/**
 * Root route
 */
app.get('/', (c) => {
  return c.json({
    name: 'Vatici API',
    version: '1.0.0',
    status: 'running',
  })
})

/**
 * Routes
 */
app.route('/markets', marketsRoute)
app.route('/bets', betsRoute)
app.route('/me', meRoute)
app.route('/resolutions', resolutionsRoute)
app.route('/admin', adminRoute)
app.route('/comments', commentsRoute)

/**
 * 404 handler
 */
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404)
})

/**
 * Error handler
 */
app.onError((err, c) => {
  console.error('Server error:', err)
  return c.json(
    {
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    },
    500
  )
})

/**
 * Start server
 */
const port = Number(process.env.PORT || 3001)

// Warn loudly if AUTH_SECRET is missing — protected routes will reject all requests
if (!process.env.AUTH_SECRET) {
  console.error('⚠️  WARNING: AUTH_SECRET is not set. All authenticated endpoints will return 401.')
}

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`🚀 Server running on http://localhost:${info.port}`)
    console.log(`📊 Database: ${process.env.DATABASE_URL_UNPOOLED ? 'unpooled' : 'pooled'}`)
    console.log(`🔐 Auth: ${process.env.AUTH_SECRET ? 'configured' : 'MISSING AUTH_SECRET'}`)
  }
)

export default app
