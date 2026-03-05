# 📐 Vatici Database Schema - Visual Guide

## Entity Relationship Diagram (ERD)

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                                   DATABASE SCHEMA                                    │
└──────────────────────────────────────────────────────────────────────────────────────┘

                                       ┌─────────────────┐
                                       │     users       │
                                       ├─────────────────┤
                                       │ id (PK)         │
                                       │ email (UNIQUE)  │
                                       │ name            │
                                       │ password_hash   │
                                       │ avatar_url      │
                                       │ bio             │
                                       │ is_verified     │
                                       │ is_banned       │
                                       │ registration_ip │
                                       │ last_ip         │
                                       │ created_at      │
                                       │ updated_at      │
                                       │ last_login_at   │
                                       │ deleted_at      │
                                       └─────────────────┘
                                              │
                          ┌───────────────────┼───────────────────┐
                          │                   │                   │
                          ▼                   ▼                   ▼
             ┌──────────────────────┐ ┌─────────────────┐ ┌──────────────────┐
             │  user_balances       │ │    markets      │ │ user_follows_... │
             ├──────────────────────┤ ├─────────────────┤ ├──────────────────┤
             │ id (PK)              │ │ id (PK)         │ │ user_id (PK)     │
             │ user_id (FK, UNIQUE) │ │ creator_id (FK) │ │ market_id (PK)   │
             │ balance              │ │ question        │ │ created_at       │
             │ total_earned         │ │ category        │ └──────────────────┘
             │ total_spent          │ │ pool_yes        │
             │ updated_at           │ │ pool_no         │
             └──────────────────────┘ │ p (0.0-1.0)     │
                                      │ status          │
                                      │ closes_at       │
                                      │ resolved_at     │
                                      │ resolution_result
                                      │ total_volume    │
                                      │ unique_bettors  │
                                      │ is_trending     │
                                      │ view_count      │
                                      │ created_at      │
                                      │ updated_at      │
                                      └─────────────────┘
                                              │
                          ┌───────────────────┼─────────────────────┬──────────────┐
                          │                   │                     │              │
                          ▼                   ▼                     ▼              ▼
              ┌──────────────────┐ ┌────────────────────┐ ┌──────────────────┐ ┌──────────────┐
              │     bets         │ │ market_prob_...    │ │ user_positions   │ │ market_...   │
              ├──────────────────┤ ├────────────────────┤ ├──────────────────┤ ├──────────────┤
              │ id (PK)          │ │ id (PK)            │ │ id (PK)          │ │ id (PK)      │
              │ user_id (FK)     │ │ market_id (FK)     │ │ user_id (FK)     │ │ market_id (FK)
              │ market_id (FK)   │ │ probability        │ │ market_id (FK)   │ │ resolved_by  │
              │ outcome          │ │ pool_yes           │ │ yes_shares       │ │ result       │
              │ amount           │ │ pool_no            │ │ no_shares        │ │ explanation  │
              │ shares           │ │ total_volume       │ │ current_value    │ │ payouts      │
              │ prob_before      │ │ recorded_at        │ │ total_spent      │ │ created_at   │
              │ prob_after       │ └────────────────────┘ │ profit_loss      │ └──────────────┘
              │ fees             │                        └──────────────────┘
              │ is_filled        │
              │ is_cancelled     │
              │ is_redemption    │
              │ created_at       │
              │ updated_at       │
              └──────────────────┘
                      │
                      ▼
          ┌─────────────────────────┐
          │   transactions          │
          ├─────────────────────────┤
          │ id (PK)                 │
          │ user_id (FK)            │
          │ market_id (FK)          │
          │ bet_id (FK)             │
          │ type                    │
          │ amount (signed)          │
          │ balance_after           │
          │ description             │
          │ created_at              │
          └─────────────────────────┘

          ┌─────────────────────────┐
          │  market_comments        │
          ├─────────────────────────┤
          │ id (PK)                 │
          │ user_id (FK)            │
          │ market_id (FK)          │
          │ content                 │
          │ likes                   │
          │ created_at              │
          │ deleted_at              │
          └─────────────────────────┘

          ┌─────────────────────────┐
          │   limit_orders (TODO)   │
          ├─────────────────────────┤
          │ id (PK)                 │
          │ user_id (FK)            │
          │ market_id (FK)          │
          │ outcome                 │
          │ amount                  │
          │ limit_prob              │
          │ filled_amount           │
          │ status                  │
          │ created_at              │
          └─────────────────────────┘
```

---

## Table Relationships

### ✅ Core Flow: Placing a Bet

```
User places bet "100 YES on Trump" →
  │
  ├─ CHECK: user_balances.balance >= 100
  │
  ├─ CREATE: bets
  │    ├─ user_id: user_id
  │    ├─ market_id: market_id
  │    ├─ outcome: 'YES'
  │    ├─ amount: 10000 (cents)
  │    └─ shares: [calculated by CPMM]
  │
  ├─ UPDATE: markets
  │    ├─ pool_yes: [recalculated]
  │    ├─ pool_no: [recalculated]
  │    ├─ total_volume += 10000
  │    └─ unique_bettors [if new user]
  │
  ├─ UPDATE: user_balances
  │    └─ balance -= 10000
  │
  ├─ CREATE/UPDATE: user_positions
  │    ├─ yes_shares += [shares from CPMM]
  │    └─ total_spent += 10000
  │
  ├─ INSERT: market_prob_history
  │    ├─ probability: [new prob after bet]
  │    ├─ pool_yes: [new pool]
  │    └─ pool_no: [new pool]
  │
  ├─ CREATE: transactions
  │    ├─ type: 'bet'
  │    ├─ amount: -10000 (debit)
  │    └─ balance_after: [new balance]
  │
  └─ BROADCAST: WebSocket updates to all clients
       ├─ Market probability changed
       ├─ User's position updated
       └─ Bet confirmed
```

---

## Data Types & Constraints

### Monetary Values (ALL in CENTS)
```
User balance: 100000 cents = $1,000.00
Bet amount:     2500 cents =   $25.00
Pool:        1000000 cents = $10,000.00
```

### Outcome (ENUM)
```
'YES' - Bet on positive outcome
'NO'  - Bet on negative outcome
```

### Market Status (ENUM)
```
'open'     - Market is accepting bets
'closed'   - Market stopped accepting bets (awaiting resolution)
'resolved' - Market has been resolved (YES or NO)
```

### Transaction Type (ENUM)
```
'bet'         - Placed a bet
'resolution'  - Market resolved, won/lost bets
'bonus'       - Bonus reward
'withdrawal'  - User withdrew funds
'deposit'     - User added funds
'fee'         - Fee charged
```

---

## Key Indexes (Performance)

### Fast Lookups
```
users.email         → Login/registration
bets.user_id        → User's bets
bets.market_id      → Market's bets
markets.status      → Find open markets
markets.created_at  → Sort by newest
```

### Search
```
markets.question    → Full-text search
                      (using GIN trigram index)
```

### Range Queries
```
markets.closes_at   → Find expiring markets
bets.created_at     → Pagination, sorting
```

---

## Important Constraints

### Unique Constraints
```
users.email                    → Each email is unique
user_balances.user_id          → One balance per user
user_positions(user_id, mkt)   → One position per market per user
market_resolutions.market_id   → One resolution per market
user_follows_market(uid, mid)  → One follow per user per market
```

### Foreign Keys
```
markets.creator_id  → Must exist in users
bets.user_id        → Must exist in users
bets.market_id      → Must exist in markets
transactions.user_id → Can be null (system transactions)
```

### Check Constraints
```
bets.outcome           IN ('YES', 'NO')
markets.status         IN ('open', 'closed', 'resolved')
limit_orders.status    IN ('pending', 'filled', 'cancelled')
```

---

## Views (Aggregations)

### 1. market_with_probability
Adds computed field to markets:
```sql
current_probability = pool_no / (pool_yes + pool_no)
```

**Use case:** Get current market price

### 2. user_portfolio_summary
Aggregates all positions for a user:
```
total_markets, total_yes_shares, total_no_shares,
portfolio_value, total_invested, total_profit_loss
```

**Use case:** User dashboard, portfolio stats

### 3. market_leaderboard
Top bettors on a market:
```
user_id, name, bet_count, total_invested,
total_shares, last_bet_at
```

**Use case:** Market leaderboard, social stats

---

## Storage Size Estimation

For ~10,000 markets with ~100,000 bets:

```
users              ~  50 KB (1,000 users)
user_balances      ~  50 KB
markets            ~ 500 KB (10,000 markets)
bets               ~  15 MB (100,000 bets)
user_positions     ~  1 MB (10,000 positions)
market_prob_...    ~ 10 MB (1,000,000 history entries)
transactions       ~ 10 MB (100,000 transactions)

TOTAL              ~ 37 MB (easily fits in memory, no special handling needed)
```

For production scale (1M bets):
- Bets table: 150 MB
- Total: ~300 MB
- Consider archiving old data or partitioning

---

## Backup & Recovery

### Daily Backup
```bash
pg_dump vatici > backup_$(date +%Y%m%d).sql

# Restore
psql vatici < backup_20260226.sql
```

### Point-in-Time Recovery
```sql
-- Find transaction that caused problem
SELECT * FROM transactions
WHERE created_at BETWEEN '2026-02-20' AND '2026-02-26'
```

---

## Migration Strategy

### Adding a New Column
```sql
-- Migration file: 002_add_new_column.sql
ALTER TABLE markets ADD COLUMN new_field VARCHAR(255);

-- Create index if needed
CREATE INDEX idx_markets_new_field ON markets(new_field);

-- Update view if affected
DROP VIEW IF EXISTS market_with_probability;
CREATE OR REPLACE VIEW market_with_probability AS ...
```

### Safe Rollback
```sql
-- Revert migration
ALTER TABLE markets DROP COLUMN new_field;
DROP INDEX IF EXISTS idx_markets_new_field;
```

---

## Query Examples

See `backend/database/queries.sql` for common queries.
