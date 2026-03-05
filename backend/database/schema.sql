-- ============================================
-- VATICI DATABASE SCHEMA (CPMM Model)
-- PostgreSQL Schema for Prediction Markets
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  bio TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  registration_ip VARCHAR(45),
  last_ip VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP,
  deleted_at TIMESTAMP -- Soft delete
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- ============================================
-- USER BALANCES TABLE (Current balance)
-- ============================================
CREATE TABLE user_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance BIGINT NOT NULL DEFAULT 1000000, -- In cents (1 million = 10,000 units)
  total_earned BIGINT DEFAULT 0,
  total_spent BIGINT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_balances_user_id ON user_balances(user_id);

-- ============================================
-- MARKETS TABLE (Main contracts)
-- ============================================
CREATE TABLE markets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,

  -- Market Info
  question TEXT NOT NULL,
  description TEXT,
  category VARCHAR(100),

  -- CPMM Pool State
  pool_yes BIGINT NOT NULL DEFAULT 100000, -- In cents
  pool_no BIGINT NOT NULL DEFAULT 100000,
  p DECIMAL(4, 3) NOT NULL DEFAULT 0.500, -- Weighting parameter (0.0 to 1.0)

  -- Fees
  collected_fees_creator BIGINT DEFAULT 0,
  collected_fees_liquidity BIGINT DEFAULT 0,

  -- Market Status
  status VARCHAR(50) NOT NULL DEFAULT 'open', -- open, closed, resolved
  closes_at TIMESTAMP NOT NULL,
  resolved_at TIMESTAMP,
  resolution_result VARCHAR(10), -- 'YES', 'NO', null if unresolved

  -- Volume tracking
  total_volume BIGINT DEFAULT 0,
  unique_bettors INT DEFAULT 0,

  -- UI
  icon_url VARCHAR(500),
  is_trending BOOLEAN DEFAULT FALSE,
  view_count INT DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_markets_creator_id ON markets(creator_id);
CREATE INDEX idx_markets_status ON markets(status);
CREATE INDEX idx_markets_closes_at ON markets(closes_at);
CREATE INDEX idx_markets_created_at ON markets(created_at DESC);
CREATE INDEX idx_markets_trending ON markets(is_trending) WHERE is_trending = TRUE;
CREATE INDEX idx_markets_question_search ON markets USING GIN (to_tsvector('english', question));

-- ============================================
-- BETS TABLE (All trades/bets)
-- ============================================
CREATE TABLE bets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,

  -- Bet Details
  outcome VARCHAR(3) NOT NULL CHECK (outcome IN ('YES', 'NO')), -- Binary choice
  amount BIGINT NOT NULL, -- Amount invested in cents
  shares BIGINT NOT NULL, -- Shares received

  -- Probability tracking
  prob_before DECIMAL(5, 4) NOT NULL, -- Probability before bet
  prob_after DECIMAL(5, 4) NOT NULL,  -- Probability after bet

  -- Fee tracking
  fees BIGINT DEFAULT 0,

  -- Status
  is_filled BOOLEAN DEFAULT TRUE,
  is_cancelled BOOLEAN DEFAULT FALSE,
  is_redemption BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bets_user_id ON bets(user_id);
CREATE INDEX idx_bets_market_id ON bets(market_id);
CREATE INDEX idx_bets_user_market ON bets(user_id, market_id);
CREATE INDEX idx_bets_created_at ON bets(created_at DESC);
CREATE INDEX idx_bets_outcome ON bets(outcome);

-- ============================================
-- USER POSITIONS TABLE (Current holdings)
-- ============================================
CREATE TABLE user_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,

  -- Holdings
  yes_shares BIGINT DEFAULT 0,
  no_shares BIGINT DEFAULT 0,

  -- Valuation (computed)
  current_value BIGINT DEFAULT 0, -- In cents

  -- Stats
  total_spent BIGINT DEFAULT 0, -- Total amount invested
  profit_loss BIGINT DEFAULT 0, -- Current P&L

  UNIQUE(user_id, market_id)
);

CREATE INDEX idx_user_positions_user_id ON user_positions(user_id);
CREATE INDEX idx_user_positions_market_id ON user_positions(market_id);
CREATE INDEX idx_user_positions_user_market ON user_positions(user_id, market_id);

-- ============================================
-- MARKET PROBABILITY HISTORY TABLE
-- ============================================
CREATE TABLE market_prob_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,

  -- Probability snapshot
  probability DECIMAL(5, 4) NOT NULL,
  pool_yes BIGINT NOT NULL,
  pool_no BIGINT NOT NULL,

  -- Volume at this point
  total_volume BIGINT,

  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_market_prob_history_market_id ON market_prob_history(market_id);
CREATE INDEX idx_market_prob_history_recorded_at ON market_prob_history(recorded_at DESC);

-- ============================================
-- LIMIT ORDERS TABLE (Optional - for future)
-- ============================================
CREATE TABLE limit_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,

  -- Order Details
  outcome VARCHAR(3) NOT NULL CHECK (outcome IN ('YES', 'NO')),
  amount BIGINT NOT NULL,
  limit_prob DECIMAL(5, 4) NOT NULL, -- Will buy/sell at this price or better

  -- Status
  filled_amount BIGINT DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, filled, cancelled

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  filled_at TIMESTAMP,
  cancelled_at TIMESTAMP
);

CREATE INDEX idx_limit_orders_user_id ON limit_orders(user_id);
CREATE INDEX idx_limit_orders_market_id ON limit_orders(market_id);
CREATE INDEX idx_limit_orders_status ON limit_orders(status);

-- ============================================
-- TRANSACTIONS TABLE (Financial audit trail)
-- ============================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  market_id UUID REFERENCES markets(id) ON DELETE SET NULL,
  bet_id UUID REFERENCES bets(id) ON DELETE SET NULL,

  -- Transaction Type
  type VARCHAR(50) NOT NULL, -- 'bet', 'resolution', 'bonus', 'withdrawal', etc
  amount BIGINT NOT NULL, -- Signed: positive = credit, negative = debit

  -- Balance after transaction
  balance_after BIGINT NOT NULL,

  -- Description
  description VARCHAR(500),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_market_id ON transactions(market_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- ============================================
-- MARKET RESOLUTIONS TABLE
-- ============================================
CREATE TABLE market_resolutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  market_id UUID NOT NULL UNIQUE REFERENCES markets(id) ON DELETE CASCADE,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,

  result VARCHAR(10) NOT NULL CHECK (result IN ('YES', 'NO')),
  explanation TEXT,

  -- Payout tracking
  total_yes_payout BIGINT DEFAULT 0,
  total_no_payout BIGINT DEFAULT 0,
  unclaimed_balance BIGINT DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_market_resolutions_market_id ON market_resolutions(market_id);

-- ============================================
-- MARKET COMMENTS TABLE (Optional - for community)
-- ============================================
CREATE TABLE market_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,

  content TEXT NOT NULL,

  likes INT DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP -- Soft delete
);

CREATE INDEX idx_market_comments_market_id ON market_comments(market_id);
CREATE INDEX idx_market_comments_user_id ON market_comments(user_id);

-- ============================================
-- USER FOLLOW TABLE (Optional - follow markets)
-- ============================================
CREATE TABLE user_follows_market (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (user_id, market_id)
);

CREATE INDEX idx_user_follows_market_user_id ON user_follows_market(user_id);

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_markets_updated_at BEFORE UPDATE ON markets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bets_updated_at BEFORE UPDATE ON bets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_market_comments_updated_at BEFORE UPDATE ON market_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS (Useful queries)
-- ============================================

-- View: Market with current probability
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
  CAST(m.pool_no::FLOAT / (m.pool_yes::FLOAT + m.pool_no::FLOAT) AS DECIMAL(5, 4)) as current_probability,
  m.total_volume,
  m.unique_bettors,
  m.created_at
FROM markets m;

-- View: User portfolio summary
CREATE OR REPLACE VIEW user_portfolio_summary AS
SELECT
  up.user_id,
  COUNT(DISTINCT up.market_id) as total_markets,
  SUM(up.yes_shares) as total_yes_shares,
  SUM(up.no_shares) as total_no_shares,
  SUM(up.current_value) as portfolio_value,
  SUM(up.total_spent) as total_invested,
  SUM(up.profit_loss) as total_profit_loss
FROM user_positions up
GROUP BY up.user_id;

-- View: Market leaderboard (top bettors)
CREATE OR REPLACE VIEW market_leaderboard AS
SELECT
  b.market_id,
  b.user_id,
  u.name,
  COUNT(*) as bet_count,
  SUM(b.amount) as total_invested,
  SUM(b.shares) as total_shares,
  MAX(b.created_at) as last_bet_at
FROM bets b
JOIN users u ON b.user_id = u.id
GROUP BY b.market_id, b.user_id, u.name;

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Create a test user
INSERT INTO users (email, name, password_hash) VALUES
  ('test@example.com', 'Test User', 'hashed_password_here')
ON CONFLICT (email) DO NOTHING;

-- Create a test market
INSERT INTO markets (
  creator_id,
  question,
  description,
  category,
  closes_at
) VALUES (
  (SELECT id FROM users LIMIT 1),
  'Will the price of Bitcoin exceed $100,000 by end of 2024?',
  'This market resolves YES if the price of Bitcoin exceeds $100,000 USD at any point before the closing time.',
  'crypto',
  CURRENT_TIMESTAMP + INTERVAL '30 days'
)
ON CONFLICT DO NOTHING;
