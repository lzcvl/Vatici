# 🎭 Multi-Choice Markets Guide

## Overview

Vatici now supports both **binary** and **multi-choice** markets, following the Manifold Markets architecture.

---

## Binary vs Multi-Choice

### Binary Market (Simple)
```
Market: "Will it rain tomorrow?"
│
└─ Pool:
   ├─ YES: 50,000 (apostas em SIM)
   └─ NO: 30,000 (apostas em NÃO)

Probability = NO / (YES + NO) = 30000 / 80000 = 0.375 (37.5% chance of rain)
```

**Table Structure:**
```
markets (pool_yes, pool_no)
└─ bets (no answer_id)
└─ user_positions (no answer_id)
```

---

### Multi-Choice Market (Complex)
```
Market: "Who wins Copa America 2026?"
│
├─ Answer #1: "Brazil"
│  ├─ Pool YES: 100,000 (apostas em "Brasil YES")
│  ├─ Pool NO: 20,000 (apostas em "Brasil NO")
│  └─ Probability: 20000 / 120000 = 0.166 (16.6% chance Brasil wins)
│
├─ Answer #2: "Argentina"
│  ├─ Pool YES: 80,000
│  ├─ Pool NO: 40,000
│  └─ Probability: 40000 / 120000 = 0.333 (33.3% chance Argentina wins)
│
├─ Answer #3: "France"
│  ├─ Pool YES: 60,000
│  ├─ Pool NO: 50,000
│  └─ Probability: 50000 / 110000 = 0.454 (45.4% chance France wins)
│
└─ Answer #4: "Other"
   ├─ Pool YES: 30,000 (placeholder)
   ├─ Pool NO: 100,000
   └─ Probability: 100000 / 130000 = 0.769 (high "other" odds)
```

**Table Structure:**
```
markets (market_type='multi', pool_yes/no nullable)
└─ answers (one per option, each with its own YES/NO pools)
   ├─ bets (answer_id set, points to specific answer)
   └─ user_positions (answer_id set, one position per answer per user)
```

---

## Database Schema

### For Binary Markets

```sql
-- Create binary market
INSERT INTO markets (
  question, market_type, pool_yes, pool_no, p, category, closes_at
) VALUES (
  'Will it rain tomorrow?', 'binary', 100000, 100000, 0.5, 'weather', NOW() + INTERVAL '1 day'
);

-- Bet on binary market
INSERT INTO bets (
  user_id, market_id, outcome, amount, shares, prob_before, prob_after
) VALUES (
  'user-123', 'market-abc', 'YES', 5000, 50, 0.5, 0.52
);
-- Note: answer_id is NULL for binary
```

### For Multi-Choice Markets

```sql
-- Create multi-choice market
INSERT INTO markets (
  question, market_type, category, closes_at
) VALUES (
  'Who wins Copa America 2026?', 'multi', 'sports', NOW() + INTERVAL '6 months'
);
-- Note: pool_yes, pool_no are NULL for multi (each answer has its own)

-- Create answers
INSERT INTO answers (market_id, text, index, pool_yes, pool_no) VALUES
  ('market-xyz', 'Brazil', 0, 100000, 20000),
  ('market-xyz', 'Argentina', 1, 80000, 40000),
  ('market-xyz', 'France', 2, 60000, 50000),
  ('market-xyz', 'Other', 3, 30000, 100000);

-- Bet on Brazil YES
INSERT INTO bets (
  user_id, market_id, answer_id, outcome, amount, shares, prob_before, prob_after
) VALUES (
  'user-456', 'market-xyz', 'answer-brazil', 'YES', 10000, 100, 0.166, 0.172
);
-- Note: answer_id points to Brazil answer

-- Bet on Argentina NO
INSERT INTO bets (
  user_id, market_id, answer_id, outcome, amount, shares, prob_before, prob_after
) VALUES (
  'user-456', 'market-xyz', 'answer-argentina', 'NO', 5000, 50, 0.333, 0.325
);
```

---

## How CPMM Works in Multi-Choice

Each answer is **independent** with its own CPMM pool:

```typescript
// User bets 100 on "Brazil YES"
answer = "Brazil"
pool = {YES: 100000, NO: 20000}
p = 0.5

// CPMM Calculation (same formula as binary)
k = pool.YES^p * pool.NO^(1-p)
k = 100000^0.5 * 20000^0.5 = 4472.136

shares = 100000 + 100 - (k * (100 + 20000)^(0.5 - 1))^(1/0.5)
shares ≈ 81.65

// Only Brazil's pool changes
Brazil: {YES: 100081.65, NO: 20100}

// Argentina, France, Other pools are UNAFFECTED
```

---

## User Positions (Holdings)

### Binary Market
```sql
-- User position in binary market
SELECT * FROM user_positions
WHERE user_id = 'user-123' AND market_id = 'market-abc' AND answer_id IS NULL;

-- Result:
-- | yes_shares | no_shares | current_value |
-- | 50         | 30        | 4000 (in cents) |
```

### Multi-Choice Market
```sql
-- User positions in multi market (one row per answer)
SELECT * FROM user_positions
WHERE user_id = 'user-456' AND market_id = 'market-xyz';

-- Result:
-- | answer_id | yes_shares | no_shares |
-- | answer-brazil    | 100 | 0    |
-- | answer-argentina | 0   | 50   |
-- | answer-france    | 0   | 0    |
```

---

## Queries

### Get Binary Market with Probability
```sql
SELECT
  m.id, m.question,
  CAST(m.pool_no / (m.pool_yes + m.pool_no) AS DECIMAL) as prob
FROM markets m
WHERE m.market_type = 'binary' AND m.id = 'market-abc';
```

### Get Multi-Choice Market with All Answers
```sql
SELECT
  m.id, m.question,
  a.id as answer_id, a.text,
  CAST(a.pool_no / (a.pool_yes + a.pool_no) AS DECIMAL) as prob
FROM markets m
JOIN answers a ON m.id = a.market_id
WHERE m.market_type = 'multi' AND m.id = 'market-xyz'
ORDER BY a.index;

-- Result:
-- | id | question | answer_id | text | prob |
-- | market-xyz | Who wins Copa? | answer-brazil | Brazil | 0.166 |
-- | market-xyz | Who wins Copa? | answer-argentina | Argentina | 0.333 |
-- | market-xyz | Who wins Copa? | answer-france | France | 0.454 |
```

### User's Portfolio (All Markets)
```sql
-- User's positions in ALL markets (binary + multi)
SELECT
  up.market_id,
  up.answer_id,
  m.question,
  COALESCE(a.text, 'Binary') as option_text,
  up.yes_shares,
  up.no_shares,
  up.current_value
FROM user_positions up
JOIN markets m ON up.market_id = m.id
LEFT JOIN answers a ON up.answer_id = a.id
WHERE up.user_id = 'user-456'
ORDER BY up.market_id, COALESCE(a.index, 0);
```

---

## Migrating Database

### Step 1: Run Initial Schema
```bash
psql vatici -f backend/database/migrations/001_initial_schema.sql
```

### Step 2: Run Multi-Choice Migration
```bash
psql vatici -f backend/database/migrations/002_add_multi_choice_support.sql
```

### Verify Installation
```bash
psql vatici << EOF
-- Check markets
SELECT market_type, COUNT(*) FROM markets GROUP BY market_type;

-- Check answers table exists
\d answers

-- Check views
\dv answers_with_probability
EOF
```

---

## TypeScript Usage

### Create Binary Market
```typescript
const createBinaryMarket = (input: CreateMarketInput) => {
  return {
    ...input,
    market_type: 'binary',
    pool_yes: 100000,  // 1000 units
    pool_no: 100000,
    p: 0.5
  }
}
```

### Create Multi-Choice Market
```typescript
const createMultiMarket = (
  question: string,
  answers: string[]
) => {
  return {
    question,
    market_type: 'multi',
    // No pool_yes/pool_no at market level
    answers: answers.map((text, index) => ({
      text,
      index,
      pool_yes: 100000,  // Each answer starts with equal pools
      pool_no: 100000,
      is_other: index === answers.length - 1 // Last is "Other"
    }))
  }
}
```

### Place Bet on Binary
```typescript
const placeBinaryBet = async (
  userId: string,
  marketId: string,
  outcome: BetOutcome,
  amount: number
) => {
  // answer_id is omitted (null)
  return db.bets.create({
    user_id: userId,
    market_id: marketId,
    answer_id: undefined,  // NULL
    outcome,
    amount,
    // ... shares, prob_before/after calculated
  })
}
```

### Place Bet on Multi-Choice
```typescript
const placeMultiBet = async (
  userId: string,
  marketId: string,
  answerId: string,  // ← Key difference
  outcome: BetOutcome,
  amount: number
) => {
  return db.bets.create({
    user_id: userId,
    market_id: marketId,
    answer_id: answerId,  // ← Set for multi
    outcome,
    amount,
    // ... shares, prob_before/after calculated
  })
}
```

---

## Important Notes

### Pool Invariant Per Answer
Each answer's pool must maintain:
```
k = pool_yes^0.5 * pool_no^0.5 = constant
```

Verify after each bet on multi-choice:
```typescript
const verifyAnswerPoolInvariant = (answer: Answer) => {
  const k = Math.sqrt(answer.pool_yes * answer.pool_no)
  if (Math.abs(k - EXPECTED_K) > EPSILON) {
    throw new Error("Pool invariant violated!")
  }
}
```

### No Cross-Answer Pool Sharing
When user bets on "Brazil YES", it **only affects Brazil's pools**.

Argentina, France, Other pools are **completely independent**.

### Resolution
When market resolves to "Brazil":
```sql
UPDATE answers SET resolution = 'YES' WHERE id = 'answer-brazil';
UPDATE answers SET resolution = 'NO' WHERE id != 'answer-brazil';
```

Winners get payouts based on their Brazil YES shares.

---

## Views Available

| View | Purpose |
|------|---------|
| `market_with_probability` | Markets + current prob (binary only) |
| `answers_with_probability` | Answers + their individual probs |
| `market_leaderboard` | Top bettors (handles both binary + multi) |
| `user_portfolio_summary` | Aggregated portfolio stats |

---

## Performance Tips

- Index on `answers.market_id` for quick lookups ✅
- Index on `bets.answer_id` for multi queries ✅
- Consider sampling probability history (not every bet) for analytics
- Archive old resolved markets to separate schema

---

## Future Enhancements

- [ ] Arbitrage between answers (if shouldAnswersSumToOne)
- [ ] Liquidity provision per answer
- [ ] Answer descriptions (pt/en/es)
- [ ] User-created answers (open-ended markets)
- [ ] Comment threads per answer

---

## Example: Complete Multi-Choice Flow

```typescript
// 1. Create market
const market = await db.markets.create({
  question: "Who wins Copa 2026?",
  market_type: 'multi',
  category: 'sports',
  closes_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
})

// 2. Create answers
const answers = await db.answers.createMany([
  {market_id: market.id, text: 'Brazil', index: 0, pool_yes: 100000, pool_no: 20000},
  {market_id: market.id, text: 'Argentina', index: 1, pool_yes: 80000, pool_no: 40000},
  {market_id: market.id, text: 'France', index: 2, pool_yes: 60000, pool_no: 50000},
])

// 3. User places bet on Brazil
const bet = await placeBet({
  user_id: 'user-456',
  market_id: market.id,
  answer_id: answers[0].id,  // Brazil
  outcome: 'YES',
  amount: 10000
})

// 4. Query user's position on this answer
const position = await db.userPositions.findOne({
  user_id: 'user-456',
  market_id: market.id,
  answer_id: answers[0].id
})
// Returns: {yes_shares: 100, no_shares: 0, ...}

// 5. Get all answers with probabilities
const answersWithProbs = await db.query(
  'SELECT * FROM answers_with_probability WHERE market_id = ?',
  [market.id]
)
// Returns all answers with their individual probabilities
```

---

✅ **Multi-choice markets are now fully supported!**
