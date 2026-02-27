-- Migration: Market Resolution System
-- Run this on the Neon database before deploying the resolution feature.

-- 1. Expand result column to support multi-choice answer IDs (UUIDs = 36 chars)
ALTER TABLE market_resolutions DROP CONSTRAINT IF EXISTS market_resolutions_result_check;
ALTER TABLE market_resolutions ALTER COLUMN result TYPE VARCHAR(50);

-- Make result nullable since it's set after proposal is created
ALTER TABLE market_resolutions ALTER COLUMN result DROP NOT NULL;

-- 2. Add AI tracking columns
ALTER TABLE market_resolutions ADD COLUMN IF NOT EXISTS ai_groq_result VARCHAR(50);
ALTER TABLE market_resolutions ADD COLUMN IF NOT EXISTS ai_gemini_result VARCHAR(50);
ALTER TABLE market_resolutions ADD COLUMN IF NOT EXISTS ai_groq_confidence INT;
ALTER TABLE market_resolutions ADD COLUMN IF NOT EXISTS ai_gemini_confidence INT;
ALTER TABLE market_resolutions ADD COLUMN IF NOT EXISTS ai_groq_reasoning TEXT;
ALTER TABLE market_resolutions ADD COLUMN IF NOT EXISTS ai_gemini_reasoning TEXT;

-- 3. Add optimistic dispute tracking
ALTER TABLE market_resolutions ADD COLUMN IF NOT EXISTS confirm_count INT DEFAULT 0;
ALTER TABLE market_resolutions ADD COLUMN IF NOT EXISTS dispute_count INT DEFAULT 0;
ALTER TABLE market_resolutions ADD COLUMN IF NOT EXISTS resolves_at TIMESTAMP;

-- 4. Community dispute votes (one vote per user per market)
CREATE TABLE IF NOT EXISTS resolution_votes (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
  vote VARCHAR(10) NOT NULL CHECK (vote IN ('confirm', 'dispute')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, market_id)
);
