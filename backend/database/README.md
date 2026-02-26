# 📊 Vatici Database Schema

## Overview

This is the PostgreSQL schema for Vatici prediction markets using the **CPMM (Constant Product Market Maker)** model.

All amounts are stored in **cents** (as `BIGINT`) to avoid floating-point issues.

---

## Table Structure

### 1. **users** - User Accounts
```
- id (UUID) - Primary key
- email, name, password_hash
- avatar_url, bio
- is_verified, created_at, updated_at, last_login_at
- deleted_at (soft delete)
```

**Indexes:**
- `email` - For login/registration
- `created_at DESC` - For sorting

---

### 2. **user_balances** - User Wallet Balance
```
- id (UUID)
- user_id (UUID) - ONE-TO-ONE with users
- balance (BIGINT) - In cents
- total_earned, total_spent (BIGINT)
- updated_at (TIMESTAMP)
```

**Purpose:** Store current balance separately for faster queries

**Indexes:**
- `user_id UNIQUE` - One balance per user

---

### 3. **markets** - Prediction Markets/Contracts
```
- id (UUID)
- creator_id (UUID) - Who created this market
- question, description, category

-- CPMM State
- pool_yes (BIGINT) - In cents
- pool_no (BIGINT) - In cents
- p (DECIMAL 0-1) - Weighting parameter, default 0.5

-- Fees collected (shared/burned)
- collected_fees_creator (BIGINT)
- collected_fees_liquidity (BIGINT)

-- Status
- status (VARCHAR) - open | closed | resolved
- closes_at (TIMESTAMP)
- resolved_at, resolution_result ('YES'|'NO'|null)

-- Stats
- total_volume (BIGINT) - Sum of all bets
- unique_bettors (INT)

-- UI
- icon_url, is_trending, view_count
- created_at, updated_at
```

**Indexes:**
- `creator_id` - Markets by creator
- `status` - Find open/closed markets
- `closes_at` - Find expiring markets
- `created_at DESC` - For sorting
- `is_trending` - Trending filter
- `question` - Full text search

---

### 4. **bets** - All Trades/Bets
```
- id (UUID)
- user_id, market_id (UUID)

-- Trade Details
- outcome ('YES'|'NO')
- amount (BIGINT) - Investment in cents
- shares (BIGINT) - Shares received

-- Probability tracking
- prob_before, prob_after (DECIMAL 0-1)

-- Fee tracking
- fees (BIGINT) - In cents

-- Status
- is_filled (BOOLEAN)
- is_cancelled (BOOLEAN)
- is_redemption (BOOLEAN)

- created_at, updated_at
```

**Indexes:**
- `user_id` - User's bets
- `market_id` - Market's bets
- `user_id, market_id` - User's bets on specific market
- `created_at DESC` - For sorting
- `outcome` - Filter by YES/NO

**Constraints:**
- `outcome IN ('YES', 'NO')`

---

### 5. **user_positions** - Current Holdings
```
- id (UUID)
- user_id, market_id (UUID)

-- Holdings
- yes_shares (BIGINT)
- no_shares (BIGINT)

-- Computed value
- current_value (BIGINT) - In cents

-- Stats
- total_spent (BIGINT) - Total invested
- profit_loss (BIGINT) - Current P&L

UNIQUE (user_id, market_id)
```

**Purpose:** Cache user's current position in each market

**Updated by:**
- Triggers when new bet is placed
- Or recomputed on query if needed

---

### 6. **market_prob_history** - Probability Timeline
```
- id (UUID)
- market_id (UUID)

-- Snapshot
- probability (DECIMAL 0-1)
- pool_yes, pool_no (BIGINT)
- total_volume (BIGINT)
- recorded_at (TIMESTAMP)
```

**Purpose:** Track probability changes for charts/analysis

**When Updated:**
- After every bet (optional: sample every 10 bets for performance)

---

### 7. **limit_orders** - Limit Orders (Optional)
```
- id (UUID)
- user_id, market_id (UUID)

-- Order Details
- outcome ('YES'|'NO')
- amount (BIGINT) - In cents
- limit_prob (DECIMAL 0-1) - Will buy/sell at this price or better

-- Execution
- filled_amount (BIGINT)
- status ('pending'|'filled'|'cancelled')

- created_at, expires_at
- filled_at, cancelled_at
```

**Purpose:** Support limit orders for MVP+ (optional for MVP)

---

### 8. **transactions** - Financial Audit Trail
```
- id (UUID)
- user_id, market_id, bet_id (UUID, optional)

-- Transaction Type
- type - 'bet', 'resolution', 'bonus', 'withdrawal', 'deposit', 'fee'
- amount (BIGINT) - Signed: +/- in cents

-- Audit
- balance_after (BIGINT) - Balance after this transaction
- description (VARCHAR)
- created_at (TIMESTAMP)
```

**Purpose:** Complete audit trail of all financial transactions

**Indexes:**
- `user_id` - User's transaction history
- `type` - Filter by type
- `created_at DESC` - Most recent first

---

### 9. **market_resolutions** - Resolution Details
```
- id (UUID)
- market_id (UUID) - UNIQUE
- resolved_by (UUID)

-- Resolution
- result ('YES'|'NO')
- explanation (TEXT)

-- Payout tracking
- total_yes_payout (BIGINT)
- total_no_payout (BIGINT)
- unclaimed_balance (BIGINT)

- created_at (TIMESTAMP)
```

**Purpose:** Store resolution details and payout tracking

---

### 10. **market_comments** - Comments/Discussion
```
- id (UUID)
- user_id, market_id (UUID)

-- Content
- content (TEXT)
- likes (INT)

- created_at, updated_at
- deleted_at (soft delete)
```

**Purpose:** Community discussion on markets

---

### 11. **user_follows_market** - Market Follows
```
- user_id, market_id (UUID)

PRIMARY KEY (user_id, market_id)
- created_at (TIMESTAMP)
```

**Purpose:** Users can follow/watch markets

---

## Views (Useful Queries)

### 1. **market_with_probability**
Returns market with calculated current probability:
```sql
SELECT *,
       CAST(pool_no / (pool_yes + pool_no) AS DECIMAL) as current_probability
FROM markets
```

### 2. **user_portfolio_summary**
Portfolio stats for a user:
```sql
SELECT user_id,
       COUNT(DISTINCT market_id) as total_markets,
       SUM(yes_shares) as total_yes_shares,
       SUM(no_shares) as total_no_shares,
       SUM(current_value) as portfolio_value,
       SUM(profit_loss) as total_profit_loss
FROM user_positions
```

### 3. **market_leaderboard**
Top bettors on a market:
```sql
SELECT market_id, user_id, name,
       COUNT(*) as bet_count,
       SUM(amount) as total_invested,
       MAX(created_at) as last_bet_at
FROM bets
GROUP BY market_id, user_id
```

---

## Important Notes

### 1. **All Amounts in Cents**
Always store monetary values as BIGINT (cents):
```typescript
// User has $100.50
balance = 10050 // cents

// Bet of $25.00
bet.amount = 2500 // cents
```

### 2. **CPMM Pool Invariant**
The pool must satisfy:
```
k = pool_yes^p × pool_no^(1-p) = constant
```

For p=0.5 (binary markets):
```
k = sqrt(pool_yes × pool_no)
```

After every bet, verify this invariant (allowing small rounding errors):
```typescript
const k = Math.pow(pool.YES, p) * Math.pow(pool.NO, 1 - p)
const k_after = Math.pow(newPool.YES, p) * Math.pow(newPool.NO, 1 - p)

if (Math.abs(k - k_after) > EPSILON) {
  throw new Error("Pool invariant violated!")
}
```

### 3. **Transactions are Atomic**
When placing a bet, all must succeed together:
- Debit user balance
- Create bet record
- Update market pool
- Record transaction
- Update user position

Use database transactions:
```typescript
await db.transaction(async (trx) => {
  // All queries here are atomic
})
```

### 4. **No Negative Balances**
Always validate before allowing bets:
```typescript
if (userBalance < betAmount) {
  throw new Error("Insufficient balance")
}
```

### 5. **Soft Deletes**
Use `deleted_at` for soft deletes:
```sql
SELECT * FROM users WHERE deleted_at IS NULL
```

---

## Setup Instructions

### 1. Create Database
```bash
createdb vatici
```

### 2. Run Schema
```bash
psql vatici < backend/database/schema.sql
```

### 3. Run Migrations (if using migration system)
```bash
npm run db:migrate
```

### 4. Seed Sample Data
```bash
psql vatici < backend/database/seeds.sql
```

---

## Performance Considerations

### Query Optimization
- Use indexes for filtering, sorting, joins
- Avoid `SELECT *` - select only needed columns
- Use views for complex aggregations

### Caching
- Cache `user_balances` in memory (refresh on transaction)
- Cache `market_with_probability` view (refresh after each bet)
- Cache leaderboard (refresh every minute)

### Pagination
Always paginate when fetching lists:
```typescript
const limit = 50
const offset = (page - 1) * limit
SELECT * FROM markets LIMIT limit OFFSET offset
```

---

## Future Enhancements

- [ ] Add `market_categories` table (normalize)
- [ ] Add `user_notifications` table
- [ ] Add `dispute_resolution` table
- [ ] Add `market_liquidity` table
- [ ] Add partitioning for high-volume tables (`bets`, `transactions`)
- [ ] Add read replicas for analytics queries

---

## Troubleshooting

### "Pool invariant violated"
This shouldn't happen. If it does:
1. Check fee calculations
2. Check rounding in share calculations
3. Look for floating-point errors

### "Race condition on balance"
Always use:
```sql
UPDATE user_balances
SET balance = balance - :amount
WHERE user_id = :id AND balance >= :amount
```

### Slow probability history query
Add pagination:
```sql
SELECT * FROM market_prob_history
WHERE market_id = :id
ORDER BY recorded_at DESC
LIMIT 100
```
