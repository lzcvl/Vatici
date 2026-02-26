"use strict";
/**
 * User Database Queries
 *
 * Replaces mock-users.ts for real database access.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserByEmail = findUserByEmail;
exports.createUser = createUser;
exports.findUserById = findUserById;
exports.getUserBalance = getUserBalance;
const client_1 = require("./client");
/**
 * Find user by email
 * Used by NextAuth credentials provider and backend auth checks
 */
async function findUserByEmail(email) {
    try {
        const rows = (await (0, client_1.sql) `
      SELECT id, name, email, password_hash
      FROM users
      WHERE LOWER(email) = LOWER(${email})
      AND deleted_at IS NULL
      LIMIT 1
    `);
        return rows[0] || null;
    }
    catch (err) {
        console.error('findUserByEmail error:', err);
        throw err;
    }
}
/**
 * Create new user with email verification
 * Also creates the user_balances record (default balance: 1,000,000 cents = R$10,000)
 */
async function createUser(data) {
    try {
        // Insert user
        const userRows = (await (0, client_1.sql) `
      INSERT INTO users (name, email, password_hash)
      VALUES (${data.name}, LOWER(${data.email}), ${data.passwordHash})
      RETURNING id, name, email, password_hash
    `);
        const user = userRows[0];
        if (!user)
            throw new Error('Failed to create user');
        // Create initial balance entry (1M cents = R$10,000)
        await (0, client_1.sql) `
      INSERT INTO user_balances (user_id, balance)
      VALUES (${user.id}, 1000000)
      ON CONFLICT (user_id) DO NOTHING
    `;
        return user;
    }
    catch (err) {
        console.error('createUser error:', err);
        throw err;
    }
}
/**
 * Find user by ID (for session reconstruction)
 */
async function findUserById(id) {
    try {
        const rows = (await (0, client_1.sql) `
      SELECT id, name, email, password_hash
      FROM users
      WHERE id = ${id}
      AND deleted_at IS NULL
      LIMIT 1
    `);
        return rows[0] || null;
    }
    catch (err) {
        console.error('findUserById error:', err);
        throw err;
    }
}
/**
 * Get user balance
 */
async function getUserBalance(userId) {
    try {
        const rows = (await (0, client_1.sql) `
      SELECT balance
      FROM user_balances
      WHERE user_id = ${userId}
      LIMIT 1
    `);
        return rows[0]?.balance ?? 0;
    }
    catch (err) {
        console.error('getUserBalance error:', err);
        throw err;
    }
}
//# sourceMappingURL=users.js.map