/**
 * Admin Routes — require Authorization: Bearer ADMIN_SECRET
 *
 * GET  /admin/markets?status=disputed   — list markets needing manual resolution
 * POST /admin/markets/:id/resolve       — manually set result and finalize payouts
 */

import { Hono } from 'hono'
import { adminResolveMarket } from '../db/resolutions'
import { listMarkets } from '../db/markets'
import { getAdminStats, getAdminUsers, toggleUserBan, adhocTransaction } from '../db/admin'
import { mapMarket, type ErrorResponse } from '../mappers'

const app = new Hono()

// ── Admin secret middleware ───────────────────────────────────
app.use('*', async (c, next) => {
  const secret = process.env.ADMIN_SECRET
  if (!secret) {
    return c.json({ error: 'Admin endpoint not configured' } as ErrorResponse, 503)
  }
  const auth = c.req.header('Authorization')
  if (auth !== `Bearer ${secret}`) {
    return c.json({ error: 'Unauthorized' } as ErrorResponse, 401)
  }
  await next()
})

/**
 * GET /admin/markets
 * Returns markets with a given status (default: disputed).
 * Also supports ai_uncertain to show markets where AI couldn't agree.
 */
app.get('/markets', async (c) => {
  try {
    const { status = 'disputed' } = c.req.query()
    const markets = await listMarkets({ status, limit: 100 })
    return c.json(markets.map(({ market, answers }) => mapMarket(market, answers)))
  } catch (err) {
    console.error('GET /admin/markets error:', err)
    return c.json({ error: 'Failed to fetch markets' } as ErrorResponse, 500)
  }
})

/**
 * POST /admin/markets/:id/resolve
 * Body: { result: "YES" | "NO" | <answer-uuid> }
 * Overrides any existing AI result and triggers payout distribution.
 */
app.post('/markets/:id/resolve', async (c) => {
  try {
    const marketId = c.req.param('id')
    const body = await c.req.json<{ result?: string }>()

    if (!body.result || !body.result.trim()) {
      return c.json({ error: 'result is required' } as ErrorResponse, 400)
    }

    await adminResolveMarket(marketId, body.result.trim())
    return c.json({ success: true })
  } catch (err) {
    console.error('POST /admin/markets/:id/resolve error:', err)
    const msg = err instanceof Error ? err.message : 'Failed to resolve market'
    return c.json({ error: msg } as ErrorResponse, 500)
  }
})

/**
 * GET /admin/stats
 * Dashboard overview metrics.
 */
app.get('/stats', async (c) => {
  try {
    const stats = await getAdminStats()
    return c.json(stats)
  } catch (err) {
    console.error('GET /admin/stats error:', err)
    return c.json({ error: 'Failed to fetch stats' } as ErrorResponse, 500)
  }
})

/**
 * GET /admin/users
 * Searchable, paginated user list with balance and ban status.
 */
app.get('/users', async (c) => {
  try {
    const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100)
    const offset = parseInt(c.req.query('offset') || '0')
    const search = c.req.query('search') || ''

    const users = await getAdminUsers(limit, offset, search)
    return c.json(users)
  } catch (err) {
    console.error('GET /admin/users error:', err)
    return c.json({ error: 'Failed to fetch users' } as ErrorResponse, 500)
  }
})

/**
 * POST /admin/users/:id/ban
 * Toggle user ban status.
 */
app.post('/users/:id/ban', async (c) => {
  try {
    const userId = c.req.param('id')
    const isBanned = await toggleUserBan(userId)
    return c.json({ success: true, isBanned })
  } catch (err) {
    console.error('POST /admin/users/:id/ban error:', err)
    return c.json({ error: 'Failed to ban/unban user' } as ErrorResponse, 500)
  }
})

/**
 * POST /admin/users/:id/bonus
 * Send bonus (or fine logic) to user's balance manually.
 * Body: { amount: number, description: string } (amount in BRL, converted here to cents)
 */
app.post('/users/:id/bonus', async (c) => {
  try {
    const userId = c.req.param('id')
    const body = await c.req.json<{ amount?: number; description?: string }>()

    if (!body.amount || typeof body.amount !== 'number') {
      return c.json({ error: 'Valid amount is required' } as ErrorResponse, 400)
    }

    const desc = body.description || 'Manual Admin Transaction'
    // Convert from BRL to Cents
    const amountCents = Math.round(body.amount * 100)

    const newBalanceCents = await adhocTransaction(userId, amountCents, desc)
    return c.json({ success: true, newBalance: newBalanceCents / 100 })
  } catch (err) {
    console.error('POST /admin/users/:id/bonus error:', err)
    return c.json({ error: 'Failed to process bonus' } as ErrorResponse, 500)
  }
})

export default app
