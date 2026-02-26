-- Migration: 001_initial_schema
-- Description: Create initial schema for Vatici prediction markets
-- Created: 2026-02-26
-- Status: UP

BEGIN;

-- ============================================
-- Enable Extensions
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  bio TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;

-- ============================================
-- USER BALANCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance BIGINT NOT NULL DEFAULT 1000000,
  total_earned BIGINT DEFAULT 0,
  total_spent BIGINT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_balances_user_id ON user_balances(user_id);

-- ============================================
-- MARKETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS markets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES users(id) ON DELETE SET NULL,

  question TEXT NOT NULL,
  description TEXT,
  category VARCHAR(100),

  pool_yes BIGINT NOT NULL DEFAULT 100000,
  pool_no BIGINT NOT NULL DEFAULT 100000,
  p DECIMAL(4, 3) NOT NULL DEFAULT 0.500,

  collected_fees_creator BIGINT DEFAULT 0,
  collected_fees_liquidity BIGINT DEFAULT 0,

  status VARCHAR(50) NOT NULL DEFAULT 'open',
  closes_at TIMESTAMP NOT NULL,
  resolved_at TIMESTAMP,
  resolution_result VARCHAR(10),

  total_volume BIGINT DEFAULT 0,
  unique_bettors INT DEFAULT 0,

  icon_url VARCHAR(500),
  is_trending BOOLEAN DEFAULT FALSE,
  view_count INT DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_markets_creator_id ON markets(creator_id);
CREATE INDEX IF NOT EXISTS idx_markets_status ON markets(status);
CREATE INDEX IF NOT EXISTS idx_markets_closes_at ON markets(closes_at);
CREATE INDEX IF NOT EXISTS idx_markets_created_at ON markets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_markets_trending ON markets(is_trending) WHERE is_trending = TRUE;
CREATE INDEX IF NOT EXISTS idx_markets_question_search ON markets USING GIN (to_tsvector('english', question));

-- ============================================
-- BETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,

  outcome VARCHAR(3) NOT NULL,
  amount BIGINT NOT NULL,
  shares BIGINT NOT NULL,

  prob_before DECIMAL(5, 4) NOT NULL,
  prob_after DECIMAL(5, 4) NOT NULL,

  fees BIGINT DEFAULT 0,

  is_filled BOOLEAN DEFAULT TRUE,
  is_cancelled BOOLEAN DEFAULT FALSE,
  is_redemption BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT bets_outcome_check CHECK (outcome IN ('YES', 'NO'))
);

CREATE INDEX IF NOT EXISTS idx_bets_user_id ON bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_market_id ON bets(market_id);
CREATE INDEX IF NOT EXISTS idx_bets_user_market ON bets(user_id, market_id);
CREATE INDEX IF NOT EXISTS idx_bets_created_at ON bets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bets_outcome ON bets(outcome);

-- ============================================
-- USER POSITIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,

  yes_shares BIGINT DEFAULT 0,
  no_shares BIGINT DEFAULT 0,

  current_value BIGINT DEFAULT 0,

  total_spent BIGINT DEFAULT 0,
  profit_loss BIGINT DEFAULT 0,

  UNIQUE(user_id, market_id)
);

CREATE INDEX IF NOT EXISTS idx_user_positions_user_id ON user_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_positions_market_id ON user_positions(market_id);
CREATE INDEX IF NOT EXISTS idx_user_positions_user_market ON user_positions(user_id, market_id);

-- ============================================
-- MARKET PROBABILITY HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS market_prob_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,

  probability DECIMAL(5, 4) NOT NULL,
  pool_yes BIGINT NOT NULL,
  pool_no BIGINT NOT NULL,

  total_volume BIGINT,

  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_market_prob_history_market_id ON market_prob_history(market_id);
CREATE INDEX IF NOT EXISTS idx_market_prob_history_recorded_at ON market_prob_history(recorded_at DESC);

-- ============================================
-- LIMIT ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS limit_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,

  outcome VARCHAR(3) NOT NULL,
  amount BIGINT NOT NULL,
  limit_prob DECIMAL(5, 4) NOT NULL,

  filled_amount BIGINT DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  filled_at TIMESTAMP,
  cancelled_at TIMESTAMP,

  CONSTRAINT limit_orders_outcome_check CHECK (outcome IN ('YES', 'NO')),
  CONSTRAINT limit_orders_status_check CHECK (status IN ('pending', 'filled', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_limit_orders_user_id ON limit_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_limit_orders_market_id ON limit_orders(market_id);
CREATE INDEX IF NOT EXISTS idx_limit_orders_status ON limit_orders(status);

-- ============================================
-- TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  market_id UUID REFERENCES markets(id) ON DELETE SET NULL,
  bet_id UUID REFERENCES bets(id) ON DELETE SET NULL,

  type VARCHAR(50) NOT NULL,
  amount BIGINT NOT NULL,

  balance_after BIGINT NOT NULL,

  description VARCHAR(500),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_market_id ON transactions(market_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- ============================================
-- MARKET RESOLUTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS market_resolutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  market_id UUID NOT NULL UNIQUE REFERENCES markets(id) ON DELETE CASCADE,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,

  result VARCHAR(10) NOT NULL,
  explanation TEXT,

  total_yes_payout BIGINT DEFAULT 0,
  total_no_payout BIGINT DEFAULT 0,
  unclaimed_balance BIGINT DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT market_resolutions_result_check CHECK (result IN ('YES', 'NO'))
);

CREATE INDEX IF NOT EXISTS idx_market_resolutions_market_id ON market_resolutions(market_id);

-- ============================================
-- MARKET COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS market_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,

  content TEXT NOT NULL,

  likes INT DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_market_comments_market_id ON market_comments(market_id);
CREATE INDEX IF NOT EXISTS idx_market_comments_user_id ON market_comments(user_id);

-- ============================================
-- USER FOLLOWS MARKET TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_follows_market (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (user_id, market_id)
);

CREATE INDEX IF NOT EXISTS idx_user_follows_market_user_id ON user_follows_market(user_id);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_markets_updated_at ON markets;
CREATE TRIGGER update_markets_updated_at BEFORE UPDATE ON markets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bets_updated_at ON bets;
CREATE TRIGGER update_bets_updated_at BEFORE UPDATE ON bets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_market_comments_updated_at ON market_comments;
CREATE TRIGGER update_market_comments_updated_at BEFORE UPDATE ON market_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS
-- ============================================

DROP VIEW IF EXISTS user_portfolio_summary CASCADE;
CREATE OR REPLACE VIEW user_portfolio_summary AS
SELECT
  up.user_id,
  COUNT(DISTINCT up.market_id) as total_markets,
  COALESCE(SUM(up.yes_shares), 0) as total_yes_shares,
  COALESCE(SUM(up.no_shares), 0) as total_no_shares,
  COALESCE(SUM(up.current_value), 0) as portfolio_value,
  COALESCE(SUM(up.total_spent), 0) as total_invested,
  COALESCE(SUM(up.profit_loss), 0) as total_profit_loss
FROM user_positions up
GROUP BY up.user_id;

DROP VIEW IF EXISTS market_with_probability CASCADE;
CREATE OR REPLACE VIEW market_with_probability AS
SELECT
  m.id,
  m.question,
  m.category,
  m.pool_yes,
  m.pool_no,
  m.p,
  m.status,
  m.closes_at,
  m.resolution_result,
  CASE
    WHEN (m.pool_yes + m.pool_no) > 0
    THEN CAST(m.pool_no::FLOAT / (m.pool_yes::FLOAT + m.pool_no::FLOAT) AS DECIMAL(5, 4))
    ELSE 0.5
  END as current_probability,
  m.total_volume,
  m.unique_bettors,
  m.created_at
FROM markets m;

DROP VIEW IF EXISTS market_leaderboard CASCADE;
CREATE OR REPLACE VIEW market_leaderboard AS
SELECT
  b.market_id,
  b.user_id,
  u.name,
  COUNT(*) as bet_count,
  COALESCE(SUM(b.amount), 0) as total_invested,
  COALESCE(SUM(b.shares), 0) as total_shares,
  MAX(b.created_at) as last_bet_at
FROM bets b
LEFT JOIN users u ON b.user_id = u.id
WHERE b.user_id IS NOT NULL
GROUP BY b.market_id, b.user_id, u.name;

COMMIT;
