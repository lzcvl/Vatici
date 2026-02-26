-- Migration: 002_add_multi_choice_support
-- Description: Add support for multi-choice markets (like "Who wins Copa?")
-- Created: 2026-02-26
-- Status: UP

BEGIN;

-- ============================================
-- 1. ALTER MARKETS TABLE - Add market_type
-- ============================================

ALTER TABLE markets
ADD COLUMN IF NOT EXISTS market_type VARCHAR(20) NOT NULL DEFAULT 'binary';

ALTER TABLE markets
ADD CONSTRAINT markets_market_type_check CHECK (market_type IN ('binary', 'multi'));

CREATE INDEX IF NOT EXISTS idx_markets_market_type ON markets(market_type);

-- ============================================
-- 2. CREATE ANSWERS TABLE (for multi-choice)
-- ============================================

CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,

  -- Answer content
  text VARCHAR(500) NOT NULL,
  index INT NOT NULL, -- Order in the list

  -- CPMM pools for this specific answer
  pool_yes BIGINT NOT NULL DEFAULT 100000, -- Apostas em "Answer YES"
  pool_no BIGINT NOT NULL DEFAULT 100000,  -- Apostas em "Answer NO"

  -- Stats
  volume BIGINT DEFAULT 0,

  -- Resolution
  resolution VARCHAR(10), -- 'YES', 'NO', or null
  resolution_time TIMESTAMP,
  resolution_probability DECIMAL(5, 4),
  resolver_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- UI/Special
  is_other BOOLEAN DEFAULT FALSE, -- "Other" option for open-ended markets
  color VARCHAR(7), -- Hex color for UI
  image_url VARCHAR(500),

  created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(market_id, index),
  CONSTRAINT answers_resolution_check CHECK (resolution IN ('YES', 'NO', NULL::VARCHAR))
);

CREATE INDEX IF NOT EXISTS idx_answers_market_id ON answers(market_id);
CREATE INDEX IF NOT EXISTS idx_answers_market_index ON answers(market_id, index);
CREATE INDEX IF NOT EXISTS idx_answers_resolution ON answers(resolution);

-- ============================================
-- 3. ALTER BETS TABLE - Add answer_id
-- ============================================

ALTER TABLE bets
ADD COLUMN IF NOT EXISTS answer_id UUID REFERENCES answers(id) ON DELETE CASCADE;

-- For binary markets: answer_id will be NULL
-- For multi markets: answer_id will be set
CREATE INDEX IF NOT EXISTS idx_bets_answer_id ON bets(answer_id);

-- ============================================
-- 4. ALTER USER_POSITIONS TABLE
-- ============================================

-- Add answer_id for multi-choice positions
-- For binary: answer_id = NULL
-- For multi: one position per answer per user

ALTER TABLE user_positions
DROP CONSTRAINT IF EXISTS user_positions_user_id_market_id_key;

ALTER TABLE user_positions
ADD COLUMN IF NOT EXISTS answer_id UUID REFERENCES answers(id) ON DELETE CASCADE;

-- New unique constraint: (user, market, answer) for flexibility
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_positions_unique
ON user_positions(user_id, market_id, answer_id)
WHERE answer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_positions_binary
ON user_positions(user_id, market_id)
WHERE answer_id IS NULL;

-- ============================================
-- 5. ALTER LIMIT_ORDERS TABLE
-- ============================================

ALTER TABLE limit_orders
ADD COLUMN IF NOT EXISTS answer_id UUID REFERENCES answers(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_limit_orders_answer_id ON limit_orders(answer_id);

-- ============================================
-- 6. CREATE MARKET_ANSWERS_HISTORY (Optional: track prob changes per answer)
-- ============================================

CREATE TABLE IF NOT EXISTS market_answers_prob_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  answer_id UUID NOT NULL REFERENCES answers(id) ON DELETE CASCADE,

  -- Probability snapshot
  probability DECIMAL(5, 4) NOT NULL,
  pool_yes BIGINT NOT NULL,
  pool_no BIGINT NOT NULL,

  -- Volume at this point
  volume BIGINT,

  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_market_answers_prob_history_answer_id
ON market_answers_prob_history(answer_id);

CREATE INDEX IF NOT EXISTS idx_market_answers_prob_history_recorded_at
ON market_answers_prob_history(recorded_at DESC);

-- ============================================
-- 7. UPDATE VIEWS
-- ============================================

-- Extend market_with_probability view to show market_type
DROP VIEW IF EXISTS market_with_probability CASCADE;
CREATE OR REPLACE VIEW market_with_probability AS
SELECT
  m.id,
  m.question,
  m.category,
  m.market_type,
  m.pool_yes,
  m.pool_no,
  m.p,
  m.status,
  m.closes_at,
  m.resolution_result,
  CASE
    WHEN (m.pool_yes + m.pool_no) > 0 AND m.market_type = 'binary'
    THEN CAST(m.pool_no::FLOAT / (m.pool_yes::FLOAT + m.pool_no::FLOAT) AS DECIMAL(5, 4))
    ELSE 0.5
  END as current_probability,
  m.total_volume,
  m.unique_bettors,
  m.created_at
FROM markets m;

-- New view: answers_with_probability
DROP VIEW IF EXISTS answers_with_probability CASCADE;
CREATE OR REPLACE VIEW answers_with_probability AS
SELECT
  a.id,
  a.market_id,
  a.text,
  a.index,
  a.pool_yes,
  a.pool_no,
  a.is_other,
  CASE
    WHEN (a.pool_yes + a.pool_no) > 0
    THEN CAST(a.pool_no::FLOAT / (a.pool_yes::FLOAT + a.pool_no::FLOAT) AS DECIMAL(5, 4))
    ELSE 0.5
  END as probability,
  a.volume,
  a.resolution,
  a.created_time
FROM answers a;

-- Update market_leaderboard to handle both binary and multi
DROP VIEW IF EXISTS market_leaderboard CASCADE;
CREATE OR REPLACE VIEW market_leaderboard AS
SELECT
  b.market_id,
  b.answer_id,
  b.user_id,
  u.name,
  COUNT(*) as bet_count,
  COALESCE(SUM(b.amount), 0) as total_invested,
  COALESCE(SUM(b.shares), 0) as total_shares,
  MAX(b.created_at) as last_bet_at
FROM bets b
LEFT JOIN users u ON b.user_id = u.id
LEFT JOIN answers a ON b.answer_id = a.id
WHERE b.user_id IS NOT NULL
GROUP BY b.market_id, b.answer_id, b.user_id, u.name
ORDER BY b.market_id, total_invested DESC;

-- ============================================
-- 8. UPDATE TRIGGERS
-- ============================================

-- Trigger for answers table
CREATE OR REPLACE FUNCTION update_answers_created_time()
RETURNS TRIGGER AS $$
BEGIN
  -- For answers, we use created_time instead of updated_at
  -- But we can add an updated_time if needed
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS (Documentation)
-- ============================================

COMMENT ON TABLE answers IS 'Multi-choice answers for markets. Each answer is like a binary sub-market (YES/NO for that answer).';
COMMENT ON COLUMN answers.pool_yes IS 'Number of shares bet on "this answer YES"';
COMMENT ON COLUMN answers.pool_no IS 'Number of shares bet on "this answer NO"';
COMMENT ON COLUMN answers.is_other IS 'Special "Other" answer that represents all answers not explicitly listed';
COMMENT ON COLUMN answers.resolution IS 'Result of this answer (YES=won, NO=lost)';

COMMENT ON TABLE market_answers_prob_history IS 'Historical probability snapshots for each answer (optional, for charting)';

COMMENT ON COLUMN bets.answer_id IS 'NULL for binary markets, set for multi-choice markets';

COMMENT ON COLUMN user_positions.answer_id IS 'NULL for binary markets, set for multi-choice markets';

COMMIT;
