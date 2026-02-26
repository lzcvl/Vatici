"use strict";
/**
 * Market Database Queries
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMarkets = listMarkets;
exports.getMarketById = getMarketById;
exports.createMarket = createMarket;
exports.getMarketForBetting = getMarketForBetting;
exports.updateMarketPool = updateMarketPool;
const client_1 = require("./client");
/**
 * List all markets with optional filters
 * Returns markets with their answers (if multi-choice)
 */
async function listMarkets(filters) {
    try {
        const status = filters?.status ?? 'open';
        const limit = filters?.limit ?? 50;
        const markets = (await (0, client_1.sql) `
      SELECT
        id, question, description, category, market_type,
        pool_yes, pool_no, p, status, closes_at, resolved_at,
        resolution_result, total_volume, is_trending, icon_url, created_at
      FROM markets
      WHERE status = ${status}
      ${filters?.category ? (0, client_1.sql) `AND category = ${filters.category}` : (0, client_1.sql) ``}
      ORDER BY is_trending DESC, total_volume DESC
      LIMIT ${limit}
    `);
        if (markets.length === 0)
            return [];
        // Fetch all answers for these markets (if any are multi-choice)
        const marketIds = markets.map((m) => m.id);
        const answers = (await (0, client_1.sql) `
      SELECT id, market_id, text, index, pool_yes, pool_no, volume, resolution
      FROM answers
      WHERE market_id = ANY(${marketIds}::uuid[])
      ORDER BY index ASC
    `);
        return markets.map((m) => ({
            market: m,
            answers: answers.filter((a) => a.market_id === m.id),
        }));
    }
    catch (err) {
        console.error('listMarkets error:', err);
        throw err;
    }
}
/**
 * Get a single market by ID
 * Returns the market with all its answers (if multi-choice)
 */
async function getMarketById(id) {
    try {
        const markets = (await (0, client_1.sql) `
      SELECT
        id, question, description, category, market_type,
        pool_yes, pool_no, p, status, closes_at, resolved_at,
        resolution_result, total_volume, is_trending, icon_url, created_at
      FROM markets
      WHERE id = ${id}
      LIMIT 1
    `);
        if (!markets[0])
            return null;
        const answers = (await (0, client_1.sql) `
      SELECT id, market_id, text, index, pool_yes, pool_no, volume, resolution
      FROM answers
      WHERE market_id = ${id}
      ORDER BY index ASC
    `);
        return { market: markets[0], answers };
    }
    catch (err) {
        console.error('getMarketById error:', err);
        throw err;
    }
}
/**
 * Create a new market
 * For binary markets: just create the market
 * For multi-choice markets: create the market + answers rows
 */
async function createMarket(data) {
    try {
        const poolYes = data.initialPoolYes ?? 100000;
        const poolNo = data.initialPoolNo ?? 100000;
        const rows = (await (0, client_1.sql) `
      INSERT INTO markets (
        creator_id, question, description, category,
        market_type, pool_yes, pool_no, closes_at
      )
      VALUES (
        ${data.creatorId}, ${data.question}, ${data.description},
        ${data.category}, ${data.marketType}, ${poolYes}, ${poolNo},
        ${data.closesAt}
      )
      RETURNING id
    `);
        const marketId = rows[0]?.id;
        if (!marketId)
            throw new Error('Failed to create market');
        // If multi-choice, create answer rows
        if (data.marketType === 'multi' && data.answers?.length) {
            for (let i = 0; i < data.answers.length; i++) {
                await (0, client_1.sql) `
          INSERT INTO answers (market_id, text, index, pool_yes, pool_no)
          VALUES (${marketId}, ${data.answers[i]}, ${i}, 100000, 100000)
        `;
            }
        }
        return marketId;
    }
    catch (err) {
        console.error('createMarket error:', err);
        throw err;
    }
}
/**
 * Get market for betting (with lock for transaction)
 * Used internally in bet placement transaction
 */
async function getMarketForBetting(id) {
    try {
        const rows = (await (0, client_1.sql) `
      SELECT pool_yes, pool_no, p, status
      FROM markets
      WHERE id = ${id}
      FOR UPDATE
    `);
        if (!rows[0])
            return null;
        return {
            ...rows[0],
            p: typeof rows[0].p === 'string' ? parseFloat(rows[0].p) : rows[0].p,
        };
    }
    catch (err) {
        console.error('getMarketForBetting error:', err);
        throw err;
    }
}
/**
 * Update market pool and volume (used in bet transaction)
 */
async function updateMarketPool(data) {
    try {
        await (0, client_1.sql) `
      UPDATE markets
      SET
        pool_yes = ${data.poolYes},
        pool_no = ${data.poolNo},
        total_volume = total_volume + ${data.volumeDelta},
        updated_at = NOW()
      WHERE id = ${data.marketId}
    `;
    }
    catch (err) {
        console.error('updateMarketPool error:', err);
        throw err;
    }
}
//# sourceMappingURL=markets.js.map