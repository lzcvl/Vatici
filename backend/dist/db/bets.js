"use strict";
/**
 * Betting Database Queries
 *
 * Bet placement logic:
 * 1. Verify user balance
 * 2. Verify market/answer exists
 * 3. Calculate CPMM result
 * 4-8. Execute updates (database constraints ensure atomicity)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.placeBet = placeBet;
exports.getUserBets = getUserBets;
exports.getMarketBets = getMarketBets;
const client_1 = require("./client");
const cpmm_1 = require("../lib/cpmm");
/**
 * Place a bet
 *
 * @param betData - Bet details
 * @returns Bet ID if successful
 * @throws Error with code like INSUFFICIENT_BALANCE, MARKET_NOT_FOUND_OR_CLOSED
 */
async function placeBet(betData) {
    try {
        // 1. Verify user balance
        const balanceRows = (await (0, client_1.sql) `
      SELECT balance FROM user_balances
      WHERE user_id = ${betData.userId}
    `);
        const userBalance = balanceRows[0]?.balance ?? 0;
        if (userBalance < betData.amount) {
            const err = new Error('Insufficient balance');
            err.code = 'INSUFFICIENT_BALANCE';
            err.statusCode = 422;
            throw err;
        }
        // 2. Get market/answer info
        let poolYes;
        let poolNo;
        if (betData.answerId) {
            const answerRows = (await (0, client_1.sql) `
        SELECT pool_yes, pool_no FROM answers
        WHERE id = ${betData.answerId} AND market_id = ${betData.marketId}
      `);
            if (!answerRows[0]) {
                const err = new Error('Answer not found or market closed');
                err.code = 'MARKET_NOT_FOUND_OR_CLOSED';
                err.statusCode = 422;
                throw err;
            }
            poolYes = answerRows[0].pool_yes;
            poolNo = answerRows[0].pool_no;
        }
        else {
            const marketRows = (await (0, client_1.sql) `
        SELECT pool_yes, pool_no, status FROM markets
        WHERE id = ${betData.marketId}
      `);
            const market = marketRows[0];
            if (!market || market.status !== 'open') {
                const err = new Error('Market not found or closed');
                err.code = 'MARKET_NOT_FOUND_OR_CLOSED';
                err.statusCode = 422;
                throw err;
            }
            poolYes = market.pool_yes;
            poolNo = market.pool_no;
        }
        // 3. Calculate CPMM
        const result = (0, cpmm_1.calculateCpmmPurchase)({
            pool: { YES: poolYes, NO: poolNo },
            p: 0.5,
            collectedFees: { creator: 0, liquidity: 0 },
        }, betData.amount, betData.direction);
        // 4. Debit balance
        await (0, client_1.sql) `
      UPDATE user_balances
      SET balance = balance - ${betData.amount}
      WHERE user_id = ${betData.userId}
    `;
        // 5. Update pool
        if (betData.answerId) {
            await (0, client_1.sql) `
        UPDATE answers
        SET
          pool_yes = ${betData.direction === 'YES' ? result.newPool.YES : poolYes},
          pool_no = ${betData.direction === 'NO' ? result.newPool.NO : poolNo},
          volume = volume + ${betData.amount}
        WHERE id = ${betData.answerId}
      `;
        }
        else {
            await (0, client_1.sql) `
        UPDATE markets
        SET
          pool_yes = ${betData.direction === 'YES' ? result.newPool.YES : poolYes},
          pool_no = ${betData.direction === 'NO' ? result.newPool.NO : poolNo},
          total_volume = total_volume + ${betData.amount}
        WHERE id = ${betData.marketId}
      `;
        }
        // 6. Insert bet
        const betRows = (await (0, client_1.sql) `
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
    `);
        const betId = betRows[0]?.id;
        if (!betId)
            throw new Error('Failed to create bet');
        // 7. Upsert position
        await (0, client_1.sql) `
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
    `;
        // 8. Audit log
        await (0, client_1.sql) `
      INSERT INTO transactions (user_id, type, market_id, bet_id, amount, created_at)
      VALUES (${betData.userId}, 'bet_placed', ${betData.marketId}, ${betId}, ${betData.amount}, NOW())
    `;
        return betId;
    }
    catch (err) {
        console.error('placeBet error:', err);
        throw err;
    }
}
/**
 * Get user's bets
 */
async function getUserBets(userId, limit = 50) {
    try {
        const bets = (await (0, client_1.sql) `
      SELECT id, user_id, user_name, market_id, outcome, amount, shares,
        prob_before, prob_after, created_at
      FROM bets
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `);
        return bets;
    }
    catch (err) {
        console.error('getUserBets error:', err);
        throw err;
    }
}
/**
 * Get market bets
 */
async function getMarketBets(marketId, limit = 50) {
    try {
        const bets = (await (0, client_1.sql) `
      SELECT id, user_id, user_name, market_id, outcome, amount, shares,
        prob_before, prob_after, created_at
      FROM bets
      WHERE market_id = ${marketId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `);
        return bets;
    }
    catch (err) {
        console.error('getMarketBets error:', err);
        throw err;
    }
}
//# sourceMappingURL=bets.js.map