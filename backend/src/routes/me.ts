/**
 * User Profile Routes
 * GET /me/balance   - User's current balance
 * GET /me/positions - User's market positions
 * GET /me/activity  - User's recent activity
 * GET /me/profile   - User's profile info (name, email, createdAt)
 */

import { Hono } from 'hono'
import { sql } from '../db/client'
import { mapBalance } from '../mappers'
import type { ErrorResponse } from '../mappers'
import { verifyAuth } from '../middleware/auth'

const app = new Hono()

/**
 * GET /me/balance
 * Get user's current balance in BRL
 */
app.get('/balance', async (c) => {
  try {
    const userId = await verifyAuth(c)

    const rows = (await sql`
      SELECT balance FROM user_balances
      WHERE user_id = ${userId}
      LIMIT 1
    `) as { balance: number }[]

    const balance = rows[0]?.balance ?? 0
    return c.json(mapBalance(balance))
  } catch (err) {
    console.error('GET /me/balance error:', err)
    return c.json({ error: 'Failed to fetch balance' } as ErrorResponse, 500)
  }
})

/**
 * GET /me/profile
 * Get user's profile information
 */
app.get('/profile', async (c) => {
  try {
    const userId = await verifyAuth(c)

    const rows = (await sql`
      SELECT id, name, email, created_at
      FROM users
      WHERE id = ${userId}
      LIMIT 1
    `) as { id: string; name: string; email: string; created_at: string }[]

    if (!rows[0]) {
      return c.json({ error: 'User not found' } as ErrorResponse, 404)
    }

    return c.json({
      id: rows[0].id,
      name: rows[0].name,
      email: rows[0].email,
      createdAt: rows[0].created_at,
    })
  } catch (err) {
    console.error('GET /me/profile error:', err)
    return c.json({ error: 'Failed to fetch profile' } as ErrorResponse, 500)
  }
})

/**
 * GET /me/positions
 * Get user's current positions (betting positions across markets)
 */
app.get('/positions', async (c) => {
  try {
    const userId = await verifyAuth(c)
    const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100)

    // Get positions with market data
    const positions = (await sql`
      SELECT
        up.user_id,
        up.market_id,
        up.answer_id,
        up.outcome,
        up.shares,
        up.invested_amount,
        m.question,
        m.market_type,
        m.pool_yes,
        m.pool_no,
        m.total_volume,
        m.is_trending,
        m.icon_url,
        m.created_at
      FROM user_positions up
      LEFT JOIN markets m ON up.market_id = m.id
      WHERE up.user_id = ${userId}
      ORDER BY up.updated_at DESC
      LIMIT ${limit}
    `) as Array<{
      user_id: string
      market_id: string
      answer_id: string | null
      outcome: string
      shares: number
      invested_amount: number
      question: string
      market_type: string
      pool_yes: number
      pool_no: number
      total_volume: number
      is_trending: boolean
      icon_url: string | null
      created_at: string
    }>

    // Transform to frontend format
    const result = positions.map((p) => ({
      marketId: p.market_id,
      direction: p.outcome,
      shares: p.shares / 100, // Convert from cents-equivalent
      investedAmount: p.invested_amount / 100, // BRL
      market: {
        id: p.market_id,
        question: { pt: p.question, en: p.question, es: p.question },
        type: p.market_type,
        probability: p.pool_no / (p.pool_yes + p.pool_no),
        volume: p.total_volume / 100,
        yesPool: p.pool_yes / 100,
        noPool: p.pool_no / 100,
        trending: p.is_trending,
        iconUrl: p.icon_url,
        createdAt: p.created_at,
      },
    }))

    return c.json(result)
  } catch (err) {
    console.error('GET /me/positions error:', err)
    return c.json({ error: 'Failed to fetch positions' } as ErrorResponse, 500)
  }
})

/**
 * GET /me/activity
 * Get user's recent activity (bets placed)
 */
app.get('/activity', async (c) => {
  try {
    const userId = await verifyAuth(c)
    const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100)

    // Get recent bets with market info
    const activity = (await sql`
      SELECT
        b.id,
        b.market_id,
        b.outcome,
        b.amount,
        b.shares,
        b.created_at,
        m.question,
        m.market_type
      FROM bets b
      LEFT JOIN markets m ON b.market_id = m.id
      WHERE b.user_id = ${userId}
      ORDER BY b.created_at DESC
      LIMIT ${limit}
    `) as Array<{
      id: string
      market_id: string
      outcome: string
      amount: number
      shares: number
      created_at: string
      question: string
      market_type: string
    }>

    const result = activity.map((a) => ({
      id: a.id,
      type: 'bet' as const,
      marketId: a.market_id,
      direction: a.outcome,
      amount: a.amount / 100, // BRL
      shares: a.shares / 100,
      createdAt: a.created_at,
      market: {
        id: a.market_id,
        question: { pt: a.question, en: a.question, es: a.question },
        type: a.market_type,
      },
    }))

    return c.json(result)
  } catch (err) {
    console.error('GET /me/activity error:', err)
    return c.json({ error: 'Failed to fetch activity' } as ErrorResponse, 500)
  }
})

/**
 * GET /me/resolved-positions
 * Returns markets where the user received a resolution payout.
 */
app.get('/resolved-positions', async (c) => {
  try {
    const userId = await verifyAuth(c)
    const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100)

    const rows = (await sql`
      SELECT
        t.amount AS payout,
        t.created_at AS payout_at,
        m.id AS market_id,
        m.question,
        m.resolution_result,
        m.resolved_at,
        COALESCE(up.outcome, '') AS outcome
      FROM transactions t
      JOIN markets m ON t.market_id = m.id
      LEFT JOIN user_positions up
        ON up.user_id = t.user_id
        AND up.market_id = m.id
        AND up.answer_id IS NULL
      WHERE t.user_id = ${userId}
        AND t.type = 'resolution'
      ORDER BY t.created_at DESC
      LIMIT ${limit}
    `) as Array<{
      payout: number
      payout_at: string
      market_id: string
      question: string
      resolution_result: string | null
      resolved_at: string | null
      outcome: string
    }>

    return c.json(
      rows.map((r) => ({
        marketId: r.market_id,
        payout: r.payout / 100, // cents → BRL
        payoutAt: r.payout_at,
        resolution: r.resolution_result,
        resolvedAt: r.resolved_at,
        direction: r.outcome || null,
        market: {
          id: r.market_id,
          question: { pt: r.question, en: r.question, es: r.question },
        },
      }))
    )
  } catch (err) {
    console.error('GET /me/resolved-positions error:', err)
    return c.json({ error: 'Failed to fetch resolved positions' } as ErrorResponse, 500)
  }
})

export default app
