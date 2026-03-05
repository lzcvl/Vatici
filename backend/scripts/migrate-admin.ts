import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env relative to the script execution path
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('Running schema migrations...');
        await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_ip VARCHAR(45);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_ip VARCHAR(45);
    `);
        console.log('Migration completed successfully: is_banned, registration_ip, last_ip added.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
