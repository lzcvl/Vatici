"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n"
import { formatBRL, formatPercent, getNoPrice } from "@/lib/mock-data"
import { apiGet } from "@/lib/api"
import type { FrontendMarket } from "@/lib/api-types"
import { Button } from "@/components/ui/button"
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  TrendingUp,
  TrendingDown,
  Eye,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react"
import { OrigamiCrane, OrigamiDiamond } from "./origami-icons"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

// ---- types ----
type SortKey = "value" | "pnl" | "market"
type SortDir = "asc" | "desc"
type TabKey = "positions" | "closed" | "watchlist"

function enrichBet(bet: Bet) {
  const market = markets.find((m) => m.id === bet.marketId)
  const currentPrice = market
    ? bet.direction === "YES"
      ? market.probability
      : getNoPrice(market)
    : bet.avgPrice
  const currentValue = bet.shares * currentPrice
  const invested = bet.amount
  const profit = currentValue - invested
  const profitPercent = invested > 0 ? (profit / invested) * 100 : 0
  return { ...bet, market, currentPrice, currentValue, invested, profit, profitPercent }
}

interface UserPosition {
  marketId: string
  direction: 'YES' | 'NO'
  shares: number
  investedAmount: number
  market: FrontendMarket
}

export function PortfolioPage() {
  const { t, locale } = useI18n()
  const [tab, setTab] = useState<TabKey>("positions")
  const [sortKey, setSortKey] = useState<SortKey>("value")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [expandedBet, setExpandedBet] = useState<string | null>(null)
  const [positions, setPositions] = useState<UserPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch positions on mount
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await apiGet<UserPosition[]>('/me/positions')
        setPositions(data || [])
      } catch (err) {
        console.error('Failed to fetch positions:', err)
        setError(err instanceof Error ? err.message : 'Failed to load positions')
      } finally {
        setLoading(false)
      }
    }

    fetchPositions()
  }, [])

  // Transform positions to enriched bets format
  const enrichedBets = useMemo(() => {
    return positions.map((pos) => {
      const currentPrice = pos.direction === 'YES' ? pos.market.probability : getNoPrice(pos.market)
      const currentValue = pos.shares * currentPrice
      const invested = pos.investedAmount
      const profit = currentValue - invested
      const profitPercent = invested > 0 ? (profit / invested) * 100 : 0
      return {
        id: `${pos.marketId}-${pos.direction}`,
        marketId: pos.marketId,
        direction: pos.direction as 'YES' | 'NO',
        amount: invested,
        shares: pos.shares,
        avgPrice: currentPrice,
        market: pos.market,
        currentPrice,
        currentValue,
        invested,
        profit,
        profitPercent,
      }
    })
  }, [positions])

  const sorted = useMemo(() => {
    const copy = [...enrichedBets]
    copy.sort((a, b) => {
      let diff = 0
      if (sortKey === "value") diff = a.currentValue - b.currentValue
      else if (sortKey === "pnl") diff = a.profit - b.profit
      else diff = (a.market?.question[locale] ?? "").localeCompare(b.market?.question[locale] ?? "")
      return sortDir === "desc" ? -diff : diff
    })
    return copy
  }, [enrichedBets, sortKey, sortDir, locale])

  const totalValue = enrichedBets.reduce((s, b) => s + b.currentValue, 0)
  const totalInvested = enrichedBets.reduce((s, b) => s + b.invested, 0)
  const totalProfit = totalValue - totalInvested
  const totalProfitPct = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0
  const isUp = totalProfit >= 0

  // mock portfolio history
  const portfolioHistory = useMemo(() => {
    const months = ["set", "out", "nov", "dez", "jan", "fev"]
    const base = totalInvested
    return months.map((m, i) => ({
      label: m,
      value: +(base + (totalProfit / months.length) * (i + 1) + (Math.sin(i * 1.5) * base * 0.04)).toFixed(2),
    }))
  }, [totalInvested, totalProfit])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(sortDir === "desc" ? "asc" : "desc")
    else { setSortKey(key); setSortDir("desc") }
  }

  const SortIcon = ({ active, dir }: { active: boolean; dir: SortDir }) =>
    active ? (dir === "desc" ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />) : null

  const tabs: { key: TabKey; label: string }[] = [
    { key: "positions", label: t("portfolio.openPositions") },
    { key: "closed", label: t("portfolio.closedPositions") },
  ]

  // Show loading state
  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Carregando portfólio...</p>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <p className="text-destructive">Erro ao carregar portfólio: {error}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* ── Top: Portfolio value chart + summary ── */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        {/* Chart area */}
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-1 flex items-center gap-2">
            <OrigamiDiamond className="h-5 w-5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">{t("portfolio.totalValue")}</span>
          </div>
          <div className="mb-1 flex items-baseline gap-3">
            <span className="text-3xl font-bold tracking-tight text-foreground">
              {formatBRL(totalValue)}
            </span>
            <span className={`flex items-center gap-0.5 text-sm font-semibold ${isUp ? "text-success" : "text-destructive"}`}>
              {isUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              {isUp ? "+" : ""}{totalProfitPct.toFixed(1)}%
            </span>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">
            {isUp ? "+" : ""}{formatBRL(totalProfit)} {t("portfolio.profit").toLowerCase()}
          </p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolioHistory}>
                <defs>
                  <linearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isUp ? "oklch(0.65 0.2 155)" : "oklch(0.55 0.22 25)"} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={isUp ? "oklch(0.65 0.2 155)" : "oklch(0.55 0.22 25)"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "oklch(0.65 0.02 270)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide domain={["dataMin - 20", "dataMax + 20"]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "oklch(0.17 0.025 270)",
                    border: "1px solid oklch(0.28 0.03 270)",
                    borderRadius: "8px",
                    color: "oklch(0.95 0.01 270)",
                    fontSize: "12px",
                  }}
                  formatter={(v: number) => [formatBRL(v), t("portfolio.totalValue")]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={isUp ? "oklch(0.65 0.2 155)" : "oklch(0.55 0.22 25)"}
                  strokeWidth={2}
                  fill="url(#portGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary column */}
        <div className="flex flex-col gap-4">
          {/* Cash balance */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-2 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">{t("portfolio.balance")}</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{formatBRL(currentUser.balance)}</div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" className="flex-1 bg-primary text-primary-foreground text-xs hover:bg-primary/90">
                {t("portfolio.deposit")}
              </Button>
              <Button size="sm" variant="outline" className="flex-1 border-border text-foreground text-xs hover:bg-secondary">
                {t("portfolio.withdraw")}
              </Button>
            </div>
          </div>

          {/* PnL */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-2 flex items-center gap-2">
              {isUp ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
              <span className="text-xs font-medium text-muted-foreground">{t("portfolio.profit")}</span>
            </div>
            <div className={`text-2xl font-bold ${isUp ? "text-success" : "text-destructive"}`}>
              {isUp ? "+" : ""}{formatBRL(totalProfit)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {isUp ? "+" : ""}{totalProfitPct.toFixed(1)}% {t("portfolio.profit").toLowerCase()}
            </p>
          </div>

          {/* Positions count */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-2 flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">{t("portfolio.positions")}</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{userBets.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {enrichedBets.filter((b) => b.profit >= 0).length} {t("portfolio.profit").split("/")[0].trim().toLowerCase()}
            </p>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="mb-4 flex items-center gap-1 border-b border-border">
        {tabs.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === item.key
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* ── Position table ── */}
      {tab === "positions" && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {/* Table head */}
          <div className="hidden items-center gap-4 border-b border-border px-5 py-3 text-xs font-medium text-muted-foreground md:grid md:grid-cols-12">
            <button className="col-span-5 flex items-center gap-1 text-left" onClick={() => toggleSort("market")}>
              {t("nav.markets")}
              <SortIcon active={sortKey === "market"} dir={sortDir} />
            </button>
            <span className="col-span-2 text-right">{t("detail.price")}</span>
            <button className="col-span-2 flex items-center justify-end gap-1" onClick={() => toggleSort("value")}>
              {t("portfolio.totalValue")}
              <SortIcon active={sortKey === "value"} dir={sortDir} />
            </button>
            <button className="col-span-2 flex items-center justify-end gap-1" onClick={() => toggleSort("pnl")}>
              {t("portfolio.profit")}
              <SortIcon active={sortKey === "pnl"} dir={sortDir} />
            </button>
            <span className="col-span-1" />
          </div>

          {/* Rows */}
          {sorted.map((bet) => {
            const isProfit = bet.profit >= 0
            const expanded = expandedBet === bet.id
            return (
              <div key={bet.id} className="border-b border-border last:border-b-0">
                {/* Main row */}
                <div
                  className="grid cursor-pointer items-center gap-4 px-5 py-4 transition-colors hover:bg-secondary/30 md:grid-cols-12"
                  onClick={() => setExpandedBet(expanded ? null : bet.id)}
                >
                  {/* Market + direction */}
                  <div className="col-span-5 flex items-start gap-3">
                    <span
                      className={`mt-0.5 inline-flex h-6 items-center rounded px-2 text-xs font-bold ${
                        bet.direction === "YES"
                          ? "bg-success/15 text-success"
                          : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {bet.direction === "YES" ? t("market.yes") : t("market.no")}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-tight text-foreground">
                        {bet.market?.question[locale] ?? bet.marketId}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {bet.shares.toFixed(1)} {t("detail.shares")} &middot; {t("detail.avgPrice")} R$ {bet.avgPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Current price */}
                  <div className="col-span-2 text-right">
                    <span className="text-sm font-semibold text-foreground">
                      {formatPercent(bet.currentPrice)}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      R$ {bet.currentPrice.toFixed(2)}
                    </p>
                  </div>

                  {/* Value */}
                  <div className="col-span-2 text-right">
                    <span className="text-sm font-bold text-foreground">
                      {formatBRL(bet.currentValue)}
                    </span>
                  </div>

                  {/* PnL */}
                  <div className="col-span-2 text-right">
                    <span className={`flex items-center justify-end gap-0.5 text-sm font-bold ${isProfit ? "text-success" : "text-destructive"}`}>
                      {isProfit ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                      {isProfit ? "+" : ""}{formatBRL(bet.profit)}
                    </span>
                    <p className={`text-xs ${isProfit ? "text-success/70" : "text-destructive/70"}`}>
                      {isProfit ? "+" : ""}{bet.profitPercent.toFixed(1)}%
                    </p>
                  </div>

                  {/* Expand icon */}
                  <div className="col-span-1 flex justify-end">
                    {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>

                {/* Expanded detail */}
                {expanded && (
                  <div className="border-t border-border bg-secondary/20 px-5 py-4">
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span>{t("detail.amount")}: {formatBRL(bet.invested)}</span>
                      <span>{t("detail.potentialReturn")}: {formatBRL(bet.potentialPayout)}</span>
                      <span>{t("detail.avgPrice")}: R$ {bet.avgPrice.toFixed(2)}</span>
                      <span>{t("detail.shares")}: {bet.shares.toFixed(1)}</span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline" className="border-border text-foreground text-xs hover:bg-secondary" asChild>
                        <Link href={`/mercado/${bet.marketId}`}>
                          <ExternalLink className="mr-1 h-3 w-3" />
                          {t("home.viewAll")}
                        </Link>
                      </Button>
                      <Button size="sm" className="bg-destructive/15 text-destructive text-xs hover:bg-destructive/25">
                        {t("market.sell")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {tab === "closed" && (
        <div className="rounded-xl border border-border bg-card px-5 py-16 text-center">
          <OrigamiCrane className="mx-auto mb-4 h-12 w-12 text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">{t("portfolio.noPositions")}</p>
        </div>
      )}

      {tab === "watchlist" && (
        <div className="rounded-xl border border-border bg-card px-5 py-16 text-center">
          <OrigamiCrane className="mx-auto mb-4 h-12 w-12 text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">{t("portfolio.noPositions")}</p>
        </div>
      )}
    </div>
  )
}
