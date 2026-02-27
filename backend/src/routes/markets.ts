/**
 * Markets Routes
 * GET /markets, POST /markets, GET /markets/:id
 */

import { Hono } from 'hono'
import { listMarkets, getMarketById, createMarket } from '../db/markets'
import { mapMarket, type ErrorResponse } from '../mappers'
import { verifyAuth } from '../middleware/auth'

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
 * Get a single market with its answers (if multi-choice)
 */
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')

    const result = await getMarketById(id)
    if (!result) {
      return c.json({ error: 'Market not found' } as ErrorResponse, 404)
    }

    return c.json(mapMarket(result.market, result.answers))
  } catch (err) {
    console.error(`GET /markets/:id error:`, err)
    return c.json({ error: 'Failed to fetch market' } as ErrorResponse, 500)
  }
})

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
