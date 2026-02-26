/**
 * CPMM (Constant Product Market Maker)
 *
 * Mathematical model for Vatici prediction markets
 * Based on: Manifold Markets implementation
 *
 * Invariant: k = pool_yes^p × pool_no^(1-p) = constant
 * For binary markets (p=0.5): k = sqrt(pool_yes × pool_no)
 */
export interface CpmmPool {
    YES: number;
    NO: number;
}
export interface CpmmState {
    pool: CpmmPool;
    p: number;
    collectedFees: {
        creator: number;
        liquidity: number;
    };
}
export interface BetResult {
    shares: number;
    probBefore: number;
    probAfter: number;
    newPool: CpmmPool;
    fees: number;
    amount: number;
}
/**
 * Calculate current probability from pool state
 *
 * Formula: P(YES) = (p × NO) / ((1-p) × YES + p × NO)
 *
 * For p=0.5 (binary): P(YES) = NO / (YES + NO)
 *
 * @param pool Current pool state {YES, NO}
 * @param p Weighting parameter (0.0 to 1.0)
 * @returns Probability of YES (0.0 to 1.0)
 */
export declare function getCpmmProbability(pool: CpmmPool, p: number): number;
/**
 * Calculate shares received for a given bet amount
 *
 * Uses the constant product invariant:
 * k = YES^p × NO^(1-p) = constant
 *
 * For p=0.5:
 * shares = YES + X - (k × (X + NO)^-0.5)^2
 *
 * @param pool Current pool state
 * @param p Weighting parameter
 * @param betAmount Bet amount in cents
 * @param outcome 'YES' or 'NO'
 * @returns Shares received
 */
export declare function calculateCpmmShares(pool: CpmmPool, p: number, betAmount: number, outcome: 'YES' | 'NO'): number;
/**
 * Calculate trading fees using iterative method
 *
 * Fees are based on:
 * - Number of shares
 * - Average probability of the bet
 * - Taker fee rate
 *
 * Uses iteration to converge on final fee
 *
 * @param state Current CPMM state
 * @param betAmount Bet amount before fees
 * @param outcome Outcome being bought
 * @returns { remainingBet, totalFees }
 */
export declare function getCpmmFees(state: CpmmState, betAmount: number, outcome: 'YES' | 'NO'): {
    remainingBet: number;
    totalFees: number;
};
/**
 * Calculate complete bet result including pool update
 *
 * Steps:
 * 1. Calculate fees
 * 2. Calculate shares
 * 3. Update pool
 * 4. Calculate new probability
 *
 * @param state Current CPMM state
 * @param betAmount Bet amount (before fees)
 * @param outcome YES or NO
 * @returns Complete bet result including new pool
 */
export declare function calculateCpmmPurchase(state: CpmmState, betAmount: number, outcome: 'YES' | 'NO'): {
    shares: number;
    newPool: CpmmPool;
    newP: number;
    fees: number;
    amount: number;
    probBefore: number;
    probAfter: number;
};
/**
 * Verify that pool maintains CPMM invariant
 *
 * Invariant: k = YES^p × NO^(1-p) = constant
 *
 * @param oldPool Previous pool state
 * @param newPool Updated pool state
 * @param p Weighting parameter
 * @returns true if invariant is maintained (within EPSILON)
 */
export declare function validatePoolInvariant(oldPool: CpmmPool, newPool: CpmmPool, p: number): boolean;
/**
 * Check if probability is within valid range
 */
export declare function isValidProbability(prob: number): boolean;
/**
 * Clamp probability to valid range
 */
export declare function clampProbability(prob: number): number;
/**
 * Get the NO price (for displaying to users)
 * For binary market: NO prob = 1 - YES prob
 */
export declare function getNoProbability(pool: CpmmPool, p: number): number;
/**
 * Format probability as percentage for display
 */
export declare function formatProbability(prob: number, decimals?: number): string;
/**
 * Format amount in cents to currency string
 */
export declare function formatCurrency(cents: number): string;
export declare const CPMM_CONFIG: {
    EPSILON: number;
    MAX_CPMM_PROB: number;
    MIN_CPMM_PROB: number;
    TAKER_FEE_RATE: number;
    FEE_ITERATIONS: number;
};
/**
 * EXAMPLE 1: Binary Market - Calculate Bet Result
 *
 * Market: "Will it rain tomorrow?"
 * Pool: YES=100,000, NO=100,000
 * User bets: 1,000 on YES
 *
 * Expected:
 * - Probability before: 0.50 (50%)
 * - Probability after: ~0.52 (52%)
 * - Shares received: ~18
 * - Fees: ~40 (2%)
 * - Remaining bet: ~960
 *
 * Usage:
 * ```
 * const state: CpmmState = {
 *   pool: { YES: 100000, NO: 100000 },
 *   p: 0.5,
 *   collectedFees: { creator: 0, liquidity: 0 }
 * }
 *
 * const result = calculateCpmmPurchase(state, 1000, 'YES')
 * console.log(`Shares: ${result.shares}`)
 * console.log(`Prob before: ${formatProbability(result.probBefore)}`)
 * console.log(`Prob after: ${formatProbability(result.probAfter)}`)
 * console.log(`Fees: ${formatCurrency(result.fees)}`)
 * ```
 */
/**
 * EXAMPLE 2: Multiple Bets - Pool Update
 *
 * Scenario: Series of bets on same market
 *
 * ```
 * let state: CpmmState = {
 *   pool: { YES: 100000, NO: 100000 },
 *   p: 0.5,
 *   collectedFees: { creator: 0, liquidity: 0 }
 * }
 *
 * // User 1 bets 1000 on YES
 * let result1 = calculateCpmmPurchase(state, 1000, 'YES')
 * state.pool = result1.newPool
 * state.collectedFees.creator += result1.fees * 0.5
 *
 * // User 2 bets 500 on NO
 * let result2 = calculateCpmmPurchase(state, 500, 'NO')
 * state.pool = result2.newPool
 * state.collectedFees.creator += result2.fees * 0.5
 *
 * // Market probability after 2 bets
 * const finalProb = getCpmmProbability(state.pool, state.p)
 * ```
 */
//# sourceMappingURL=cpmm.d.ts.map