/**
 * Market Database Queries
 */

import { sql } from './client'
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
  initialPoolYes?: number // in cents, default 100000
  initialPoolNo?: number
  answers?: string[] // for multi-choice
}): Promise<string> {
  try {
    const poolYes = data.initialPoolYes ?? 100000
    const poolNo = data.initialPoolNo ?? 100000

    const creatorId = data.creatorId === 'todo-auth' ? null : data.creatorId

    const rows = (await sql`
      INSERT INTO markets (
        creator_id, question, description, category,
        market_type, pool_yes, pool_no, closes_at
      )
      VALUES (
        ${creatorId}, ${data.question}, ${data.description},
        ${data.category}, ${data.marketType}, ${poolYes}, ${poolNo},
        ${data.closesAt}
      )
      RETURNING id
    `) as { id: string }[]

    const marketId = rows[0]?.id
    if (!marketId) throw new Error('Failed to create market')

    // If multi-choice, create answer rows
    if (data.marketType === 'multi' && data.answers?.length) {
      for (let i = 0; i < data.answers.length; i++) {
        await sql`
          INSERT INTO answers (market_id, text, index, pool_yes, pool_no)
          VALUES (${marketId}, ${data.answers[i]}, ${i}, 100000, 100000)
        `
      }
    }

    return marketId
  } catch (err) {
    console.error('createMarket error:', err)
    throw err
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
