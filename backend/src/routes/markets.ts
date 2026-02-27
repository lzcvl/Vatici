/**
 * Markets Routes
 * GET /markets, POST /markets, GET /markets/:id
 */

import { Hono } from 'hono'
import { listMarkets, getMarketById, createMarket } from '../db/markets'
import { mapMarket, type ErrorResponse } from '../mappers'
import { verifyAuth } from '../middleware/auth'
import { resolveWithAi } from '../lib/ai-resolver'
import { proposeAiResolution, checkAndAutoResolve } from '../db/resolutions'
import { sql } from '../db/client'

const app = new Hono()

/**
 * GET /markets
 * List all markets with optional filters
 */
app.get('/', async (c) => {
  try {
    const { category, status = 'open', limit = '50' } = c.req.query()

    const markets = await listMarkets({
      category: category || undefined,
      status,
      limit: Math.min(parseInt(limit), 100), // max 100
    })

    const result = markets.map(({ market, answers }) => mapMarket(market, answers))
    return c.json(result)
  } catch (err) {
    console.error('GET /markets error:', err)
    const error: ErrorResponse = { error: 'Failed to fetch markets' }
    return c.json(error, 500)
  }
})

/**
 * GET /markets/:id
 * Get a single market with its answers (if multi-choice).
 * Also performs lazy auto-close, lazy AI resolution trigger, and lazy auto-finalization.
 */
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')

    // Auto-close: if market.closes_at has passed but status is still 'open', update to 'closed'
    await sql`
      UPDATE markets
      SET status = 'closed'
      WHERE id = ${id}
        AND status = 'open'
        AND closes_at <= NOW()
    `

    const result = await getMarketById(id)
    if (!result) {
      return c.json({ error: 'Market not found' } as ErrorResponse, 404)
    }

    // Trigger AI resolution non-blocking when market has been closed for > 1 hour
    if (result.market.status === 'closed') {
      const closedAt = new Date(result.market.closes_at)
      const hoursSinceClosed = (Date.now() - closedAt.getTime()) / 3_600_000
      if (hoursSinceClosed > 1) {
        triggerAiResolution(id).catch((err) =>
          console.error(`AI resolution trigger failed for market ${id}:`, err)
        )
      }
    }

    // Lazy auto-finalization for pending_resolution markets
    if (result.market.status === 'pending_resolution') {
      await checkAndAutoResolve(id)
      // Re-fetch after potential finalization
      const updated = await getMarketById(id)
      if (updated) return c.json(mapMarket(updated.market, updated.answers))
    }

    return c.json(mapMarket(result.market, result.answers))
  } catch (err) {
    console.error(`GET /markets/:id error:`, err)
    return c.json({ error: 'Failed to fetch market' } as ErrorResponse, 500)
  }
})

/**
 * Fire-and-forget AI resolution.
 * Sets status to 'ai_resolving' first to prevent duplicate concurrent triggers.
 */
async function triggerAiResolution(marketId: string): Promise<void> {
  // Atomically claim the 'closed' → 'ai_resolving' transition
  const result = await sql`
    UPDATE markets SET status = 'ai_resolving'
    WHERE id = ${marketId} AND status = 'closed'
    RETURNING id
  ` as { id: string }[]

  if (!result[0]) return // Another request already claimed it

  try {
    const consensus = await resolveWithAi(marketId)
    await proposeAiResolution(marketId, consensus)
  } catch (err) {
    // Revert to 'closed' if AI fails so it can be retried
    await sql`UPDATE markets SET status = 'closed' WHERE id = ${marketId} AND status = 'ai_resolving'`
    throw err
  }
}

/**
 * POST /markets
 * Create a new market (auth required)
 *
 * Body:
 * {
 *   question: string
 *   description: string
 *   category: string
 *   marketType: 'binary' | 'multi'
 *   closesAt: string (ISO date)
 *   answers?: string[] (for multi-choice)
 * }
 */
app.post('/', async (c) => {
  try {
    const userId = await verifyAuth(c)

    const body = await c.req.json<{
      question?: string
      description?: string
      category?: string
      marketType?: 'binary' | 'multi'
      closesAt?: string
      answers?: string[]
    }>()

    // Validation
    if (!body.question || !body.marketType || !body.closesAt) {
      return c.json(
        { error: 'Missing required fields: question, marketType, closesAt' } as ErrorResponse,
        400
      )
    }

    if (!['binary', 'multi'].includes(body.marketType)) {
      return c.json({ error: 'Invalid marketType' } as ErrorResponse, 400)
    }

    if (body.marketType === 'multi' && (!body.answers || body.answers.length < 2)) {
      return c.json({ error: 'Multi-choice markets require at least 2 answers' } as ErrorResponse, 400)
    }

    const marketId = await createMarket({
      creatorId: userId,
      question: body.question,
      description: body.description || '',
      category: body.category || 'general',
      marketType: body.marketType,
      closesAt: body.closesAt,
      answers: body.answers,
    })

    return c.json({ id: marketId }, 201)
  } catch (err) {
    console.error('POST /markets error:', err)
    return c.json({ error: 'Failed to create market' } as ErrorResponse, 500)
  }
})

export default app
