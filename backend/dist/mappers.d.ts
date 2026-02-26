/**
 * Data Mappers
 *
 * Converts database rows (snake_case, amounts in cents, plain strings)
 * into frontend types (camelCase, amounts in BRL, i18n objects)
 */
/**
 * Frontend type definitions (from lib/mock-data.ts)
 * These are what the API returns to the client
 */
export interface FrontendMarket {
    id: string;
    type: 'binary' | 'multi';
    question: {
        pt: string;
        en: string;
        es: string;
    };
    description: {
        pt: string;
        en: string;
        es: string;
    };
    category: string;
    probability: number;
    volume: number;
    yesPool: number;
    noPool: number;
    options?: FrontendMarketOption[];
    closesAt: string;
    resolvedAt: string | null;
    resolution: 'YES' | 'NO' | null;
    createdAt: string;
    trending: boolean;
    iconUrl?: string;
    probabilityHistory: Array<{
        date: string;
        probability: number;
    }>;
}
export interface FrontendMarketOption {
    id: string;
    label: {
        pt: string;
        en: string;
        es: string;
    };
    probability: number;
    pool: number;
}
export interface FrontendBet {
    id: string;
    userId: string;
    userName: string;
    marketId: string;
    direction: 'YES' | 'NO';
    amount: number;
    shares: number;
    avgPrice: number;
    potentialPayout: number;
    createdAt: string;
}
/**
 * Database row types (from Neon PostgreSQL)
 */
export interface DbMarket {
    id: string;
    question: string;
    description: string | null;
    category: string | null;
    market_type: 'binary' | 'multi';
    pool_yes: number;
    pool_no: number;
    p: number | string;
    status: string;
    closes_at: string;
    resolved_at: string | null;
    resolution_result: string | null;
    total_volume: number;
    is_trending: boolean;
    icon_url: string | null;
    created_at: string;
}
export interface DbAnswer {
    id: string;
    market_id: string;
    text: string;
    index: number;
    pool_yes: number;
    pool_no: number;
    volume: number;
    resolution: string | null;
}
export interface DbBet {
    id: string;
    user_id: string;
    user_name: string;
    market_id: string;
    outcome: 'YES' | 'NO';
    amount: number;
    shares: number;
    prob_before: number;
    prob_after: number;
    created_at: string;
}
/**
 * Map a single market (binary or multi with answers)
 */
export declare function mapMarket(market: DbMarket, answers?: DbAnswer[]): FrontendMarket;
/**
 * Map a bet from database
 */
export declare function mapBet(bet: DbBet): FrontendBet;
/**
 * Map user balance
 */
export declare function mapBalance(balanceCents: number): {
    balance: number;
};
/**
 * Error response
 */
export interface ErrorResponse {
    error: string;
    message?: string;
    code?: string;
}
/**
 * Success response wrapper
 */
export declare function successResponse<T>(data: T, statusCode?: number): {
    data: T;
    statusCode: number;
};
//# sourceMappingURL=mappers.d.ts.map