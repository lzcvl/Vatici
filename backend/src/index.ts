/**
 * Vatici Backend API Server
 *
 * Hono + PostgreSQL (Neon)
 * Routes: /markets, /bets, /me
 */

import 'dotenv/config'
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { healthCheck } from './db/client'
import marketsRoute from './routes/markets'

const app = new Hono()

/**
 * CORS middleware
 * Allow requests from frontend (Vercel URL)
 */
app.use(
  '*',
  cors({
    origin: process.env.FRONTEND_URL || '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
)

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

/**
 * Routes to be added:
 * - /bets (POST)
 * - /me/balance (GET)
 * - /me/positions (GET)
 * - /me/activity (GET)
 */

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

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`🚀 Server running on http://localhost:${info.port}`)
    console.log(`📊 Database: ${process.env.DATABASE_URL_UNPOOLED ? 'unpooled' : 'pooled'}`)
  }
)

export default app
