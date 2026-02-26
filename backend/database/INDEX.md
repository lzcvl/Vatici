# 📚 Database Documentation Index

## Complete PostgreSQL Schema for Vatici Prediction Markets

Quick navigation to all database documentation:

---

## 📖 Documentation Files

### 1. **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - START HERE ⭐
**→ Step-by-step database setup (5 minutes)**

- Quick start (create database, run schema)
- Detailed PostgreSQL installation
- Connection strings
- Common tasks (backup, restore, etc)
- Troubleshooting

**Read this if you want to:** Get the database up and running

---

### 2. **[README.md](README.md)** - Schema Reference
**→ Comprehensive documentation of all tables**

- 11 tables explained in detail
- Views and aggregations
- Performance considerations
- Important notes (amounts in cents, CPMM invariant)
- Future enhancements

**Read this if you want to:** Understand table structure and design

---

### 3. **[SCHEMA_VISUAL.md](SCHEMA_VISUAL.md)** - Visual Guides
**→ Diagrams and relationship visualization**

- Entity Relationship Diagram (ERD)
- Table relationships
- Data flow example (placing a bet)
- Constraints and data types
- Query examples

**Read this if you want to:** Visual understanding of schema

---

### 4. **[schema.sql](schema.sql)** - Full SQL Schema
**→ Complete DDL (reference only)**

- All table definitions
- All indexes
- All views
- All triggers and functions
- Sample data

**Read this if you want to:** See all SQL code at once

---

### 5. **[migrations/001_initial_schema.sql](migrations/001_initial_schema.sql)** - Migration File
**→ Idempotent migration for version control**

- Safe to run multiple times
- Wrapped in transaction
- Uses `IF NOT EXISTS` clauses
- Suitable for CI/CD pipelines

**Run this to:** Deploy database schema

---

## 🗄️ Tables Overview

| Table | Purpose | Records |
|-------|---------|---------|
| `users` | User accounts | ~1K |
| `user_balances` | Wallet balances | ~1K |
| `markets` | Prediction markets | ~10K |
| `bets` | Individual trades | ~100K |
| `user_positions` | Current holdings | ~10K |
| `market_prob_history` | Probability timeline | ~1M |
| `transactions` | Audit trail | ~100K |
| `limit_orders` | Limit orders (TODO) | ~10K |
| `market_resolutions` | Resolution details | ~100 |
| `market_comments` | Comments | ~10K |
| `user_follows_market` | Market follows | ~5K |

---

## ⚡ Quick Commands

### Setup (First Time)
```bash
# Create database
createdb vatici

# Run migration
psql vatici -f backend/database/migrations/001_initial_schema.sql

# Verify
psql vatici -c "SELECT COUNT(*) FROM users;"
```

### Backup
```bash
pg_dump vatici > backup_$(date +%Y%m%d).sql.gz
```

### Restore
```bash
psql vatici < backup_20260226.sql
```

### Check Size
```bash
psql vatici -c "SELECT pg_size_pretty(pg_database_size('vatici'));"
```

---

## 🎯 Key Concepts

### All Amounts in Cents (BIGINT)
```
User balance: 10050 = $100.50
Bet amount:    2500 = $25.00
Pool:       1000000 = $10,000.00
```

### CPMM Pool Invariant
```
k = pool_yes^p × pool_no^(1-p) = constant

For p=0.5:
k = sqrt(pool_yes × pool_no)
```

Must be verified after every bet!

### Market Status
```
'open'     → Accepting bets
'closed'   → Awaiting resolution
'resolved' → Finished (YES/NO)
```

### Outcome (Binary)
```
'YES' → Positive outcome
'NO'  → Negative outcome
```

---

## 📋 Related TypeScript Types

See `/backend/src/types/database.ts` for:
- User, Market, Bet interfaces
- CreateUserInput, UpdateMarketInput types
- API response types
- CPMM state type
- Utility types

---

## 🚀 Next Steps

After setting up the database:

1. **Implement CPMM Math** → See `/backend/src/lib/cpmm.ts` (next)
2. **Create Models/DAOs** → Database access layer
3. **Implement Handlers** → API endpoints
4. **Write Tests** → Unit tests for math functions

---

## 📞 Need Help?

### Database Setup Issues?
→ See [SETUP_GUIDE.md](SETUP_GUIDE.md) Troubleshooting section

### Understanding Table Structure?
→ See [README.md](README.md) Table Reference section

### Visual Learner?
→ See [SCHEMA_VISUAL.md](SCHEMA_VISUAL.md) ERD diagrams

### Want to See SQL Code?
→ See [schema.sql](schema.sql) or [migrations/001_initial_schema.sql](migrations/001_initial_schema.sql)

---

## 📊 Schema Statistics

```
Tables:           11
Indexes:          ~40
Views:            3
Triggers:         4
Estimated Rows:   ~1.3M
Estimated Size:   ~400MB
Scalable to:      ~10M rows (add archiving)
```

---

## ✅ Checklist

- [ ] Read SETUP_GUIDE.md
- [ ] Create PostgreSQL database
- [ ] Run migration SQL
- [ ] Verify all tables exist
- [ ] Understand CPMM invariant
- [ ] Remember: amounts in cents!
- [ ] Ready to implement math functions

---

## Files Structure

```
backend/
├── database/
│   ├── INDEX.md                        ← You are here
│   ├── SETUP_GUIDE.md                 ← Start here for setup
│   ├── README.md                      ← Schema details
│   ├── SCHEMA_VISUAL.md               ← Visual diagrams
│   ├── schema.sql                     ← Full SQL (reference)
│   └── migrations/
│       └── 001_initial_schema.sql     ← Run this
├── src/
│   ├── types/
│   │   └── database.ts                ← TypeScript types
│   ├── lib/
│   │   └── cpmm.ts                    ← Math (next step)
│   └── ...
```

---

## Database Diagram (Quick Reference)

```
┌─────────┐
│ users   │
└────┬────┘
     │
     ├─→ user_balances
     ├─→ markets (as creator)
     │    ├─→ bets
     │    ├─→ user_positions
     │    ├─→ market_prob_history
     │    ├─→ market_resolutions
     │    ├─→ market_comments
     │    └─→ limit_orders
     └─→ user_follows_market

transactions (audit all changes)
```

---

**Last Updated:** 2026-02-26
**Schema Version:** 1.0
**Status:** ✅ Ready for Development
