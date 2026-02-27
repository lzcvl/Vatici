/**
 * Resolution Database Queries
 *
 * Handles the full market resolution lifecycle:
 * 1. proposeAiResolution   — creates pending_resolution after AI consensus
 * 2. voteOnResolution      — community confirm/dispute votes
 * 3. checkAndAutoResolve   — lazy auto-finalization when window expires
 * 4. finalizeResolution    — atomic payout distribution
 * 5. getMarketResolution   — fetch resolution details
 */

import { pool, sql } from './client'
import type { AiConsensus } from '../lib/ai-resolver'

const DISPUTE_THRESHOLD = 5       // votes needed to block auto-resolve
const RESOLUTION_WINDOW_HOURS = 24 // hours before auto-finalization

export interface ResolutionRow {
  id: string
  market_id: string
  result: string | null
  explanation: string | null
  resolved_by: string | null
  total_yes_payout: number
  total_no_payout: number
  ai_groq_result: string | null
  ai_gemini_result: string | null
  ai_groq_confidence: number | null
  ai_gemini_confidence: number | null
  ai_groq_reasoning: string | null
  ai_gemini_reasoning: string | null
  confirm_count: number
  dispute_count: number
  resolves_at: string | null
  created_at: string
}

/**
 * Create a pending resolution from AI consensus.
 * Sets market.status = 'pending_resolution' and resolves_at = NOW() + 24h.
 * No-op if a resolution already exists for this market.
 */
export async function proposeAiResolution(
  marketId: string,
  consensus: AiConsensus
): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Lock market and check it's still 'closed' (prevent duplicate triggers)
    const marketRows = await client.query<{ status: string }>(
      "SELECT status FROM markets WHERE id = $1 FOR UPDATE",
      [marketId]
    )
    const market = marketRows.rows[0]
    if (!market || market.status !== 'closed') {
      await client.query('ROLLBACK')
      return
    }

    // Check no resolution exists yet
    const existing = await client.query(
      'SELECT id FROM market_resolutions WHERE market_id = $1',
      [marketId]
    )
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK')
      return
    }

    const agreedResult = consensus.agreed ? consensus.agreedResult : null
    const newStatus = consensus.agreed ? 'pending_resolution' : 'ai_uncertain'
    const resolvesAt = consensus.agreed
      ? new Date(Date.now() + RESOLUTION_WINDOW_HOURS * 3600 * 1000).toISOString()
      : null

    // Insert resolution record
    await client.query(
      `INSERT INTO market_resolutions (
        market_id, result,
        ai_groq_result, ai_gemini_result,
        ai_groq_confidence, ai_gemini_confidence,
        ai_groq_reasoning, ai_gemini_reasoning,
        confirm_count, dispute_count, resolves_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,0,0,$9)`,
      [
        marketId,
        agreedResult,
        consensus.groq.result,
        consensus.gemini.result,
        consensus.groq.confidence,
        consensus.gemini.confidence,
        consensus.groq.reasoning,
        consensus.gemini.reasoning,
        resolvesAt,
      ]
    )

    // Update market status
    await client.query(
      "UPDATE markets SET status = $1 WHERE id = $2",
      [newStatus, marketId]
    )

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('proposeAiResolution error:', err)
    throw err
  } finally {
    client.release()
  }
}

/**
 * Cast or update a community vote (confirm/dispute) on a pending resolution.
 * Each user gets one vote per market. Subsequent calls update the existing vote.
 */
export async function voteOnResolution(
  marketId: string,
  userId: string,
  vote: 'confirm' | 'dispute'
): Promise<{ alreadyVoted: boolean; newVote: string }> {
  // Check if user already voted
  const existing = (await sql`
    SELECT vote FROM resolution_votes
    WHERE user_id = ${userId} AND market_id = ${marketId}
  `) as { vote: string }[]

  const previousVote = existing[0]?.vote ?? null

  if (previousVote === vote) {
    return { alreadyVoted: true, newVote: vote }
  }

  // Upsert vote
  await sql`
    INSERT INTO resolution_votes (user_id, market_id, vote)
    VALUES (${userId}, ${marketId}, ${vote})
    ON CONFLICT (user_id, market_id)
    DO UPDATE SET vote = ${vote}, created_at = NOW()
  `

  // Recalculate counts from votes table
  await sql`
    UPDATE market_resolutions mr
    SET
      confirm_count = (
        SELECT COUNT(*) FROM resolution_votes
        WHERE market_id = ${marketId} AND vote = 'confirm'
      ),
      dispute_count = (
        SELECT COUNT(*) FROM resolution_votes
        WHERE market_id = ${marketId} AND vote = 'dispute'
      )
    WHERE mr.market_id = ${marketId}
  `

  return { alreadyVoted: false, newVote: vote }
}

/**
 * Check if a pending_resolution market is ready to auto-finalize or should be disputed.
 * Called lazily on GET /markets/:id.
 */
export async function checkAndAutoResolve(marketId: string): Promise<void> {
  const rows = (await sql`
    SELECT mr.dispute_count, mr.resolves_at, m.status
    FROM market_resolutions mr
    JOIN markets m ON m.id = mr.market_id
    WHERE mr.market_id = ${marketId}
    LIMIT 1
  `) as { dispute_count: number; resolves_at: string | null; status: string }[]

  const row = rows[0]
  if (!row || row.status !== 'pending_resolution') return
  if (!row.resolves_at || new Date(row.resolves_at) > new Date()) return

  if (row.dispute_count >= DISPUTE_THRESHOLD) {
    // Too many disputes → mark for manual review
    await sql`UPDATE markets SET status = 'disputed' WHERE id = ${marketId}`
  } else {
    // Window expired with few disputes → finalize
    await finalizeResolution(marketId)
  }
}

/**
 * Atomically distribute payouts and mark market as resolved.
 * Uses pool transactions + row locks to prevent double-payouts.
 */
export async function finalizeResolution(marketId: string): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Lock market
    const marketRows = await client.query<{
      pool_yes: number
      pool_no: number
      status: string
      market_type: string
    }>(
      "SELECT pool_yes, pool_no, status, market_type FROM markets WHERE id = $1 FOR UPDATE",
      [marketId]
    )
    const market = marketRows.rows[0]
    if (!market || market.status === 'resolved') {
      await client.query('ROLLBACK')
      return
    }

    // Get the agreed result
    const resRows = await client.query<{ result: string }>(
      'SELECT result FROM market_resolutions WHERE market_id = $1',
      [marketId]
    )
    const resolution = resRows.rows[0]
    if (!resolution?.result) {
      await client.query('ROLLBACK')
      return
    }

    const result = resolution.result  // 'YES', 'NO', or answer UUID

    // Determine winning outcome and total pool
    let winningOutcome: 'YES' | 'NO'
    let totalPool: number
    let winningAnswerId: string | null = null

    if (market.market_type === 'multi') {
      // For multi-choice: result is the answer UUID
      winningAnswerId = result
      winningOutcome = 'YES'
      const answerRows = await client.query<{ pool_yes: number; pool_no: number }>(
        'SELECT pool_yes, pool_no FROM answers WHERE id = $1 FOR UPDATE',
        [winningAnswerId]
      )
      const answer = answerRows.rows[0]
      totalPool = answer ? answer.pool_yes + answer.pool_no : 0
    } else {
      // Binary: result is 'YES' or 'NO'
      winningOutcome = result as 'YES' | 'NO'
      totalPool = market.pool_yes + market.pool_no
    }

    // Get all winning positions
    const posQuery = winningAnswerId
      ? await client.query<{ user_id: string; shares: number }>(
          'SELECT user_id, shares FROM user_positions WHERE market_id = $1 AND answer_id = $2 AND outcome = $3 AND shares > 0',
          [marketId, winningAnswerId, winningOutcome]
        )
      : await client.query<{ user_id: string; shares: number }>(
          'SELECT user_id, shares FROM user_positions WHERE market_id = $1 AND answer_id IS NULL AND outcome = $2 AND shares > 0',
          [marketId, winningOutcome]
        )

    const winners = posQuery.rows

    // Calculate total winning shares
    const totalWinningShares = winners.reduce((sum, w) => sum + w.shares, 0)

    let totalPayoutDistributed = 0

    if (totalPool > 0 && totalWinningShares > 0) {
      for (const winner of winners) {
        const payout = Math.round((winner.shares * totalPool) / totalWinningShares)
        if (payout <= 0) continue

        totalPayoutDistributed += payout

        // Credit winner's balance
        await client.query(
          'UPDATE user_balances SET balance = balance + $1, total_earned = total_earned + $1 WHERE user_id = $2',
          [payout, winner.user_id]
        )

        // Record payout transaction
        const balanceRows = await client.query<{ balance: number }>(
          'SELECT balance FROM user_balances WHERE user_id = $1',
          [winner.user_id]
        )
        const newBalance = balanceRows.rows[0]?.balance ?? 0

        await client.query(
          `INSERT INTO transactions (user_id, type, market_id, amount, balance_after, created_at)
           VALUES ($1, 'resolution', $2, $3, $4, NOW())`,
          [winner.user_id, marketId, payout, newBalance]
        )
      }
    }

    // Mark market as resolved
    await client.query(
      "UPDATE markets SET status = 'resolved', resolution_result = $1, resolved_at = NOW() WHERE id = $2",
      [result, marketId]
    )

    // Update resolution record with payout totals
    await client.query(
      `UPDATE market_resolutions
       SET total_yes_payout = $1, total_no_payout = $2
       WHERE market_id = $3`,
      [
        winningOutcome === 'YES' ? totalPayoutDistributed : 0,
        winningOutcome === 'NO' ? totalPayoutDistributed : 0,
        marketId,
      ]
    )

    await client.query('COMMIT')
    console.log(`Market ${marketId} resolved as ${result}. Distributed ${totalPayoutDistributed} cents to ${winners.length} winners.`)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('finalizeResolution error (rolled back):', err)
    throw err
  } finally {
    client.release()
  }
}

/**
 * Fetch resolution details for a market (public)
 */
export async function getMarketResolution(marketId: string): Promise<ResolutionRow | null> {
  const rows = (await sql`
    SELECT
      id, market_id, result, explanation, resolved_by,
      total_yes_payout, total_no_payout,
      ai_groq_result, ai_gemini_result,
      ai_groq_confidence, ai_gemini_confidence,
      ai_groq_reasoning, ai_gemini_reasoning,
      confirm_count, dispute_count, resolves_at,
      created_at
    FROM market_resolutions
    WHERE market_id = ${marketId}
    LIMIT 1
  `) as ResolutionRow[]

  return rows[0] ?? null
}
