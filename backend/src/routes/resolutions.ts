/**
 * Resolutions Routes
 *
 * GET  /resolutions/:marketId          — fetch resolution info (public)
 * POST /resolutions/:marketId/dispute  — cast a dispute vote (auth required)
 * POST /resolutions/:marketId/confirm  — cast a confirm vote (auth required)
 */

import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { verifyAuth } from '../middleware/auth'
import { voteOnResolution, getMarketResolution } from '../db/resolutions'
import { sql } from '../db/client'
import type { ErrorResponse } from '../mappers'

const app = new Hono()

/**
 * GET /resolutions/:marketId
 * Returns resolution details — AI verdicts, vote counts, resolves_at, final result.
 */
app.get('/:marketId', async (c) => {
  try {
    const { marketId } = c.req.param()
    const resolution = await getMarketResolution(marketId)
    if (!resolution) {
      return c.json({ error: 'No resolution found for this market' } as ErrorResponse, 404)
    }
    return c.json({
      result: resolution.result,
      explanation: resolution.explanation,
      resolvedBy: resolution.resolved_by,
      totalYesPayout: resolution.total_yes_payout / 100,
      totalNoPayout: resolution.total_no_payout / 100,
      aiGroqResult: resolution.ai_groq_result,
      aiGeminiResult: resolution.ai_gemini_result,
      aiGroqConfidence: resolution.ai_groq_confidence,
      aiGeminiConfidence: resolution.ai_gemini_confidence,
      aiGroqReasoning: resolution.ai_groq_reasoning,
      aiGeminiReasoning: resolution.ai_gemini_reasoning,
      confirmCount: resolution.confirm_count,
      disputeCount: resolution.dispute_count,
      resolvesAt: resolution.resolves_at,
      createdAt: resolution.created_at,
    })
  } catch (err) {
    console.error('GET /resolutions/:marketId error:', err)
    return c.json({ error: 'Failed to fetch resolution' } as ErrorResponse, 500)
  }
})

/**
 * POST /resolutions/:marketId/dispute
 * Cast or update to a dispute vote.
 */
app.post('/:marketId/dispute', async (c) => {
  try {
    const userId = await verifyAuth(c)
    const { marketId } = c.req.param()

    // Verify market is in pending_resolution
    const markets = (await sql`
      SELECT status FROM markets WHERE id = ${marketId} LIMIT 1
    `) as { status: string }[]
    const market = markets[0]
    if (!market) throw new HTTPException(404, { message: 'Market not found' })
    if (market.status !== 'pending_resolution') {
      throw new HTTPException(422, { message: 'Market is not pending resolution' })
    }

    const result = await voteOnResolution(marketId, userId, 'dispute')
    return c.json({ success: true, alreadyVoted: result.alreadyVoted, vote: result.newVote })
  } catch (err) {
    if (err instanceof HTTPException) throw err
    console.error('POST /resolutions/:marketId/dispute error:', err)
    return c.json({ error: 'Failed to cast vote' } as ErrorResponse, 500)
  }
})

/**
 * POST /resolutions/:marketId/confirm
 * Cast or update to a confirm vote.
 */
app.post('/:marketId/confirm', async (c) => {
  try {
    const userId = await verifyAuth(c)
    const { marketId } = c.req.param()

    const markets = (await sql`
      SELECT status FROM markets WHERE id = ${marketId} LIMIT 1
    `) as { status: string }[]
    const market = markets[0]
    if (!market) throw new HTTPException(404, { message: 'Market not found' })
    if (market.status !== 'pending_resolution') {
      throw new HTTPException(422, { message: 'Market is not pending resolution' })
    }

    const result = await voteOnResolution(marketId, userId, 'confirm')
    return c.json({ success: true, alreadyVoted: result.alreadyVoted, vote: result.newVote })
  } catch (err) {
    if (err instanceof HTTPException) throw err
    console.error('POST /resolutions/:marketId/confirm error:', err)
    return c.json({ error: 'Failed to cast vote' } as ErrorResponse, 500)
  }
})

export default app
