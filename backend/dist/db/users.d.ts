/**
 * User Database Queries
 *
 * Replaces mock-users.ts for real database access.
 */
export interface DbUser {
    id: string;
    name: string;
    email: string;
    password_hash: string;
}
/**
 * Find user by email
 * Used by NextAuth credentials provider and backend auth checks
 */
export declare function findUserByEmail(email: string): Promise<DbUser | null>;
/**
 * Create new user with email verification
 * Also creates the user_balances record (default balance: 1,000,000 cents = R$10,000)
 */
export declare function createUser(data: {
    name: string;
    email: string;
    passwordHash: string;
}): Promise<DbUser>;
/**
 * Find user by ID (for session reconstruction)
 */
export declare function findUserById(id: string): Promise<DbUser | null>;
/**
 * Get user balance
 */
export declare function getUserBalance(userId: string): Promise<number>;
//# sourceMappingURL=users.d.ts.map