"use strict";
/**
 * CPMM (Constant Product Market Maker)
 *
 * Mathematical model for Vatici prediction markets
 * Based on: Manifold Markets implementation
 *
 * Invariant: k = pool_yes^p × pool_no^(1-p) = constant
 * For binary markets (p=0.5): k = sqrt(pool_yes × pool_no)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CPMM_CONFIG = void 0;
exports.getCpmmProbability = getCpmmProbability;
exports.calculateCpmmShares = calculateCpmmShares;
exports.getCpmmFees = getCpmmFees;
exports.calculateCpmmPurchase = calculateCpmmPurchase;
exports.validatePoolInvariant = validatePoolInvariant;
exports.isValidProbability = isValidProbability;
exports.clampProbability = clampProbability;
exports.getNoProbability = getNoProbability;
exports.formatProbability = formatProbability;
exports.formatCurrency = formatCurrency;
// ============================================
// CONSTANTS & CONFIG
// ============================================
const EPSILON = 1e-4; // For floating point comparisons (relaxed for numerical precision)
const MAX_CPMM_PROB = 0.999;
const MIN_CPMM_PROB = 0.001;
const TAKER_FEE_RATE = 0.02; // 2% fee
const FEE_ITERATIONS = 10; // Iterations to converge on fee
// ============================================
// 1. CALCULATE PROBABILITY
// ============================================
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
function getCpmmProbability(pool, p) {
    const { YES, NO } = pool;
    if (YES + NO === 0) {
        return 0.5; // Default if empty pool
    }
    const numerator = p * NO;
    const denominator = (1 - p) * YES + p * NO;
    if (denominator === 0) {
        return 0.5;
    }
    const prob = numerator / denominator;
    // Clamp to valid range
    return Math.max(MIN_CPMM_PROB, Math.min(MAX_CPMM_PROB, prob));
}
// ============================================
// 2. CALCULATE SHARES (Core CPMM Formula)
// ============================================
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
function calculateCpmmShares(pool, p, betAmount, outcome) {
    if (betAmount === 0)
        return 0;
    const { YES: y, NO: n } = pool;
    if (y <= 0 || n <= 0) {
        throw new Error('Invalid pool state: YES and NO must be positive');
    }
    // Calculate invariant k
    const k = Math.pow(y, p) * Math.pow(n, 1 - p);
    if (outcome === 'YES') {
        // Wolfram Alpha: (y-s)^p * (n+b)^(1-p) = k, solve s
        // Result: s = (y + b) - (k * (b + n)^(p-1))^(1/p)
        const newN = n + betAmount;
        const term = Math.pow(k * Math.pow(newN, p - 1), 1 / p);
        const shares = (y + betAmount) - term;
        if (shares < 0) {
            throw new Error(`Invalid bet amount: received negative shares (${shares})`);
        }
        return shares;
    }
    else {
        // For NO: s = (n + b) - (k * (b + y)^-p)^(1/(1-p))
        const newY = y + betAmount;
        const term = Math.pow(k * Math.pow(newY, -p), 1 / (1 - p));
        const shares = (n + betAmount) - term;
        if (shares < 0) {
            throw new Error(`Invalid bet amount: received negative shares (${shares})`);
        }
        return shares;
    }
}
// ============================================
// 3. CALCULATE FEES (Iterative)
// ============================================
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
function getCpmmFees(state, betAmount, outcome) {
    if (betAmount === 0) {
        return { remainingBet: 0, totalFees: 0 };
    }
    let fee = 0;
    // Iterative approach: refine fee estimate
    for (let i = 0; i < FEE_ITERATIONS; i++) {
        const betAfterFee = betAmount - fee;
        const shares = calculateCpmmShares(state.pool, state.p, betAfterFee, outcome);
        const averageProb = betAfterFee / shares;
        // Fee = shares × averageProb × takerFeeRate
        fee = shares * averageProb * TAKER_FEE_RATE;
    }
    const totalFees = betAmount === 0 ? 0 : Math.round(fee); // Round to nearest cent
    const remainingBet = betAmount - totalFees;
    return { remainingBet, totalFees };
}
// ============================================
// 4. CALCULATE PURCHASE (Update Pool)
// ============================================
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
function calculateCpmmPurchase(state, betAmount, outcome) {
    // 1. Calculate fees
    const { remainingBet, totalFees } = getCpmmFees(state, betAmount, outcome);
    // 2. Calculate shares
    const shares = calculateCpmmShares(state.pool, state.p, remainingBet, outcome);
    // 3. Calculate probability before bet
    const probBefore = getCpmmProbability(state.pool, state.p);
    // 4. Update pool using invariant
    // From shares formula derivation, the pool update that maintains invariant is:
    // newPool computed such that invariant k = YES^p * NO^(1-p) is preserved
    const { YES: y, NO: n } = state.pool;
    const k = Math.pow(y, state.p) * Math.pow(n, 1 - state.p);
    let newPool;
    if (outcome === 'YES') {
        // For YES bet: new pool such that (newY)^p * (newN)^(1-p) = k where newN = n + remainingBet
        const newN = n + remainingBet;
        const newY = Math.pow(k / Math.pow(newN, 1 - state.p), 1 / state.p);
        newPool = {
            YES: newY,
            NO: newN
        };
    }
    else {
        // For NO bet: new pool such that (newY)^p * (newN)^(1-p) = k where newY = y + remainingBet
        const newY = y + remainingBet;
        const newN = Math.pow(k / Math.pow(newY, state.p), 1 / (1 - state.p));
        newPool = {
            YES: newY,
            NO: newN
        };
    }
    // 5. Calculate probability after
    const probAfter = getCpmmProbability(newPool, state.p);
    return {
        shares,
        newPool,
        newP: state.p, // p doesn't change for binary markets
        fees: totalFees,
        amount: remainingBet,
        probBefore,
        probAfter
    };
}
// ============================================
// 5. VALIDATE POOL INVARIANT
// ============================================
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
function validatePoolInvariant(oldPool, newPool, p) {
    const k_old = Math.pow(oldPool.YES, p) * Math.pow(oldPool.NO, 1 - p);
    const k_new = Math.pow(newPool.YES, p) * Math.pow(newPool.NO, 1 - p);
    // Allow small rounding errors (relative tolerance)
    const relativeError = Math.abs(k_new - k_old) / Math.max(Math.abs(k_old), 1);
    return relativeError < EPSILON;
}
// ============================================
// HELPER FUNCTIONS
// ============================================
/**
 * Check if probability is within valid range
 */
function isValidProbability(prob) {
    return prob >= MIN_CPMM_PROB && prob <= MAX_CPMM_PROB;
}
/**
 * Clamp probability to valid range
 */
function clampProbability(prob) {
    return Math.max(MIN_CPMM_PROB, Math.min(MAX_CPMM_PROB, prob));
}
/**
 * Get the NO price (for displaying to users)
 * For binary market: NO prob = 1 - YES prob
 */
function getNoProbability(pool, p) {
    const yesProbability = getCpmmProbability(pool, p);
    return 1 - yesProbability;
}
/**
 * Format probability as percentage for display
 */
function formatProbability(prob, decimals = 1) {
    return `${(prob * 100).toFixed(decimals)}%`;
}
/**
 * Format amount in cents to currency string
 */
function formatCurrency(cents) {
    const dollars = cents / 100;
    return `$${dollars.toFixed(2)}`;
}
// ============================================
// CONFIGURATION
// ============================================
exports.CPMM_CONFIG = {
    EPSILON,
    MAX_CPMM_PROB,
    MIN_CPMM_PROB,
    TAKER_FEE_RATE,
    FEE_ITERATIONS,
};
// ============================================
// EXAMPLES & DOCUMENTATION
// ============================================
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
//# sourceMappingURL=cpmm.js.map