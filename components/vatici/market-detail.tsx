"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, TrendingUp, Clock, Share2, Bookmark, Loader2, CheckCircle, AlertTriangle } from "lucide-react"
import { useSession } from "next-auth/react"
import { useI18n } from "@/lib/i18n"
import { formatBRL, formatPercent, formatDateShort, getNoPrice } from "@/lib/mock-data"
import { apiGet, apiGetAuth, apiPostAuth } from "@/lib/api"
import type { FrontendMarket, ResolutionInfo } from "@/lib/api-types"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OrigamiDiamond, OrigamiArrowUp, OrigamiArrowDown } from "./origami-icons"
import { MarketCard } from "./market-card"
import { ProbabilityChart } from "./probability-chart"

// ── Position type for sell panel ───────────────────────────
interface MarketPosition {
  direction: "YES" | "NO"
  shares: number
  investedAmount: number
}

// ── Binary trading sidebar ──────────────────────────────────
function BinaryTradingPanel({ market, accessToken }: { market: FrontendMarket; accessToken?: string }) {
  const { t } = useI18n()
  const [side, setSide] = useState<"YES" | "NO">("YES")
  const [amount, setAmount] = useState("")
  const [action, setAction] = useState<"buy" | "sell">("buy")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Sell panel state
  const [positions, setPositions] = useState<MarketPosition[]>([])
  const [loadingPositions, setLoadingPositions] = useState(false)

  const yesPercent = Math.round(market.probability * 100)
  const noPercent = Math.round(getNoPrice(market) * 100)
  const price = side === "YES" ? market.probability : getNoPrice(market)
  const numericAmount = parseFloat(amount) || 0
  const shares = numericAmount > 0 ? numericAmount / price : 0
  const potentialReturn = shares - numericAmount

  // Fetch user's positions when sell tab is selected
  useEffect(() => {
    if (action === "sell" && accessToken) {
      setLoadingPositions(true)
      apiGetAuth<MarketPosition[]>(`/me/position/${market.id}`, accessToken)
        .then(setPositions)
        .catch(() => setPositions([]))
        .finally(() => setLoadingPositions(false))
    }
  }, [action, accessToken, market.id])

  // Handle bet submission
  const handlePlaceBet = async () => {
    try {
      setIsSubmitting(true)
      setSubmitError(null)
      setSubmitSuccess(false)

      if (!accessToken) {
        setSubmitError('Você precisa estar logado para apostar.')
        return
      }

      const amountInCents = Math.round(numericAmount * 100)
      const betResponse = await apiPostAuth<{ id: string }>('/bets', {
        marketId: market.id,
        direction: side,
        amount: amountInCents,
      }, accessToken)

      if (betResponse.id) {
        setSubmitSuccess(true)
        setAmount("")
        setTimeout(() => setSubmitSuccess(false), 3000)
      }
    } catch (err) {
      console.error('Failed to place bet:', err)
      setSubmitError(err instanceof Error ? err.message : 'Falha ao apostar.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle sell submission
  const handleSell = async (pos: MarketPosition) => {
    try {
      setIsSubmitting(true)
      setSubmitError(null)
      setSubmitSuccess(false)

      if (!accessToken) {
        setSubmitError('Você precisa estar logado.')
        return
      }

      const res = await apiPostAuth<{ payout: number }>('/bets/sell', {
        marketId: market.id,
        direction: pos.direction,
        shares: pos.shares,
      }, accessToken)

      setSubmitSuccess(true)
      setPositions((prev) => prev.filter((p) => p.direction !== pos.direction))
      setTimeout(() => setSubmitSuccess(false), 4000)
      const _ = res // payout available but we show generic success
    } catch (err) {
      console.error('Failed to sell:', err)
      setSubmitError(err instanceof Error ? err.message : 'Falha ao vender posição.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Buy/Sell Toggle */}
      <div className="mb-4 flex rounded-lg bg-secondary p-1">
        <button
          onClick={() => setAction("buy")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-all ${
            action === "buy" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          <span className="flex items-center justify-center gap-1">
            <OrigamiArrowUp className="h-3.5 w-3.5" />
            {t("market.buy")}
          </span>
        </button>
        <button
          onClick={() => setAction("sell")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-all ${
            action === "sell" ? "bg-destructive text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          <span className="flex items-center justify-center gap-1">
            <OrigamiArrowDown className="h-3.5 w-3.5" />
            {t("market.sell")}
          </span>
        </button>
      </div>

      {action === "buy" ? (
        <>
          {/* Yes/No Selector */}
          <div className="mb-4">
            <label className="mb-2 block text-xs font-medium text-muted-foreground">Outcome</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSide("YES")}
                className={`flex-1 rounded-lg border px-4 py-3 text-center transition-all ${
                  side === "YES" ? "border-success bg-success/10 text-success" : "border-border text-muted-foreground hover:border-border/80"
                }`}
              >
                <div className="text-xs font-medium">{t("market.yes")}</div>
                <div className="text-lg font-bold">{yesPercent}%</div>
              </button>
              <button
                onClick={() => setSide("NO")}
                className={`flex-1 rounded-lg border px-4 py-3 text-center transition-all ${
                  side === "NO" ? "border-destructive bg-destructive/10 text-destructive" : "border-border text-muted-foreground hover:border-border/80"
                }`}
              >
                <div className="text-xs font-medium">{t("market.no")}</div>
                <div className="text-lg font-bold">{noPercent}%</div>
              </button>
            </div>
          </div>

          <AmountInput amount={amount} setAmount={setAmount} />

          {/* Buy summary */}
          <div className="mb-4 rounded-lg bg-secondary p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t("detail.price")}</span>
              <span className="text-foreground">R$ {price.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t("detail.shares")}</span>
              <span className="text-foreground">{shares.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t("detail.potentialReturn")}</span>
              <span className="font-bold text-success">
                +R$ {potentialReturn > 0 ? potentialReturn.toFixed(2) : "0,00"}
              </span>
            </div>
          </div>

          {submitError && (
            <div className="mb-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{submitError}</div>
          )}
          {submitSuccess && (
            <div className="mb-3 rounded-lg bg-success/10 p-3 text-sm text-success">✓ Aposta realizada!</div>
          )}

          <Button
            onClick={handlePlaceBet}
            className="w-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
            disabled={numericAmount <= 0 || isSubmitting}
          >
            {isSubmitting ? t("detail.placingBet") || "Fazendo aposta..." : t("detail.placeBet")}
          </Button>
        </>
      ) : (
        /* ── Sell Panel ── */
        <>
          {!accessToken ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Faça login para ver suas posições.</p>
          ) : loadingPositions ? (
            <div className="py-8 text-center">
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : positions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Você não tem posições neste mercado.</p>
          ) : (
            <div className="space-y-3">
              {positions.map((pos) => {
                const currentProb = pos.direction === "YES" ? market.probability : getNoPrice(market)
                const estimatedPayout = pos.shares * currentProb * 0.98 // ~2% fee approximation
                return (
                  <div key={pos.direction} className="rounded-lg border border-border bg-secondary/30 p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <span className={`rounded px-2 py-0.5 text-xs font-bold ${
                        pos.direction === "YES" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                      }`}>{pos.direction}</span>
                      <span className="text-xs text-muted-foreground">{pos.shares.toFixed(2)} cotas</span>
                    </div>
                    <div className="mb-3 space-y-1 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Investido</span>
                        <span>{formatBRL(pos.investedAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Retorno estimado</span>
                        <span className="text-foreground">≈ {formatBRL(estimatedPayout)}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="w-full bg-destructive/15 text-destructive hover:bg-destructive/25"
                      onClick={() => handleSell(pos)}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Vendendo..." : `Vender todas as cotas ${pos.direction}`}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}

          {submitError && (
            <div className="mt-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{submitError}</div>
          )}
          {submitSuccess && (
            <div className="mt-3 rounded-lg bg-success/10 p-3 text-sm text-success">✓ Posição vendida com sucesso!</div>
          )}
        </>
      )}
    </>
  )
}

// ── Multi-option trading sidebar ────────────────────────────
function MultiTradingPanel({ market, accessToken }: { market: FrontendMarket; accessToken?: string }) {
  const { t, locale } = useI18n()
  const options = market.options ?? []
  const sorted = [...options].sort((a, b) => b.probability - a.probability)
  const [selectedOption, setSelectedOption] = useState(sorted[0])
  const [amount, setAmount] = useState("")
  const [action, setAction] = useState<"buy" | "sell">("buy")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const price = selectedOption.probability
  const numericAmount = parseFloat(amount) || 0
  const shares = numericAmount > 0 ? numericAmount / price : 0
  const potentialReturn = shares - numericAmount

  const handlePlaceBet = async () => {
    try {
      setIsSubmitting(true)
      setSubmitError(null)
      setSubmitSuccess(false)

      if (!accessToken) {
        setSubmitError('Você precisa estar logado para apostar.')
        return
      }

      const amountInCents = Math.round(numericAmount * 100)
      const betResponse = await apiPostAuth<{ id: string }>('/bets', {
        marketId: market.id,
        answerId: selectedOption.id,
        direction: 'YES',
        amount: amountInCents,
      }, accessToken)

      if (betResponse.id) {
        setSubmitSuccess(true)
        setAmount("")
        setTimeout(() => setSubmitSuccess(false), 3000)
      }
    } catch (err) {
      console.error('Failed to place bet:', err)
      setSubmitError(err instanceof Error ? err.message : 'Erro ao fazer aposta. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Buy/Sell Toggle */}
      <div className="mb-4 flex rounded-lg bg-secondary p-1">
        <button
          onClick={() => setAction("buy")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-all ${
            action === "buy" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          <span className="flex items-center justify-center gap-1">
            <OrigamiArrowUp className="h-3.5 w-3.5" />
            {t("market.buy")}
          </span>
        </button>
        <button
          onClick={() => setAction("sell")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-all ${
            action === "sell" ? "bg-destructive text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          <span className="flex items-center justify-center gap-1">
            <OrigamiArrowDown className="h-3.5 w-3.5" />
            {t("market.sell")}
          </span>
        </button>
      </div>

      {/* Option Selector */}
      <div className="mb-4">
        <label className="mb-2 block text-xs font-medium text-muted-foreground">
          {t("market.topOptions")}
        </label>
        <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
          {sorted.map((opt) => {
            const pct = Math.round(opt.probability * 100)
            const isSelected = selectedOption.id === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => setSelectedOption(opt)}
                className={`relative flex items-center justify-between overflow-hidden rounded-lg border px-3 py-2.5 text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border hover:border-border/80"
                }`}
              >
                <div
                  className={`absolute inset-y-0 left-0 transition-colors ${
                    isSelected ? "bg-primary/15" : "bg-primary/5"
                  }`}
                  style={{ width: `${pct}%` }}
                />
                <span className="relative z-10 truncate text-xs font-medium text-foreground pr-2">
                  {opt.label[locale]}
                </span>
                <span className={`relative z-10 shrink-0 text-sm font-bold tabular-nums ${
                  isSelected ? "text-primary" : "text-foreground"
                }`}>
                  {pct}%
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <AmountInput amount={amount} setAmount={setAmount} />

      {/* Summary */}
      <div className="mb-4 rounded-lg bg-secondary p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{t("detail.price")}</span>
          <span className="text-foreground">R$ {price.toFixed(2)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{t("detail.shares")}</span>
          <span className="text-foreground">{shares.toFixed(2)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{t("detail.potentialReturn")}</span>
          <span className="font-bold text-success">
            +R$ {potentialReturn > 0 ? potentialReturn.toFixed(2) : "0,00"}
          </span>
        </div>
      </div>

      {submitError && (
        <div className="mb-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {submitError}
        </div>
      )}

      {submitSuccess && (
        <div className="mb-3 rounded-lg bg-success/10 p-3 text-sm text-success">
          ✓ Aposta realizada com sucesso!
        </div>
      )}

      <Button
        onClick={handlePlaceBet}
        className={`w-full font-semibold ${
          action === "buy"
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-destructive text-primary-foreground hover:bg-destructive/90"
        }`}
        disabled={numericAmount <= 0 || isSubmitting}
      >
        {isSubmitting ? "Fazendo aposta..." : t("detail.placeBet")}
      </Button>
    </>
  )
}

// ── Shared amount input ─────────────────────────────────────
function AmountInput({
  amount,
  setAmount,
}: {
  amount: string
  setAmount: (v: string) => void
}) {
  const { t } = useI18n()
  return (
    <div className="mb-4">
      <label className="mb-2 block text-xs font-medium text-muted-foreground">
        {t("detail.amount")} (BRL)
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          R$
        </span>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0,00"
          className="h-11 w-full rounded-lg border border-border bg-secondary pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="mt-2 flex gap-2">
        {[25, 50, 100, 250].map((v) => (
          <button
            key={v}
            onClick={() => setAmount(v.toString())}
            className="flex-1 rounded-md bg-secondary py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground"
          >
            R${v}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Resolution Panel ────────────────────────────────────────
function ResolutionPanel({
  market,
  resolution,
  onVote,
  voteMsg,
  isVoting,
}: {
  market: FrontendMarket
  resolution: ResolutionInfo | null
  onVote: (vote: 'confirm' | 'dispute') => void
  voteMsg: string | null
  isVoting: boolean
}) {
  const { t } = useI18n()
  const { data: session } = useSession()

  if (market.status === 'closed' || market.status === 'ai_resolving') {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-muted/60 border border-border p-4">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t("resolution.aiAnalyzing")}</p>
      </div>
    )
  }

  if (market.status === 'ai_uncertain') {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-warning/10 border border-warning/20 p-4">
        <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
        <p className="text-sm text-warning">{t("resolution.aiUncertain")}</p>
      </div>
    )
  }

  if (market.status === 'disputed') {
    return (
      <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
        <p className="text-sm font-semibold text-destructive">{t("resolution.disputed")}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t("resolution.disputed.body")}</p>
      </div>
    )
  }

  if (market.status === 'resolved') {
    return (
      <div className="rounded-lg bg-success/10 border border-success/20 p-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-success" />
          <span className="text-sm font-semibold text-success">
            {t("resolution.resolved")}: {market.resolution ?? '—'}
          </span>
        </div>
        {resolution?.aiGroqReasoning && (
          <p className="mt-2 text-xs text-muted-foreground">{resolution.aiGroqReasoning}</p>
        )}
      </div>
    )
  }

  if (market.status === 'pending_resolution' && resolution) {
    const resolvesAt = resolution.resolvesAt ? new Date(resolution.resolvesAt) : null
    const hoursLeft = resolvesAt
      ? Math.max(0, Math.ceil((resolvesAt.getTime() - Date.now()) / 3_600_000))
      : 0

    return (
      <div className="rounded-lg bg-warning/10 border border-warning/20 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-warning">{t("resolution.pendingTitle")}</span>
          <span className="text-xs text-muted-foreground">{hoursLeft}{t("resolution.hoursRemaining")}</span>
        </div>

        <div className="rounded-md bg-background/60 px-3 py-2 text-sm">
          <span className="text-muted-foreground">{t("resolution.proposedResult")} </span>
          <span className="font-bold text-foreground">{resolution.result ?? '—'}</span>
        </div>

        {(resolution.aiGroqReasoning || resolution.aiGeminiReasoning) && (
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              {t("resolution.aiAnalysis")}
            </summary>
            <div className="mt-2 space-y-1 rounded-md bg-background/40 p-2">
              {resolution.aiGroqReasoning && (
                <p><span className="font-medium">{t("resolution.groqSays")}</span> {resolution.aiGroqReasoning} ({resolution.aiGroqConfidence}% {t("resolution.confidence")})</p>
              )}
              {resolution.aiGeminiReasoning && (
                <p><span className="font-medium">{t("resolution.geminiSays")}</span> {resolution.aiGeminiReasoning} ({resolution.aiGeminiConfidence}% {t("resolution.confidence")})</p>
              )}
            </div>
          </details>
        )}

        {voteMsg && (
          <p className="text-xs text-success">{voteMsg}</p>
        )}

        {session?.user && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-success/40 text-success hover:bg-success/10"
              onClick={() => onVote('confirm')}
              disabled={isVoting}
            >
              {t("resolution.confirm")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() => onVote('dispute')}
              disabled={isVoting}
            >
              {t("resolution.dispute")}
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          {resolution.confirmCount} {t("resolution.confirmations")} · {resolution.disputeCount} {t("resolution.disputes")}
        </p>
      </div>
    )
  }

  return null
}

// ── Main Page ───────────────────────────────────────────────
export function MarketDetail({ marketId }: { marketId: string }) {
  const { t, locale } = useI18n()
  const { data: session } = useSession()
  const [market, setMarket] = useState<FrontendMarket | null>(null)
  const [resolution, setResolution] = useState<ResolutionInfo | null>(null)
  const [relatedMarkets, setRelatedMarkets] = useState<FrontendMarket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isVoting, setIsVoting] = useState(false)
  const [voteMsg, setVoteMsg] = useState<string | null>(null)

  const fetchMarket = async () => {
    const marketData = await apiGet<FrontendMarket>(`/markets/${marketId}`)
    setMarket(marketData)

    // Fetch resolution details for non-open markets
    if (['pending_resolution', 'disputed', 'resolved', 'ai_uncertain'].includes(marketData.status)) {
      try {
        const res = await apiGet<ResolutionInfo>(`/resolutions/${marketId}`)
        setResolution(res)
      } catch {
        // No resolution yet, that's fine
      }
    }

    return marketData
  }

  // Fetch market and related markets on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const marketData = await fetchMarket()

        // Fetch related markets (same category)
        const allMarkets = await apiGet<FrontendMarket[]>('/markets?status=open&limit=100')
        const related = allMarkets
          .filter((m) => m.id !== marketId && m.category === marketData.category)
          .slice(0, 3)
        setRelatedMarkets(related)
      } catch (err) {
        console.error('Failed to fetch market:', err)
        setError(err instanceof Error ? err.message : 'Failed to load market')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketId])

  const handleVote = async (vote: 'confirm' | 'dispute') => {
    if (!session?.accessToken) return
    setIsVoting(true)
    setVoteMsg(null)
    try {
      await apiPostAuth(`/resolutions/${marketId}/${vote}`, {}, session.accessToken)
      setVoteMsg(t("resolution.voteRegistered"))
      // Refresh resolution counts
      const res = await apiGet<ResolutionInfo>(`/resolutions/${marketId}`)
      setResolution(res)
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("resolution.alreadyVoted")
      setVoteMsg(msg)
    } finally {
      setIsVoting(false)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Carregando mercado...</p>
      </div>
    )
  }

  // Show error state
  if (error || !market) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-destructive">Erro ao carregar mercado: {error || 'Mercado não encontrado'}</p>
      </div>
    )
  }

  const isMulti = market.type === "multi"
  const yesPercent = Math.round(market.probability * 100)
  const noPercent = Math.round(getNoPrice(market) * 100)
  const sortedOptions = isMulti
    ? [...(market.options ?? [])].sort((a, b) => b.probability - a.probability)
    : []

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Back Button */}
      <Link
        href="/"
        className="mb-6 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("nav.markets")}
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Header */}
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                <OrigamiDiamond className="h-3 w-3" />
                {t(`cat.${market.category}` as Parameters<typeof t>[0])}
              </span>
              {isMulti && market.options && (
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {market.options.length} {t("market.options")}
                </span>
              )}
              {market.trending && (
                <span className="flex items-center gap-1 rounded-md bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                  <TrendingUp className="h-3 w-3" />
                  {t("cat.trending")}
                </span>
              )}
              {market.status === 'pending_resolution' && (
                <span className="rounded-md bg-warning/10 px-2 py-0.5 text-xs font-bold text-warning">
                  {t("resolution.pendingTitle")}
                </span>
              )}
              {market.status === 'disputed' && (
                <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">
                  {t("resolution.disputed")}
                </span>
              )}
              {market.status === 'resolved' && market.resolution && (
                <span className="rounded-md bg-success/10 px-2 py-0.5 text-xs font-bold text-success">
                  {t("resolution.resolved")}: {market.resolution}
                </span>
              )}
            </div>
            <h1 className="mb-4 text-2xl font-bold text-foreground md:text-3xl text-balance">
              {market.question[locale]}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {t("market.endDate")}: {formatDateShort(market.closesAt, locale)}
              </span>
              <span>Vol: {formatBRL(market.volume)}</span>
            </div>
          </div>

          {/* Price Display */}
          {isMulti ? (
            /* All Options Table */
            <div className="mb-6 rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">
                  {t("market.topOptions")}
                </h3>
              </div>
              <div className="divide-y divide-border">
                {sortedOptions.map((opt, i) => {
                  const pct = Math.round(opt.probability * 100)
                  return (
                    <div
                      key={opt.id}
                      className="relative flex items-center justify-between px-4 py-3"
                    >
                      <div
                        className="absolute inset-y-0 left-0 bg-primary/5"
                        style={{ width: `${pct}%` }}
                      />
                      <div className="relative z-10 flex items-center gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {i + 1}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {opt.label[locale]}
                        </span>
                      </div>
                      <div className="relative z-10 flex items-center gap-3">
                        <span className="text-sm font-bold tabular-nums text-primary">
                          {pct}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatBRL(opt.pool)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            /* Binary YES/NO boxes */
            <div className="mb-6 flex gap-4">
              <div className="flex-1 rounded-xl border border-success/30 bg-success/5 p-4 text-center">
                <div className="mb-1 text-xs font-medium uppercase text-success">
                  {t("market.yes")}
                </div>
                <div className="text-3xl font-bold text-success">{yesPercent}%</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  R$ {market.probability.toFixed(2)}
                </div>
              </div>
              <div className="flex-1 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center">
                <div className="mb-1 text-xs font-medium uppercase text-destructive">
                  {t("market.no")}
                </div>
                <div className="text-3xl font-bold text-destructive">{noPercent}%</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  R$ {getNoPrice(market).toFixed(2)}
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="mb-6">
            <ProbabilityChart
              history={market.probabilityHistory}
              currentProbability={market.probability}
            />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="about" className="mb-6">
            <TabsList className="bg-secondary">
              <TabsTrigger value="about">{t("detail.about")}</TabsTrigger>
              <TabsTrigger value="rules">{t("detail.rules")}</TabsTrigger>
            </TabsList>
            <TabsContent value="about" className="mt-4">
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {market.description[locale]}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-secondary p-3">
                    <div className="text-xs text-muted-foreground">{t("market.volume")}</div>
                    <div className="text-lg font-bold text-foreground">{formatBRL(market.volume)}</div>
                  </div>
                  <div className="rounded-lg bg-secondary p-3">
                    <div className="text-xs text-muted-foreground">
                      {isMulti ? t("market.options") : "Pool YES / NO"}
                    </div>
                    <div className="text-sm font-bold text-foreground">
                      {isMulti
                        ? `${market.options?.length ?? 0} ${t("market.options")}`
                        : `${formatBRL(market.yesPool)} / ${formatBRL(market.noPool)}`}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="rules" className="mt-4">
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {market.description[locale]}
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="mb-6 flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-border text-muted-foreground"
              onClick={() => {
                const url = window.location.href
                if (navigator.share) {
                  navigator.share({ title: document.title, url })
                } else {
                  navigator.clipboard.writeText(url)
                }
              }}
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 border-border text-muted-foreground">
              <Bookmark className="h-4 w-4" />
              Save
            </Button>
          </div>

          {/* Related Markets */}
          {relatedMarkets.length > 0 && (
            <div>
              <h3 className="mb-4 text-lg font-bold text-foreground">
                {t("detail.relatedMarkets")}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedMarkets.map((m) => (
                  <MarketCard key={m.id} market={m} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 space-y-4">
            {/* Trading Panel — only when market is open */}
            {market.status === 'open' && (
              <div className="rounded-xl border border-border bg-card p-5">
                {isMulti ? (
                  <MultiTradingPanel market={market} accessToken={session?.accessToken} />
                ) : (
                  <BinaryTradingPanel market={market} accessToken={session?.accessToken} />
                )}
              </div>
            )}

            {/* Resolution Panel — for non-open states */}
            {market.status !== 'open' && (
              <div className="rounded-xl border border-border bg-card p-5">
                <ResolutionPanel
                  market={market}
                  resolution={resolution}
                  onVote={handleVote}
                  voteMsg={voteMsg}
                  isVoting={isVoting}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
