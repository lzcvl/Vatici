/**
 * Database Types for Vatici Prediction Markets
 * Auto-generated from schema.sql
 */

// ============================================
// USER TYPES
// ============================================

export interface User {
  id: string // UUID
  email: string
  name: string
  password_hash: string
  avatar_url?: string
  bio?: string
  is_verified: boolean
  created_at: Date
  updated_at: Date
  last_login_at?: Date
  deleted_at?: Date
}

export type CreateUserInput = Omit<User, 'id' | 'created_at' | 'updated_at'>
export type UpdateUserInput = Partial<Omit<User, 'id' | 'password_hash' | 'created_at'>>

export interface UserBalance {
  id: string // UUID
  user_id: string
  balance: number // In cents (bigint)
  total_earned: number
  total_spent: number
  updated_at: Date
}

// ============================================
// MARKET TYPES
// ============================================

export type MarketStatus = 'open' | 'closed' | 'resolved'
export type MarketType = 'binary' | 'multi'
export type ResolutionResult = 'YES' | 'NO' | null

export interface Market {
  id: string // UUID
  creator_id: string
  question: string
  description?: string
  category?: string

  // Market type (binary = 2 choices, multi = multiple answers)
  market_type: MarketType

  // CPMM Pool (for binary only, null for multi)
  pool_yes?: number // In cents (bigint)
  pool_no?: number // In cents (bigint)
  p?: number // 0.0 to 1.0, typically 0.5

  // Fees collected
  collected_fees_creator: number // In cents
  collected_fees_liquidity: number // In cents

  // Status
  status: MarketStatus
  closes_at: Date
  resolved_at?: Date
  resolution_result?: ResolutionResult

  // Stats
  total_volume: number // In cents
  unique_bettors: number

  // UI
  icon_url?: string
  is_trending: boolean
  view_count: number

  created_at: Date
  updated_at: Date

  // Relations (optional, populated on demand)
  answers?: Answer[]
}

// ============================================
// ANSWER TYPES (for multi-choice markets)
// ============================================

export interface Answer {
  id: string // UUID
  market_id: string
  text: string
  index: number // Order in list

  // CPMM pools for this answer
  pool_yes: number // In cents
  pool_no: number // In cents

  // Stats
  volume: number // In cents
  probability?: number // Computed from pools

  // Resolution
  resolution?: 'YES' | 'NO' | null
  resolution_time?: Date
  resolution_probability?: number
  resolver_id?: string

  // UI
  is_other: boolean // "Other" option for open-ended
  color?: string // Hex color
  image_url?: string

  created_time: Date
}

export type CreateAnswerInput = Omit<
  Answer,
  'id' | 'created_time' | 'volume' | 'probability' | 'resolution' | 'resolution_time' | 'resolution_probability'
>

export type UpdateAnswerInput = Partial<
  Omit<Answer, 'id' | 'market_id' | 'created_time'>
>

export type CreateMarketInput = Omit<
  Market,
  'id' | 'created_at' | 'updated_at' | 'total_volume' | 'unique_bettors' | 'view_count' | 'collected_fees_creator' | 'collected_fees_liquidity' | 'resolved_at' | 'resolution_result' | 'answers'
> & {
  answers?: CreateAnswerInput[] // For multi-choice markets
}

export type UpdateMarketInput = Partial<
  Omit<Market, 'id' | 'creator_id' | 'created_at' | 'answers'>
>

// ============================================
// BET TYPES
// ============================================

export type BetOutcome = 'YES' | 'NO'

export interface Bet {
  id: string // UUID
  user_id: string
  market_id: string
  answer_id?: string // NULL for binary, set for multi-choice

  outcome: BetOutcome
  amount: number // In cents (invested)
  shares: number // Shares received

  prob_before: number // 0.0 to 1.0
  prob_after: number // 0.0 to 1.0

  fees: number // In cents

  is_filled: boolean
  is_cancelled: boolean
  is_redemption: boolean

  created_at: Date
  updated_at: Date
}

export type CreateBetInput = Omit<
  Bet,
  'id' | 'shares' | 'prob_before' | 'prob_after' | 'fees' | 'is_filled' | 'is_cancelled' | 'is_redemption' | 'created_at' | 'updated_at'
>

// ============================================
// POSITION TYPES
// ============================================

export interface UserPosition {
  id: string // UUID
  user_id: string
  market_id: string
  answer_id?: string // NULL for binary, set for multi-choice (one position per answer)

  yes_shares: number
  no_shares: number

  current_value: number // In cents
  total_spent: number // In cents
  profit_loss: number // In cents

  // Derived fields (from view)
  probability?: number
  market?: Market
  answer?: Answer
}

// ============================================
// MARKET PROBABILITY HISTORY
// ============================================

export interface MarketProbHistory {
  id: string // UUID
  market_id: string

  probability: number // 0.0 to 1.0
  pool_yes: number // In cents
  pool_no: number // In cents

  total_volume?: number // In cents
  recorded_at: Date
}

// ============================================
// LIMIT ORDER TYPES
// ============================================

export type LimitOrderStatus = 'pending' | 'filled' | 'cancelled'

export interface LimitOrder {
  id: string // UUID
  user_id: string
  market_id: string

  outcome: BetOutcome
  amount: number // In cents
  limit_prob: number // 0.0 to 1.0

  filled_amount: number // In cents
  status: LimitOrderStatus

  created_at: Date
  expires_at?: Date
  filled_at?: Date
  cancelled_at?: Date
}

// ============================================
// TRANSACTION TYPES
// ============================================

export type TransactionType =
  | 'bet'
  | 'resolution'
  | 'bonus'
  | 'withdrawal'
  | 'deposit'
  | 'fee'

export interface Transaction {
  id: string // UUID
  user_id?: string
  market_id?: string
  bet_id?: string

  type: TransactionType
  amount: number // Signed: positive = credit, negative = debit (in cents)

  balance_after: number // In cents
  description?: string

  created_at: Date
}

// ============================================
// MARKET RESOLUTION TYPES
// ============================================

export interface MarketResolution {
  id: string // UUID
  market_id: string
  resolved_by?: string

  result: 'YES' | 'NO'
  explanation?: string

  total_yes_payout: number // In cents
  total_no_payout: number // In cents
  unclaimed_balance: number // In cents

  created_at: Date
}

// ============================================
// COMMENT TYPES
// ============================================

export interface MarketComment {
  id: string // UUID
  user_id?: string
  market_id: string

  content: string
  likes: number

  created_at: Date
  updated_at: Date
  deleted_at?: Date
}

// ============================================
// FOLLOW TYPES
// ============================================

export interface UserFollowsMarket {
  user_id: string
  market_id: string
  created_at: Date
}

// ============================================
// VIEW TYPES (Derived from SQL views)
// ============================================

export interface MarketWithProbability extends Market {
  current_probability: number // 0.0 to 1.0
}

export interface UserPortfolioSummary {
  user_id: string
  total_markets: number
  total_yes_shares: number
  total_no_shares: number
  portfolio_value: number // In cents
  total_invested: number // In cents
  total_profit_loss: number // In cents
}

export interface MarketLeaderboardEntry {
  market_id: string
  user_id: string
  name: string
  bet_count: number
  total_invested: number // In cents
  total_shares: number
  last_bet_at: Date
}

// ============================================
// CPMM STATE TYPE
// ============================================

export interface CpmmState {
  pool: {
    YES: number // In cents
    NO: number // In cents
  }
  p: number // 0.0 to 1.0
  collectedFees: {
    creator: number // In cents
    liquidity: number // In cents
  }
}

// ============================================
// BET CALCULATION RESULT
// ============================================

export interface BetCalculationResult {
  shares: number
  probBefore: number
  probAfter: number
  newPool: {
    YES: number
    NO: number
  }
  fees: number
  amount: number // After fees
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
