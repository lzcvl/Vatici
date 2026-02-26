/**
 * Database Types for Vatici Prediction Markets
 * Auto-generated from schema.sql
 */
export interface User {
    id: string;
    email: string;
    name: string;
    password_hash: string;
    avatar_url?: string;
    bio?: string;
    is_verified: boolean;
    created_at: Date;
    updated_at: Date;
    last_login_at?: Date;
    deleted_at?: Date;
}
export type CreateUserInput = Omit<User, 'id' | 'created_at' | 'updated_at'>;
export type UpdateUserInput = Partial<Omit<User, 'id' | 'password_hash' | 'created_at'>>;
export interface UserBalance {
    id: string;
    user_id: string;
    balance: number;
    total_earned: number;
    total_spent: number;
    updated_at: Date;
}
export type MarketStatus = 'open' | 'closed' | 'resolved';
export type MarketType = 'binary' | 'multi';
export type ResolutionResult = 'YES' | 'NO' | null;
export interface Market {
    id: string;
    creator_id: string;
    question: string;
    description?: string;
    category?: string;
    market_type: MarketType;
    pool_yes?: number;
    pool_no?: number;
    p?: number;
    collected_fees_creator: number;
    collected_fees_liquidity: number;
    status: MarketStatus;
    closes_at: Date;
    resolved_at?: Date;
    resolution_result?: ResolutionResult;
    total_volume: number;
    unique_bettors: number;
    icon_url?: string;
    is_trending: boolean;
    view_count: number;
    created_at: Date;
    updated_at: Date;
    answers?: Answer[];
}
export interface Answer {
    id: string;
    market_id: string;
    text: string;
    index: number;
    pool_yes: number;
    pool_no: number;
    volume: number;
    probability?: number;
    resolution?: 'YES' | 'NO' | null;
    resolution_time?: Date;
    resolution_probability?: number;
    resolver_id?: string;
    is_other: boolean;
    color?: string;
    image_url?: string;
    created_time: Date;
}
export type CreateAnswerInput = Omit<Answer, 'id' | 'created_time' | 'volume' | 'probability' | 'resolution' | 'resolution_time' | 'resolution_probability'>;
export type UpdateAnswerInput = Partial<Omit<Answer, 'id' | 'market_id' | 'created_time'>>;
export type CreateMarketInput = Omit<Market, 'id' | 'created_at' | 'updated_at' | 'total_volume' | 'unique_bettors' | 'view_count' | 'collected_fees_creator' | 'collected_fees_liquidity' | 'resolved_at' | 'resolution_result' | 'answers'> & {
    answers?: CreateAnswerInput[];
};
export type UpdateMarketInput = Partial<Omit<Market, 'id' | 'creator_id' | 'created_at' | 'answers'>>;
export type BetOutcome = 'YES' | 'NO';
export interface Bet {
    id: string;
    user_id: string;
    market_id: string;
    answer_id?: string;
    outcome: BetOutcome;
    amount: number;
    shares: number;
    prob_before: number;
    prob_after: number;
    fees: number;
    is_filled: boolean;
    is_cancelled: boolean;
    is_redemption: boolean;
    created_at: Date;
    updated_at: Date;
}
export type CreateBetInput = Omit<Bet, 'id' | 'shares' | 'prob_before' | 'prob_after' | 'fees' | 'is_filled' | 'is_cancelled' | 'is_redemption' | 'created_at' | 'updated_at'>;
export interface UserPosition {
    id: string;
    user_id: string;
    market_id: string;
    answer_id?: string;
    yes_shares: number;
    no_shares: number;
    current_value: number;
    total_spent: number;
    profit_loss: number;
    probability?: number;
    market?: Market;
    answer?: Answer;
}
export interface MarketProbHistory {
    id: string;
    market_id: string;
    probability: number;
    pool_yes: number;
    pool_no: number;
    total_volume?: number;
    recorded_at: Date;
}
export type LimitOrderStatus = 'pending' | 'filled' | 'cancelled';
export interface LimitOrder {
    id: string;
    user_id: string;
    market_id: string;
    outcome: BetOutcome;
    amount: number;
    limit_prob: number;
    filled_amount: number;
    status: LimitOrderStatus;
    created_at: Date;
    expires_at?: Date;
    filled_at?: Date;
    cancelled_at?: Date;
}
export type TransactionType = 'bet' | 'resolution' | 'bonus' | 'withdrawal' | 'deposit' | 'fee';
export interface Transaction {
    id: string;
    user_id?: string;
    market_id?: string;
    bet_id?: string;
    type: TransactionType;
    amount: number;
    balance_after: number;
    description?: string;
    created_at: Date;
}
export interface MarketResolution {
    id: string;
    market_id: string;
    resolved_by?: string;
    result: 'YES' | 'NO';
    explanation?: string;
    total_yes_payout: number;
    total_no_payout: number;
    unclaimed_balance: number;
    created_at: Date;
}
export interface MarketComment {
    id: string;
    user_id?: string;
    market_id: string;
    content: string;
    likes: number;
    created_at: Date;
    updated_at: Date;
    deleted_at?: Date;
}
export interface UserFollowsMarket {
    user_id: string;
    market_id: string;
    created_at: Date;
}
export interface MarketWithProbability extends Market {
    current_probability: number;
}
export interface UserPortfolioSummary {
    user_id: string;
    total_markets: number;
    total_yes_shares: number;
    total_no_shares: number;
    portfolio_value: number;
    total_invested: number;
    total_profit_loss: number;
}
export interface MarketLeaderboardEntry {
    market_id: string;
    user_id: string;
    name: string;
    bet_count: number;
    total_invested: number;
    total_shares: number;
    last_bet_at: Date;
}
export interface CpmmState {
    pool: {
        YES: number;
        NO: number;
    };
    p: number;
    collectedFees: {
        creator: number;
        liquidity: number;
    };
}
export interface BetCalculationResult {
    shares: number;
    probBefore: number;
    probAfter: number;
    newPool: {
        YES: number;
        NO: number;
    };
    fees: number;
    amount: number;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: string;
}
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
//# sourceMappingURL=database.d.ts.map