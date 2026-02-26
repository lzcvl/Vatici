"use strict";
/**
 * User Profile Routes
 * GET /me/balance - User's current balance
 * GET /me/positions - User's market positions
 * GET /me/activity - User's recent activity
 */
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const client_1 = require("../db/client");
const mappers_1 = require("../mappers");
const app = new hono_1.Hono();
/**
 * GET /me/balance
 * Get user's current balance in BRL
 */
app.get('/balance', async (c) => {
    try {
        // TODO: Get userId from auth token
        const userId = 'todo-auth';
        const rows = (await (0, client_1.sql) `
      SELECT balance FROM user_balances
      WHERE user_id = ${userId}
      LIMIT 1
    `);
        const balance = rows[0]?.balance ?? 0;
        return c.json((0, mappers_1.mapBalance)(balance));
    }
    catch (err) {
        console.error('GET /me/balance error:', err);
        return c.json({ error: 'Failed to fetch balance' }, 500);
    }
});
/**
 * GET /me/positions
 * Get user's current positions (betting positions across markets)
 */
app.get('/positions', async (c) => {
    try {
        // TODO: Get userId from auth token
        const userId = 'todo-auth';
        const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
        // Get positions with market data
        const positions = (await (0, client_1.sql) `
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
    `);
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
        }));
        return c.json(result);
    }
    catch (err) {
        console.error('GET /me/positions error:', err);
        return c.json({ error: 'Failed to fetch positions' }, 500);
    }
});
/**
 * GET /me/activity
 * Get user's recent activity (bets placed, markets resolved, etc.)
 */
app.get('/activity', async (c) => {
    try {
        // TODO: Get userId from auth token
        const userId = 'todo-auth';
        const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
        // Get recent transactions/bets
        const activity = (await (0, client_1.sql) `
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
    `);
        const result = activity.map((a) => ({
            id: a.id,
            type: 'bet',
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
        }));
        return c.json(result);
    }
    catch (err) {
        console.error('GET /me/activity error:', err);
        return c.json({ error: 'Failed to fetch activity' }, 500);
    }
});
exports.default = app;
//# sourceMappingURL=me.js.map