/**
 * Admin Routes — require Authorization: Bearer ADMIN_SECRET
 *
 * GET  /admin/markets?status=disputed   — list markets needing manual resolution
 * POST /admin/markets/:id/resolve       — manually set result and finalize payouts
 */

import { Hono } from 'hono'
import { adminResolveMarket } from '../db/resolutions'
import { listMarkets } from '../db/markets'
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

export default app
