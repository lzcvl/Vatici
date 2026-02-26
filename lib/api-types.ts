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
  resolution: 'YES' | 'NO' | null
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
