"use strict";
/**
 * Bets Routes
 * POST /bets - Place a new bet
 * GET /bets/:marketId - Get bets for a market
 */
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const bets_1 = require("../db/bets");
const app = new hono_1.Hono();
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
        // TODO: Verify auth token from header
        // const userId = await verifyAuth(c)
        const body = await c.req.json();
        // Validation
        if (!body.marketId || !body.direction || !body.amount) {
            return c.json({ error: 'Missing required fields: marketId, direction, amount' }, 400);
        }
        if (!['YES', 'NO'].includes(body.direction)) {
            return c.json({ error: 'Invalid direction. Must be YES or NO' }, 400);
        }
        if (body.amount <= 0) {
            return c.json({ error: 'Amount must be greater than 0' }, 400);
        }
        // TODO: Get userId from auth token
        const userId = 'todo-auth';
        // Place bet (atomic transaction)
        const betId = await (0, bets_1.placeBet)({
            userId,
            marketId: body.marketId,
            answerId: body.answerId,
            direction: body.direction,
            amount: Math.round(body.amount), // Ensure integer cents
        });
        return c.json({ id: betId }, 201);
    }
    catch (err) {
        console.error('POST /bets error:', err);
        // Check for specific error codes
        const error = err;
        if (error.code === 'INSUFFICIENT_BALANCE') {
            return c.json({ error: 'Insufficient balance to place this bet' }, 422);
        }
        if (error.code === 'MARKET_NOT_FOUND_OR_CLOSED') {
            return c.json({ error: 'Market not found or closed for betting' }, 422);
        }
        return c.json({ error: 'Failed to place bet' }, 500);
    }
});
/**
 * GET /bets/:marketId
 * Get all bets for a market
 */
app.get('/:marketId', async (c) => {
    try {
        const marketId = c.req.param('marketId');
        const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
        const bets = await (0, bets_1.getMarketBets)(marketId, limit);
        return c.json(bets);
    }
    catch (err) {
        console.error('GET /bets/:marketId error:', err);
        return c.json({ error: 'Failed to fetch bets' }, 500);
    }
});
exports.default = app;
//# sourceMappingURL=bets.js.map