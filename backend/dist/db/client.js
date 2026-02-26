"use strict";
/**
 * Neon PostgreSQL Client
 *
 * Single instance for all database queries.
 * Uses unpooled connection for transactions (pgBouncer doesn't support
 * multi-statement transactions in transaction mode).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sql = void 0;
exports.testConnection = testConnection;
exports.healthCheck = healthCheck;
const serverless_1 = require("@neondatabase/serverless");
if (!process.env.DATABASE_URL_UNPOOLED && !process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL_UNPOOLED or DATABASE_URL must be set in .env');
}
const connectionUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
/**
 * Main SQL client for queries.
 * Uses unpooled connection to support transactions.
 */
exports.sql = (0, serverless_1.neon)(connectionUrl);
/**
 * Test the connection
 */
async function testConnection() {
    try {
        const result = await (0, exports.sql) `SELECT 1 as ok`;
        return result[0]?.ok === 1;
    }
    catch (err) {
        console.error('Database connection failed:', err);
        return false;
    }
}
/**
 * Health check function
 */
async function healthCheck() {
    try {
        await (0, exports.sql) `SELECT 1`;
        return { status: 'ok' };
    }
    catch {
        return { status: 'error' };
    }
}
//# sourceMappingURL=client.js.map