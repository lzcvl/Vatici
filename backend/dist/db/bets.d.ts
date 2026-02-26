/**
 * Betting Database Queries
 *
 * Bet placement logic:
 * 1. Verify user balance
 * 2. Verify market/answer exists
 * 3. Calculate CPMM result
 * 4-8. Execute updates (database constraints ensure atomicity)
 */
import type { DbBet } from '../mappers';
/**
 * Place a bet
 *
 * @param betData - Bet details
 * @returns Bet ID if successful
 * @throws Error with code like INSUFFICIENT_BALANCE, MARKET_NOT_FOUND_OR_CLOSED
 */
export declare function placeBet(betData: {
    userId: string;
    marketId: string;
    answerId?: string;
    direction: 'YES' | 'NO';
    amount: number;
}): Promise<string>;
/**
 * Get user's bets
 */
export declare function getUserBets(userId: string, limit?: number): Promise<DbBet[]>;
/**
 * Get market bets
 */
export declare function getMarketBets(marketId: string, limit?: number): Promise<DbBet[]>;
//# sourceMappingURL=bets.d.ts.map