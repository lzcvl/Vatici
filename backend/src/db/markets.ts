/**
 * Market Database Queries
 */

import { sql, pool } from './client'
import type { DbMarket, DbAnswer } from '../mappers'

/**
 * List all markets with optional filters
 * Returns markets with their answers (if multi-choice)
 */
export async function listMarkets(filters?: {
  category?: string
  status?: string
  limit?: number
  search?: string
}): Promise<Array<{ market: DbMarket; answers: DbAnswer[] }>> {
  try {
    const status = filters?.status ?? 'open'
    const limit = filters?.limit ?? 50
    const searchPattern = filters?.search ? `%${filters.search}%` : null

    const markets = (await sql`
      SELECT
        id, creator_id, question, description, category, market_type,
        pool_yes, pool_no, p, status, closes_at, resolved_at,
        resolution_result, total_volume, is_trending, icon_url, created_at
      FROM markets
      WHERE status = ${status}
      ${filters?.category ? sql`AND category = ${filters.category}` : sql``}
      ${searchPattern ? sql`AND (question ILIKE ${searchPattern} OR description ILIKE ${searchPattern})` : sql``}
      ORDER BY is_trending DESC, total_volume DESC
      LIMIT ${limit}
    `) as DbMarket[]

    if (markets.length === 0) return []

    // Fetch all answers for these markets (if any are multi-choice)
    const marketIds = markets.map((m) => m.id)
    const answers = (await sql`
      SELECT id, market_id, text, index, pool_yes, pool_no, volume, resolution
      FROM answers
      WHERE market_id = ANY(${marketIds}::uuid[])
      ORDER BY index ASC
    `) as DbAnswer[]

    return markets.map((m) => ({
      market: m,
      answers: answers.filter((a) => a.market_id === m.id),
    }))
  } catch (err) {
    console.error('listMarkets error:', err)
    throw err
  }
}

/**
 * Get a single market by ID
 * Returns the market with all its answers (if multi-choice)
 */
export async function getMarketById(
  id: string
): Promise<{ market: DbMarket; answers: DbAnswer[] } | null> {
  try {
    const markets = (await sql`
      SELECT
        id, creator_id, question, description, category, market_type,
        pool_yes, pool_no, p, status, closes_at, resolved_at,
        resolution_result, total_volume, is_trending, icon_url, created_at
      FROM markets
      WHERE id = ${id}
      LIMIT 1
    `) as DbMarket[]

    if (!markets[0]) return null

    const answers = (await sql`
      SELECT id, market_id, text, index, pool_yes, pool_no, volume, resolution
      FROM answers
      WHERE market_id = ${id}
      ORDER BY index ASC
    `) as DbAnswer[]

    return { market: markets[0], answers }
  } catch (err) {
    console.error('getMarketById error:', err)
    throw err
  }
}

/**
 * Create a new market
 * For binary markets: just create the market
 * For multi-choice markets: create the market + answers rows
 */
export async function createMarket(data: {
  creatorId: string
  question: string
  description: string
  category: string
  marketType: 'binary' | 'multi'
  closesAt: string
  ante?: number // Default to 10000 cents (R$ 100.00)
  initialProb?: number // Default to 50%
  answers?: string[] // for multi-choice
}): Promise<string> {
  const ante = data.ante ?? 10000
  const initialProb = data.initialProb ?? 50
  const p = initialProb / 100

  // For initial CPMM, we inject ante into both sides to maintain k
  const poolYes = ante
  const poolNo = ante

  const creatorId = data.creatorId === 'todo-auth' ? null : data.creatorId

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // 1. Deduct Ante from user balance if a real user is creating
    if (creatorId) {
      const balanceResult = await client.query<{ balance: string }>(
        'SELECT balance FROM user_balances WHERE user_id = $1 FOR UPDATE',
        [creatorId]
      )
      // Some simple drivers return bigint as string
      const userBalance = parseInt(balanceResult.rows[0]?.balance ?? '0', 10)

      if (userBalance < ante) {
        throw new Error('INSUFFICIENT_BALANCE: Saldo insuficiente para prover a liquidez inicial do mercado.')
      }

      await client.query(
        'UPDATE user_balances SET balance = balance - $1 WHERE user_id = $2',
        [ante, creatorId]
      )

      await client.query(
        `INSERT INTO transactions (user_id, type, amount, description, created_at, balance_after)
         VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [
          creatorId,
          'ante',
          -ante,
          'Liquidez inicial (Ante) para criação do mercado',
          userBalance - ante
        ]
      )
    }

    // 2. Insert into markets
    const res = await client.query<{ id: string }>(
      `INSERT INTO markets (
        creator_id, question, description, category,
        market_type, pool_yes, pool_no, p, closes_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [
        creatorId, data.question, data.description,
        data.category, data.marketType, poolYes, poolNo, p, data.closesAt
      ]
    )

    const marketId = res.rows[0]?.id
    if (!marketId) throw new Error('Failed to create market')

    // 3. Insert Answers (if multi-choice)
    if (data.marketType === 'multi' && data.answers?.length) {
      const n = data.answers.length
      const multiPoolYes = Math.round(ante / n)
      const multiPoolNo = Math.round(ante / n)

      for (let i = 0; i < data.answers.length; i++) {
        await client.query(
          `INSERT INTO answers (market_id, text, index, pool_yes, pool_no)
           VALUES ($1, $2, $3, $4, $5)`,
          [marketId, data.answers[i], i, multiPoolYes, multiPoolNo]
        )
      }
    }

    await client.query('COMMIT')
    return marketId
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('createMarket error:', err)
    throw err
  } finally {
    client.release()
  }
}

/**
 * Get market for betting (with lock for transaction)
 * Used internally in bet placement transaction
 */
export async function getMarketForBetting(
  id: string
): Promise<{ pool_yes: number; pool_no: number; p: number; status: string } | null> {
  try {
    const rows = (await sql`
      SELECT pool_yes, pool_no, p, status
      FROM markets
      WHERE id = ${id}
      FOR UPDATE
    `) as { pool_yes: number; pool_no: number; p: string | number; status: string }[]

    if (!rows[0]) return null

    return {
      ...rows[0],
      p: typeof rows[0].p === 'string' ? parseFloat(rows[0].p) : rows[0].p,
    }
  } catch (err) {
    console.error('getMarketForBetting error:', err)
    throw err
  }
}

/**
 * Lazily update is_trending for open markets based on bet volume in the last 24h.
 * Top 5 markets by recent volume → trending = true, all others → false.
 */
export async function updateTrending(): Promise<void> {
  try {
    await sql`
      WITH recent_volume AS (
        SELECT market_id, SUM(amount) AS vol
        FROM bets
        WHERE created_at > NOW() - INTERVAL '24 hours'
        GROUP BY market_id
        ORDER BY vol DESC
        LIMIT 5
      )
      UPDATE markets
      SET is_trending = (id IN (SELECT market_id FROM recent_volume))
      WHERE status = 'open'
    `
  } catch (err) {
    console.error('updateTrending error:', err)
  }
}

/**
 * Update market pool and volume (used in bet transaction)
 */
export async function updateMarketPool(data: {
  marketId: string
  poolYes: number
  poolNo: number
  volumeDelta: number
}): Promise<void> {
  try {
    await sql`
      UPDATE markets
      SET
        pool_yes = ${data.poolYes},
        pool_no = ${data.poolNo},
        total_volume = total_volume + ${data.volumeDelta},
        updated_at = NOW()
      WHERE id = ${data.marketId}
    `
  } catch (err) {
    console.error('updateMarketPool error:', err)
    throw err
  }
}
