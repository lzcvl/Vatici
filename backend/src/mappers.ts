/**
 * Data Mappers
 *
 * Converts database rows (snake_case, amounts in cents, plain strings)
 * into frontend types (camelCase, amounts in BRL, i18n objects)
 */

/**
 * Frontend type definitions (from lib/mock-data.ts)
 * These are what the API returns to the client
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

/**
 * Database row types (from Neon PostgreSQL)
 */
export interface DbMarket {
  id: string
  question: string
  description: string | null
  category: string | null
  market_type: 'binary' | 'multi'
  pool_yes: number // cents (BIGINT)
  pool_no: number // cents (BIGINT)
  p: number | string // 0.0 to 1.0, comes as decimal/string from DB
  status: string
  closes_at: string
  resolved_at: string | null
  resolution_result: string | null
  total_volume: number // cents
  is_trending: boolean
  icon_url: string | null
  created_at: string
}

export interface DbAnswer {
  id: string
  market_id: string
  text: string
  index: number
  pool_yes: number // cents
  pool_no: number // cents
  volume: number // cents
  resolution: string | null
}

export interface DbBet {
  id: string
  user_id: string
  user_name: string
  market_id: string
  outcome: 'YES' | 'NO'
  amount: number // cents
  shares: number // stored as cents-equivalent
  prob_before: number
  prob_after: number
  created_at: string
}

/**
 * Helper: wrap plain string in i18n object
 * (all pt/en/es keys point to the same string)
 */
function wrapI18n(text: string): { pt: string; en: string; es: string } {
  return { pt: text || '', en: text || '', es: text || '' }
}

/**
 * Helper: calculate probability from pools
 */
function calculateProbability(poolYes: number, poolNo: number): number {
  const total = poolYes + poolNo
  if (total === 0) return 0.5
  return poolNo / total
}

/**
 * Map a single market (binary or multi with answers)
 */
export function mapMarket(
  market: DbMarket,
  answers: DbAnswer[] = []
): FrontendMarket {
  const probability = calculateProbability(market.pool_yes, market.pool_no)

  const options: FrontendMarketOption[] | undefined =
    market.market_type === 'multi'
      ? answers.map((answer) => ({
          id: answer.id,
          label: wrapI18n(answer.text),
          probability: calculateProbability(answer.pool_yes, answer.pool_no),
          pool: answer.pool_yes / 100 + answer.pool_no / 100, // cents -> BRL
        }))
      : undefined

  return {
    id: market.id,
    type: market.market_type,
    question: wrapI18n(market.question),
    description: wrapI18n(market.description || ''),
    category: market.category || 'general',
    probability,
    volume: market.total_volume / 100, // cents -> BRL
    yesPool: market.pool_yes / 100,
    noPool: market.pool_no / 100,
    options,
    closesAt: market.closes_at,
    resolvedAt: market.resolved_at,
    resolution: (market.resolution_result as 'YES' | 'NO' | null) || null,
    createdAt: market.created_at,
    trending: market.is_trending,
    iconUrl: market.icon_url || undefined,
    probabilityHistory: [], // loaded separately if needed
  }
}

/**
 * Map a bet from database
 */
export function mapBet(bet: DbBet): FrontendBet {
  return {
    id: bet.id,
    userId: bet.user_id,
    userName: bet.user_name,
    marketId: bet.market_id,
    direction: bet.outcome, // DB outcome -> frontend direction
    amount: bet.amount / 100, // cents -> BRL
    shares: bet.shares / 100,
    avgPrice: bet.prob_before,
    potentialPayout: bet.shares / 100, // simplified
    createdAt: bet.created_at,
  }
}

/**
 * Map user balance
 */
export function mapBalance(balanceCents: number): { balance: number } {
  return {
    balance: balanceCents / 100, // cents -> BRL
  }
}

/**
 * Error response
 */
export interface ErrorResponse {
  error: string
  message?: string
  code?: string
}

/**
 * Success response wrapper
 */
export function successResponse<T>(data: T, statusCode: number = 200) {
  return {
    data,
    statusCode,
  }
}
