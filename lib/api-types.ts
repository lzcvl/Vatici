/**
 * Shared API Types
 *
 * Types returned from the backend API
 * Mirrors backend/src/mappers.ts FrontendMarket, etc.
 */

export interface FrontendMarket {
  id: string
  type: 'binary' | 'multi'
  question: { pt: string; en: string; es: string }
  description: { pt: string; en: string; es: string }
  category: string
  probability: number // 0-1
  volume: number // BRL
  yesPool: number // BRL
  noPool: number // BRL
  options?: FrontendMarketOption[]
  closesAt: string
  resolvedAt: string | null
  resolution: string | null  // 'YES', 'NO', or answer UUID for multi-choice
  status: string             // 'open' | 'closed' | 'pending_resolution' | 'ai_uncertain' | 'disputed' | 'resolved'
  creatorId: string | null
  createdAt: string
  trending: boolean
  iconUrl?: string
  probabilityHistory: Array<{ date: string; probability: number }>
}

export interface FrontendMarketOption {
  id: string
  label: { pt: string; en: string; es: string }
  probability: number
  pool: number // BRL
}

export interface FrontendBet {
  id: string
  userId: string
  userName: string
  marketId: string
  direction: 'YES' | 'NO'
  amount: number // BRL
  shares: number
  avgPrice: number
  potentialPayout: number
  createdAt: string
}

export interface UserBalance {
  balance: number // BRL
}

export interface UserPosition {
  marketId: string
  market: FrontendMarket
  direction: 'YES' | 'NO'
  shares: number
  investedAmount: number // BRL
  currentValue: number // BRL
  unrealizedGain: number // BRL
}

export interface UserActivity {
  id: string
  type: 'bet' | 'resolution' | 'withdrawal' | 'deposit'
  marketId?: string
  market?: FrontendMarket
  amount: number // BRL
  direction?: 'YES' | 'NO'
  createdAt: string
}

export interface ResolutionInfo {
  result: string | null
  explanation?: string | null
  resolvedBy?: string | null
  totalYesPayout?: number
  totalNoPayout?: number
  aiGroqResult?: string | null
  aiGeminiResult?: string | null
  aiGroqConfidence?: number | null
  aiGeminiConfidence?: number | null
  aiGroqReasoning?: string | null
  aiGeminiReasoning?: string | null
  confirmCount: number
  disputeCount: number
  resolvesAt: string | null
  createdAt: string
}

export interface Comment {
  id: string
  body: string
  authorName: string
  parentId: string | null
  createdAt: string
}

export interface ResolvedPosition {
  marketId: string
  payout: number // BRL
  payoutAt: string
  resolution: string | null
  resolvedAt: string | null
  direction: string | null
  market: {
    id: string
    question: { pt: string; en: string; es: string }
  }
}
