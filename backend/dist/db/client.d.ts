/**
 * Neon PostgreSQL Client
 *
 * Single instance for all database queries.
 * Uses unpooled connection for transactions (pgBouncer doesn't support
 * multi-statement transactions in transaction mode).
 */
import { type NeonQueryFunction } from '@neondatabase/serverless';
/**
 * Main SQL client for queries.
 * Uses unpooled connection to support transactions.
 */
export declare const sql: NeonQueryFunction<false, false>;
/**
 * Test the connection
 */
export declare function testConnection(): Promise<boolean>;
/**
 * Health check function
 */
export declare function healthCheck(): Promise<{
    status: 'ok' | 'error';
}>;
//# sourceMappingURL=client.d.ts.map