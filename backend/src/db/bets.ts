/**
 * Betting Database Queries
 *
 * placeBet runs all steps inside a single PostgreSQL transaction with
 * SELECT ... FOR UPDATE locks to prevent race conditions on concurrent bets.
 */

import { pool } from './client'
import type { DbBet } from '../mappers'
import { sql } from './client'
import { calculateCpmmPurchase } from '../lib/cpmm'

/**
 * Typed error for bet placement failures
 */
export class BetError extends Error {
  code: 'INSUFFICIENT_BALANCE' | 'MARKET_NOT_FOUND_OR_CLOSED'
  statusCode: number

  constructor(
    code: 'INSUFFICIENT_BALANCE' | 'MARKET_NOT_FOUND_OR_CLOSED',
    statusCode: number,
    message: string
  ) {
    super(message)
    this.name = 'BetError'
    this.code = code
    this.statusCode = statusCode
  }
}

/**
 * Place a bet atomically.
 * All reads and writes happen inside a single transaction with row-level locks.
 *
 * @returns Bet ID if successful
 * @throws BetError for domain errors (insufficient balance, closed market)
 */
export async function placeBet(betData: {
  userId: string
  marketId: string
  answerId?: string
  direction: 'YES' | 'NO'
  amount: number // in cents
}): Promise<string> {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // 1. Lock and verify user balance (FOR UPDATE prevents concurrent debits)
    const balanceResult = await client.query<{ balance: number }>(
      'SELECT balance FROM user_balances WHERE user_id = $1 FOR UPDATE',
      [betData.userId]
    )
    const userBalance = balanceResult.rows[0]?.balance ?? 0
    if (userBalance < betData.amount) {
      throw new BetError('INSUFFICIENT_BALANCE', 422, 'Saldo insuficiente para realizar esta aposta.')
    }

    // 2. Lock and read pool (FOR UPDATE prevents concurrent pool updates)
    let poolYes: number
    let poolNo: number

    if (betData.answerId) {
      const answerResult = await client.query<{ pool_yes: number; pool_no: number }>(
        'SELECT pool_yes, pool_no FROM answers WHERE id = $1 AND market_id = $2 FOR UPDATE',
        [betData.answerId, betData.marketId]
      )
      if (!answerResult.rows[0]) {
        throw new BetError('MARKET_NOT_FOUND_OR_CLOSED', 422, 'Opção ou mercado não encontrado.')
      }
      poolYes = answerResult.rows[0].pool_yes
      poolNo = answerResult.rows[0].pool_no
    } else {
      const marketResult = await client.query<{ pool_yes: number; pool_no: number; status: string }>(
        "SELECT pool_yes, pool_no, status FROM markets WHERE id = $1 FOR UPDATE",
        [betData.marketId]
      )
      const market = marketResult.rows[0]
      if (!market || market.status !== 'open') {
        throw new BetError('MARKET_NOT_FOUND_OR_CLOSED', 422, 'Mercado não encontrado ou encerrado.')
      }
      poolYes = market.pool_yes
      poolNo = market.pool_no
    }

    // 3. Calculate CPMM result (pure computation, no I/O)
    const result = calculateCpmmPurchase(
      { pool: { YES: poolYes, NO: poolNo }, p: 0.5, collectedFees: { creator: 0, liquidity: 0 } },
      betData.amount,
      betData.direction
    )

    // 4. Debit balance
    await client.query(
      'UPDATE user_balances SET balance = balance - $1 WHERE user_id = $2',
      [betData.amount, betData.userId]
    )

    // 5. Update pool with new CPMM values
    if (betData.answerId) {
      await client.query(
        'UPDATE answers SET pool_yes = $1, pool_no = $2, volume = volume + $3 WHERE id = $4',
        [
          betData.direction === 'YES' ? result.newPool.YES : poolYes,
          betData.direction === 'NO' ? result.newPool.NO : poolNo,
          betData.amount,
          betData.answerId,
        ]
      )
    } else {
      await client.query(
        'UPDATE markets SET pool_yes = $1, pool_no = $2, total_volume = total_volume + $3 WHERE id = $4',
        [
          betData.direction === 'YES' ? result.newPool.YES : poolYes,
          betData.direction === 'NO' ? result.newPool.NO : poolNo,
          betData.amount,
          betData.marketId,
        ]
      )
    }

    // 6. Insert bet record
    const betResult = await client.query<{ id: string }>(
      `INSERT INTO bets (user_id, market_id, answer_id, outcome, amount, shares, prob_before, prob_after, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING id`,
      [
        betData.userId,
        betData.marketId,
        betData.answerId ?? null,
        betData.direction,
        betData.amount,
        Math.round(result.shares * 100),
        result.probBefore,
        result.probAfter,
      ]
    )
    const betId = betResult.rows[0]?.id
    if (!betId) throw new Error('Failed to create bet')

    // 7. Upsert position
    await client.query(
      `INSERT INTO user_positions (user_id, market_id, answer_id, outcome, shares, invested_amount, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (user_id, market_id, COALESCE(answer_id, ''::uuid), outcome)
       DO UPDATE SET
         shares = user_positions.shares + $5,
         invested_amount = user_positions.invested_amount + $6,
         updated_at = NOW()`,
      [
        betData.userId,
        betData.marketId,
        betData.answerId ?? null,
        betData.direction,
        Math.round(result.shares * 100),
        betData.amount,
      ]
    )

    // 8. Audit log
    await client.query(
      `INSERT INTO transactions (user_id, type, market_id, bet_id, amount, created_at)
       VALUES ($1, 'bet_placed', $2, $3, $4, NOW())`,
      [betData.userId, betData.marketId, betId, betData.amount]
    )

    await client.query('COMMIT')
    return betId
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('placeBet error (rolled back):', err)
    throw err
  } finally {
    client.release()
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
