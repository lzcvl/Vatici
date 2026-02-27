/**
 * Bets Routes
 * POST /bets - Place a new bet
 * GET /bets/:marketId - Get bets for a market
 */

import { Hono } from 'hono'
import { z } from 'zod'
import { placeBet, getMarketBets, BetError } from '../db/bets'
import type { ErrorResponse } from '../mappers'
import { verifyAuth } from '../middleware/auth'

const app = new Hono()

/**
 * POST /bets
 * Place a new bet
 *
 * Body:
 * {
 *   marketId: string
 *   answerId?: string (for multi-choice)
 *   direction: 'YES' | 'NO'
 *   amount: number (in cents)
 * }
 */
app.post('/', async (c) => {
  try {
    const userId = await verifyAuth(c)

    const body = await c.req.json<{
      marketId?: string
      answerId?: string
      direction?: 'YES' | 'NO'
      amount?: number
    }>()

    // Validation
    if (!body.marketId || !body.direction || !body.amount) {
      return c.json(
        { error: 'Missing required fields: marketId, direction, amount' } as ErrorResponse,
        400
      )
    }

    if (!['YES', 'NO'].includes(body.direction)) {
      return c.json({ error: 'Invalid direction. Must be YES or NO' } as ErrorResponse, 400)
    }

    if (body.amount <= 0) {
      return c.json({ error: 'Amount must be greater than 0' } as ErrorResponse, 400)
    }

    // Place bet (atomic transaction)
    const betId = await placeBet({
      userId,
      marketId: body.marketId,
      answerId: body.answerId,
      direction: body.direction,
      amount: Math.round(body.amount), // Ensure integer cents
    })

    return c.json({ id: betId }, 201)
  } catch (err) {
    console.error('POST /bets error:', err)

    if (err instanceof BetError) {
      return c.json({ error: err.message } as ErrorResponse, err.statusCode as 422)
    }

    return c.json({ error: 'Failed to place bet' } as ErrorResponse, 500)
  }
})

/**
 * GET /bets/:marketId
 * Get all bets for a market
 */
app.get('/:marketId', async (c) => {
  try {
    const marketId = c.req.param('marketId')
    const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100)

    const bets = await getMarketBets(marketId, limit)
    return c.json(bets)
  } catch (err) {
    console.error('GET /bets/:marketId error:', err)
    return c.json({ error: 'Failed to fetch bets' } as ErrorResponse, 500)
  }
})

export default app
