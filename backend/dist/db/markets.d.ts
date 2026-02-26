/**
 * Market Database Queries
 */
import type { DbMarket, DbAnswer } from '../mappers';
/**
 * List all markets with optional filters
 * Returns markets with their answers (if multi-choice)
 */
export declare function listMarkets(filters?: {
    category?: string;
    status?: string;
    limit?: number;
}): Promise<Array<{
    market: DbMarket;
    answers: DbAnswer[];
}>>;
/**
 * Get a single market by ID
 * Returns the market with all its answers (if multi-choice)
 */
export declare function getMarketById(id: string): Promise<{
    market: DbMarket;
    answers: DbAnswer[];
} | null>;
/**
 * Create a new market
 * For binary markets: just create the market
 * For multi-choice markets: create the market + answers rows
 */
export declare function createMarket(data: {
    creatorId: string;
    question: string;
    description: string;
    category: string;
    marketType: 'binary' | 'multi';
    closesAt: string;
    initialPoolYes?: number;
    initialPoolNo?: number;
    answers?: string[];
}): Promise<string>;
/**
 * Get market for betting (with lock for transaction)
 * Used internally in bet placement transaction
 */
export declare function getMarketForBetting(id: string): Promise<{
    pool_yes: number;
    pool_no: number;
    p: number;
    status: string;
} | null>;
/**
 * Update market pool and volume (used in bet transaction)
 */
export declare function updateMarketPool(data: {
    marketId: string;
    poolYes: number;
    poolNo: number;
    volumeDelta: number;
}): Promise<void>;
//# sourceMappingURL=markets.d.ts.map