/**
 * Betting Database Queries
 *
 * Bet placement logic:
 * 1. Verify user balance
 * 2. Verify market/answer exists
 * 3. Calculate CPMM result
 * 4-8. Execute updates (database constraints ensure atomicity)
 */

import { sql } from './client'
import type { DbBet } from '../mappers'
import { calculateCpmmPurchase, type CpmmPool } from '../lib/cpmm'

/**
 * Typed error for bet placement failures
 */
export class BetError extends Error {
  code: 'INSUFFICIENT_BALANCE' | 'MARKET_NOT_FOUND_OR_CLOSED'
  statusCode: number

  constructor(code: 'INSUFFICIENT_BALANCE' | 'MARKET_NOT_FOUND_OR_CLOSED', statusCode: number) {
    super(code)
    this.name = 'BetError'
    this.code = code
    this.statusCode = statusCode
  }
}

/**
 * Place a bet
 *
 * @param betData - Bet details
 * @returns Bet ID if successful
 * @throws Error with code like INSUFFICIENT_BALANCE, MARKET_NOT_FOUND_OR_CLOSED
 */
export async function placeBet(betData: {
  userId: string
  marketId: string
  answerId?: string
  direction: 'YES' | 'NO'
  amount: number // in cents
}): Promise<string> {
  try {
    // 1. Verify user balance
    const balanceRows = (await sql`
      SELECT balance FROM user_balances
      WHERE user_id = ${betData.userId}
    `) as { balance: number }[]

    const userBalance = balanceRows[0]?.balance ?? 0
    if (userBalance < betData.amount) {
      throw new BetError('INSUFFICIENT_BALANCE', 422)
    }

    // 2. Get market/answer info
    let poolYes: number
    let poolNo: number

    if (betData.answerId) {
      const answerRows = (await sql`
        SELECT pool_yes, pool_no FROM answers
        WHERE id = ${betData.answerId} AND market_id = ${betData.marketId}
      `) as { pool_yes: number; pool_no: number }[]

      if (!answerRows[0]) {
        throw new BetError('MARKET_NOT_FOUND_OR_CLOSED', 422)
      }

      poolYes = answerRows[0].pool_yes
      poolNo = answerRows[0].pool_no
    } else {
      const marketRows = (await sql`
        SELECT pool_yes, pool_no, status FROM markets
        WHERE id = ${betData.marketId}
      `) as { pool_yes: number; pool_no: number; status: string }[]

      const market = marketRows[0]
      if (!market || market.status !== 'open') {
        throw new BetError('MARKET_NOT_FOUND_OR_CLOSED', 422)
      }

      poolYes = market.pool_yes
      poolNo = market.pool_no
    }

    // 3. Calculate CPMM
    const result = calculateCpmmPurchase(
      {
        pool: { YES: poolYes, NO: poolNo },
        p: 0.5,
        collectedFees: { creator: 0, liquidity: 0 },
      },
      betData.amount,
      betData.direction
    )

    // 4. Debit balance
    await sql`
      UPDATE user_balances
      SET balance = balance - ${betData.amount}
      WHERE user_id = ${betData.userId}
    `

    // 5. Update pool
    if (betData.answerId) {
      await sql`
        UPDATE answers
        SET
          pool_yes = ${betData.direction === 'YES' ? result.newPool.YES : poolYes},
          pool_no = ${betData.direction === 'NO' ? result.newPool.NO : poolNo},
          volume = volume + ${betData.amount}
        WHERE id = ${betData.answerId}
      `
    } else {
      await sql`
        UPDATE markets
        SET
          pool_yes = ${betData.direction === 'YES' ? result.newPool.YES : poolYes},
          pool_no = ${betData.direction === 'NO' ? result.newPool.NO : poolNo},
          total_volume = total_volume + ${betData.amount}
        WHERE id = ${betData.marketId}
      `
    }

    // 6. Insert bet
    const betRows = (await sql`
      INSERT INTO bets (
        user_id, market_id, answer_id, outcome, amount, shares,
        prob_before, prob_after, created_at
      )
      VALUES (
        ${betData.userId}, ${betData.marketId}, ${betData.answerId || null},
        ${betData.direction}, ${betData.amount},
        ${Math.round(result.shares * 100)},
        ${result.probBefore}, ${result.probAfter}, NOW()
      )
      RETURNING id
    `) as { id: string }[]

    const betId = betRows[0]?.id
    if (!betId) throw new Error('Failed to create bet')

    // 7. Upsert position
    await sql`
      INSERT INTO user_positions (
        user_id, market_id, answer_id, outcome, shares,
        invested_amount, created_at, updated_at
      )
      VALUES (
        ${betData.userId}, ${betData.marketId}, ${betData.answerId || null},
        ${betData.direction}, ${Math.round(result.shares * 100)},
        ${betData.amount}, NOW(), NOW()
      )
      ON CONFLICT (user_id, market_id, COALESCE(answer_id, ''::uuid), outcome)
      DO UPDATE SET
        shares = user_positions.shares + ${Math.round(result.shares * 100)},
        invested_amount = user_positions.invested_amount + ${betData.amount},
        updated_at = NOW()
    `

    // 8. Audit log
    await sql`
      INSERT INTO transactions (user_id, type, market_id, bet_id, amount, created_at)
      VALUES (${betData.userId}, 'bet_placed', ${betData.marketId}, ${betId}, ${betData.amount}, NOW())
    `

    return betId
  } catch (err) {
    console.error('placeBet error:', err)
    throw err
  }
}

/**
 * Get user's bets
 */
export async function getUserBets(userId: string, limit = 50): Promise<DbBet[]> {
  try {
    const bets = (await sql`
      SELECT id, user_id, user_name, market_id, outcome, amount, shares,
        prob_before, prob_after, created_at
      FROM bets
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `) as DbBet[]

    return bets
  } catch (err) {
    console.error('getUserBets error:', err)
    throw err
  }
}

/**
 * Get market bets
 */
export async function getMarketBets(marketId: string, limit = 50): Promise<DbBet[]> {
  try {
    const bets = (await sql`
      SELECT id, user_id, user_name, market_id, outcome, amount, shares,
        prob_before, prob_after, created_at
      FROM bets
      WHERE market_id = ${marketId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `) as DbBet[]

    return bets
  } catch (err) {
    console.error('getMarketBets error:', err)
    throw err
  }
}
