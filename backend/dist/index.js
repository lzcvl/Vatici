"use strict";
/**
 * Vatici Backend API Server
 *
 * Hono + PostgreSQL (Neon)
 * Routes: /markets, /bets, /me
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const hono_1 = require("hono");
const node_server_1 = require("@hono/node-server");
const cors_1 = require("hono/cors");
const client_1 = require("./db/client");
const markets_1 = __importDefault(require("./routes/markets"));
const bets_1 = __importDefault(require("./routes/bets"));
const app = new hono_1.Hono();
/**
 * CORS middleware
 * Allow requests from frontend (Vercel URL)
 */
app.use('*', (0, cors_1.cors)({
    origin: process.env.FRONTEND_URL || '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
/**
 * Health check route
 */
app.get('/health', async (c) => {
    const health = await (0, client_1.healthCheck)();
    if (health.status === 'error') {
        return c.json({ status: 'error', message: 'Database connection failed' }, 503);
    }
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});
/**
 * Root route
 */
app.get('/', (c) => {
    return c.json({
        name: 'Vatici API',
        version: '1.0.0',
        status: 'running',
    });
});
/**
 * Routes
 */
app.route('/markets', markets_1.default);
app.route('/bets', bets_1.default);
/**
 * Routes to be added:
 * - /me/balance (GET)
 * - /me/positions (GET)
 * - /me/activity (GET)
 */
/**
 * 404 handler
 */
app.notFound((c) => {
    return c.json({ error: 'Not found' }, 404);
});
/**
 * Error handler
 */
app.onError((err, c) => {
    console.error('Server error:', err);
    return c.json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    }, 500);
});
/**
 * Start server
 */
const port = Number(process.env.PORT || 3001);
(0, node_server_1.serve)({
    fetch: app.fetch,
    port,
}, (info) => {
    console.log(`🚀 Server running on http://localhost:${info.port}`);
    console.log(`📊 Database: ${process.env.DATABASE_URL_UNPOOLED ? 'unpooled' : 'pooled'}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map