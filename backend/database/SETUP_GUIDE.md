# 🚀 Database Setup Guide

## Overview

Complete PostgreSQL schema for Vatici prediction markets (CPMM model).

All files created in `/backend/database/`:

```
database/
├── schema.sql                 # Full schema (all tables, views, functions)
├── README.md                  # Detailed schema documentation
├── SCHEMA_VISUAL.md          # ERD and relationships diagram
├── SETUP_GUIDE.md            # This file
├── queries.sql               # Common SQL queries (coming soon)
└── migrations/
    └── 001_initial_schema.sql # Migration file (idempotent)
```

---

## Quick Start (5 minutes)

### 1. Create Database
```bash
createdb vatici
```

### 2. Run Schema
```bash
# Option A: Direct SQL file
psql vatici -f backend/database/migrations/001_initial_schema.sql

# Option B: Using psql
psql vatici < backend/database/migrations/001_initial_schema.sql
```

### 3. Verify Installation
```bash
# Connect to database
psql vatici

# List all tables
\dt

# List all views
\dv

# Verify users table exists
\d users

# Exit
\q
```

✅ **Done!** Database is ready.

---

## Detailed Setup

### 1. PostgreSQL Installation

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download from https://www.postgresql.org/download/windows/

### 2. Create Database & User

```bash
# Connect as superuser
psql -U postgres

# Create database
CREATE DATABASE vatici OWNER postgres;

# Create app user (optional, for production)
CREATE USER vatici_app WITH PASSWORD 'secure_password_here';
GRANT CONNECT ON DATABASE vatici TO vatici_app;
GRANT USAGE ON SCHEMA public TO vatici_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO vatici_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO vatici_app;

# Exit
\q
```

### 3. Run Migrations

```bash
# Single file (includes all tables)
psql vatici -f backend/database/migrations/001_initial_schema.sql

# Or using migration tool (if using knex/typeorm)
npm run db:migrate
```

### 4. Seed Sample Data (Optional)

```bash
psql vatici << EOF
-- Create test user
INSERT INTO users (email, name, password_hash)
VALUES ('test@example.com', 'Test User', 'hashed_password');

-- Create sample market
INSERT INTO markets (
  creator_id, question, category, closes_at
) VALUES (
  (SELECT id FROM users LIMIT 1),
  'Will Bitcoin exceed $100k by end of 2024?',
  'crypto',
  CURRENT_TIMESTAMP + INTERVAL '30 days'
);

-- Create sample balance
INSERT INTO user_balances (user_id, balance)
VALUES ((SELECT id FROM users LIMIT 1), 1000000);
EOF
```

### 5. Verify Data

```bash
psql vatici << EOF
-- Check users
SELECT * FROM users;

-- Check markets
SELECT * FROM markets;

-- Check views
SELECT * FROM market_with_probability;

-- Check user balances
SELECT * FROM user_balances;
EOF
```

---

## Files Explanation

### 📄 schema.sql
Complete schema with:
- ✅ 11 tables
- ✅ 3 views
- ✅ Triggers for `updated_at`
- ✅ Indexes for performance
- ✅ Constraints for data integrity

**Use:** One-time setup, reference documentation

### 📄 migrations/001_initial_schema.sql
Idempotent migration file:
- ✅ Uses `CREATE TABLE IF NOT EXISTS`
- ✅ Uses `DROP IF EXISTS` for triggers/views
- ✅ Wrapped in `BEGIN; COMMIT;`
- ✅ Can be run multiple times safely

**Use:** Version control, automated deployments

### 📄 README.md
Comprehensive documentation:
- Table structure and columns
- Purpose of each table
- Indexes and performance tips
- Important notes
- Setup instructions

**Use:** Understanding the schema design

### 📄 SCHEMA_VISUAL.md
Visual guides:
- Entity Relationship Diagram (ERD)
- Table relationships
- Data flow example
- Constraints and types

**Use:** Quick reference, visual learners

### 📖 SETUP_GUIDE.md
This file - step-by-step setup.

---

## Key Tables Summary

| Table | Purpose | Rows (Est.) |
|-------|---------|-----------|
| `users` | User accounts | 1,000 |
| `user_balances` | Current balance (1:1 with users) | 1,000 |
| `markets` | Prediction markets | 10,000 |
| `bets` | Individual trades | 100,000 |
| `user_positions` | Current holdings (user × market) | 10,000 |
| `market_prob_history` | Probability timeline | 1,000,000 |
| `transactions` | Financial audit | 100,000 |
| `limit_orders` | Limit orders (future) | 10,000 |
| `market_resolutions` | Resolution details | 100 |
| `market_comments` | Comments/discussion | 10,000 |
| `user_follows_market` | Follows | 5,000 |

---

## Important: All Amounts in CENTS

Always work with amounts as **integers (cents)**, not floats:

```typescript
// ✅ CORRECT
balance = 10050        // $100.50
bet = 2500             // $25.00
pool_yes = 1000000     // $10,000.00

// ❌ WRONG
balance = 100.50       // Float - causes precision issues!
bet = 25.00            // Float - causes rounding errors!
```

When displaying to users, divide by 100:
```typescript
displayBalance = balance / 100  // 10050 / 100 = $100.50
```

When receiving from users, multiply by 100:
```typescript
userInput = "25"              // $25.00
storedAmount = parseInt(userInput) * 100  // 2500 cents
```

---

## CPMM Pool Invariant

The mathematical guarantee:
```
k = pool_yes^p × pool_no^(1-p) = constant
```

For binary markets (p = 0.5):
```
k = sqrt(pool_yes × pool_no)
```

**Must verify after every bet:**
```sql
-- Example: market_id = 'abc-123'
SELECT
  pool_yes,
  pool_no,
  p,
  POWER(pool_yes, p) * POWER(pool_no, 1-p) as k
FROM markets
WHERE id = 'abc-123';
```

---

## Connection Strings

### Local Development
```
postgresql://postgres:password@localhost:5432/vatici
```

### Environment Variables (.env)
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/vatici
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vatici
DB_USER=postgres
DB_PASSWORD=password
```

### Node.js/Express Connection
```typescript
import pg from 'pg'

const client = new pg.Client({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
})

await client.connect()
```

### TypeORM Configuration
```typescript
// ormconfig.ts
import { DataSource } from 'typeorm'

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: ['src/entities/**/*.ts'],
  migrations: ['src/migrations/**/*.ts'],
  synchronize: false,
  logging: true,
})
```

---

## Testing the Connection

### Via psql
```bash
psql -h localhost -U postgres -d vatici -c "SELECT version();"
```

### Via Node.js
```typescript
import pg from 'pg'

const client = new pg.Client(process.env.DATABASE_URL)
await client.connect()

const result = await client.query('SELECT NOW()')
console.log(result.rows[0])

await client.end()
```

### Via TypeORM
```typescript
import { AppDataSource } from './ormconfig'

AppDataSource.initialize().then(() => {
  console.log("✅ Database connected")
}).catch(error => {
  console.error("❌ Database error:", error)
})
```

---

## Common Tasks

### Add a New Column
```sql
-- Migration file: 002_add_column.sql
ALTER TABLE markets ADD COLUMN new_field VARCHAR(255);
CREATE INDEX idx_markets_new_field ON markets(new_field);
```

### Add a New Table
```sql
-- Migration file: 003_add_table.sql
CREATE TABLE new_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ...
);
```

### Backup Database
```bash
pg_dump vatici > backup_$(date +%Y%m%d).sql
gzip backup_*.sql
```

### Restore from Backup
```bash
gunzip backup_20260226.sql.gz
psql vatici < backup_20260226.sql
```

### Check Database Size
```bash
psql vatici << EOF
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
EOF
```

---

## Troubleshooting

### Error: "role 'postgres' does not exist"
```bash
# Create default postgres user
sudo -u postgres createuser -s postgres
```

### Error: "database 'vatici' does not exist"
```bash
createdb vatici
```

### Error: "permission denied" on psql
```bash
# Try with explicit user
psql -U postgres vatici
```

### Slow Queries
```sql
-- Enable query logging
SET log_min_duration_statement = 100; -- Log queries taking >100ms

-- Analyze query
EXPLAIN ANALYZE SELECT * FROM bets WHERE market_id = 'abc';

-- Add missing index if needed
CREATE INDEX idx_bets_market_faster ON bets(market_id) WHERE status = 'open';
```

### Connection Pool Issues
```typescript
// Increase pool size for production
const pool = new pg.Pool({
  max: 20,        // Default 10
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})
```

---

## Security (Production)

### 1. Use Strong Password
```sql
CREATE USER vatici_app WITH PASSWORD 'very_strong_password_123!@#';
```

### 2. Restrict Permissions
```sql
-- Create app user with limited permissions
CREATE USER vatici_app WITH PASSWORD 'xxx';
GRANT CONNECT ON DATABASE vatici TO vatici_app;
GRANT USAGE ON SCHEMA public TO vatici_app;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO vatici_app;
REVOKE DELETE ON ALL TABLES IN SCHEMA public FROM vatici_app;
```

### 3. Enable SSL Connections
```postgresql
# /etc/postgresql/15/main/postgresql.conf
ssl = on
ssl_cert_file = '/etc/ssl/certs/server.crt'
ssl_key_file = '/etc/ssl/private/server.key'
```

### 4. Backup Encryption
```bash
# Encrypt backup
pg_dump vatici | gzip | gpg --encrypt > backup.sql.gz.gpg

# Decrypt and restore
gpg --decrypt backup.sql.gz.gpg | gunzip | psql vatici
```

---

## Next Steps

1. ✅ Create database (this guide)
2. ⏭️ Implement CPMM math functions (`backend/src/lib/cpmm.ts`)
3. ⏭️ Create models/types (`backend/src/models/`)
4. ⏭️ Implement API handlers (`backend/src/handlers/`)
5. ⏭️ Write integration tests

---

## Files Created

✅ `/backend/database/schema.sql` - Full schema (reference)
✅ `/backend/database/README.md` - Detailed documentation
✅ `/backend/database/SCHEMA_VISUAL.md` - Visual guides
✅ `/backend/database/SETUP_GUIDE.md` - This file
✅ `/backend/database/migrations/001_initial_schema.sql` - Migration file
✅ `/backend/src/types/database.ts` - TypeScript types

---

## Support

For questions:
- Check `README.md` for table details
- Check `SCHEMA_VISUAL.md` for relationships
- Look at examples in `migrations/001_initial_schema.sql`

Ready to implement the backend math? See `backend/src/lib/cpmm.ts` (next step)
