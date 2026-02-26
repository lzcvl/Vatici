"use strict";
/**
 * Data Mappers
 *
 * Converts database rows (snake_case, amounts in cents, plain strings)
 * into frontend types (camelCase, amounts in BRL, i18n objects)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapMarket = mapMarket;
exports.mapBet = mapBet;
exports.mapBalance = mapBalance;
exports.successResponse = successResponse;
/**
 * Helper: wrap plain string in i18n object
 * (all pt/en/es keys point to the same string)
 */
function wrapI18n(text) {
    return { pt: text || '', en: text || '', es: text || '' };
}
/**
 * Helper: calculate probability from pools
 */
function calculateProbability(poolYes, poolNo) {
    const total = poolYes + poolNo;
    if (total === 0)
        return 0.5;
    return poolNo / total;
}
/**
 * Map a single market (binary or multi with answers)
 */
function mapMarket(market, answers = []) {
    const probability = calculateProbability(market.pool_yes, market.pool_no);
    const options = market.market_type === 'multi'
        ? answers.map((answer) => ({
            id: answer.id,
            label: wrapI18n(answer.text),
            probability: calculateProbability(answer.pool_yes, answer.pool_no),
            pool: answer.pool_yes / 100 + answer.pool_no / 100, // cents -> BRL
        }))
        : undefined;
    return {
        id: market.id,
        type: market.market_type,
        question: wrapI18n(market.question),
        description: wrapI18n(market.description || ''),
        category: market.category || 'general',
        probability,
        volume: market.total_volume / 100, // cents -> BRL
        yesPool: market.pool_yes / 100,
        noPool: market.pool_no / 100,
        options,
        closesAt: market.closes_at,
        resolvedAt: market.resolved_at,
        resolution: market.resolution_result || null,
        createdAt: market.created_at,
        trending: market.is_trending,
        iconUrl: market.icon_url || undefined,
        probabilityHistory: [], // loaded separately if needed
    };
}
/**
 * Map a bet from database
 */
function mapBet(bet) {
    return {
        id: bet.id,
        userId: bet.user_id,
        userName: bet.user_name,
        marketId: bet.market_id,
        direction: bet.outcome, // DB outcome -> frontend direction
        amount: bet.amount / 100, // cents -> BRL
        shares: bet.shares / 100,
        avgPrice: bet.prob_before,
        potentialPayout: bet.shares / 100, // simplified
        createdAt: bet.created_at,
    };
}
/**
 * Map user balance
 */
function mapBalance(balanceCents) {
    return {
        balance: balanceCents / 100, // cents -> BRL
    };
}
/**
 * Success response wrapper
 */
function successResponse(data, statusCode = 200) {
    return {
        data,
        statusCode,
    };
}
//# sourceMappingURL=mappers.js.map