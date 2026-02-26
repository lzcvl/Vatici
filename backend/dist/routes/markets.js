"use strict";
/**
 * Markets Routes
 * GET /markets, POST /markets, GET /markets/:id
 */
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const markets_1 = require("../db/markets");
const mappers_1 = require("../mappers");
const app = new hono_1.Hono();
/**
 * GET /markets
 * List all markets with optional filters
 */
app.get('/', async (c) => {
    try {
        const { category, status = 'open', limit = '50' } = c.req.query();
        const markets = await (0, markets_1.listMarkets)({
            category: category || undefined,
            status,
            limit: Math.min(parseInt(limit), 100), // max 100
        });
        const result = markets.map(({ market, answers }) => (0, mappers_1.mapMarket)(market, answers));
        return c.json(result);
    }
    catch (err) {
        console.error('GET /markets error:', err);
        const error = { error: 'Failed to fetch markets' };
        return c.json(error, 500);
    }
});
/**
 * GET /markets/:id
 * Get a single market with its answers (if multi-choice)
 */
app.get('/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const result = await (0, markets_1.getMarketById)(id);
        if (!result) {
            return c.json({ error: 'Market not found' }, 404);
        }
        return c.json((0, mappers_1.mapMarket)(result.market, result.answers));
    }
    catch (err) {
        console.error(`GET /markets/:id error:`, err);
        return c.json({ error: 'Failed to fetch market' }, 500);
    }
});
/**
 * POST /markets
 * Create a new market (auth required)
 *
 * Body:
 * {
 *   question: string
 *   description: string
 *   category: string
 *   marketType: 'binary' | 'multi'
 *   closesAt: string (ISO date)
 *   answers?: string[] (for multi-choice)
 * }
 */
app.post('/', async (c) => {
    try {
        // TODO: Verify auth token from header
        // const userId = await verifyAuth(c)
        const body = await c.req.json();
        // Validation
        if (!body.question || !body.marketType || !body.closesAt) {
            return c.json({ error: 'Missing required fields: question, marketType, closesAt' }, 400);
        }
        if (!['binary', 'multi'].includes(body.marketType)) {
            return c.json({ error: 'Invalid marketType' }, 400);
        }
        if (body.marketType === 'multi' && (!body.answers || body.answers.length < 2)) {
            return c.json({ error: 'Multi-choice markets require at least 2 answers' }, 400);
        }
        // TODO: Get userId from auth token
        const userId = 'todo-auth';
        const marketId = await (0, markets_1.createMarket)({
            creatorId: userId,
            question: body.question,
            description: body.description || '',
            category: body.category || 'general',
            marketType: body.marketType,
            closesAt: body.closesAt,
            answers: body.answers,
        });
        return c.json({ id: marketId }, 201);
    }
    catch (err) {
        console.error('POST /markets error:', err);
        return c.json({ error: 'Failed to create market' }, 500);
    }
});
exports.default = app;
//# sourceMappingURL=markets.js.map