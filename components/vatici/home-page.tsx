"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n"
import { formatBRL, formatPercent, getNoPrice, getTopOptions } from "@/lib/mock-data"
import { apiGet } from "@/lib/api"
import type { FrontendMarket } from "@/lib/api-types"
import { CategoryBar } from "./category-bar"
import { MarketCard } from "./market-card"
import { ArrowRight, TrendingUp } from "lucide-react"
import { OrigamiDiamond } from "./origami-icons"

export function HomePage() {
  const { t, locale } = useI18n()
  const router = useRouter()
  const [category, setCategory] = useState("all")
  const [markets, setMarkets] = useState<FrontendMarket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch markets on mount
  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await apiGet<FrontendMarket[]>('/markets?status=open&limit=100')
        setMarkets(data || [])
      } catch (err) {
        console.error('Failed to fetch markets:', err)
        setError(err instanceof Error ? err.message : 'Failed to load markets')
      } finally {
        setLoading(false)
      }
    }

    fetchMarkets()
  }, [])

  const filteredMarkets = useMemo(() => {
    if (category === "all") return markets
    if (category === "trending") return markets.filter((m) => m.trending)
    return markets.filter((m) => m.category === category)
  }, [category, markets])

  const trendingMarkets = useMemo(
    () => markets.filter((m) => m.trending).slice(0, 3),
    [markets]
  )

  const topVolumeMarkets = useMemo(
    () => [...markets].sort((a, b) => b.volume - a.volume).slice(0, 6),
    []
  )

  // Show loading state
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Carregando mercados...</p>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-destructive">Erro ao carregar mercados: {error}</p>
      </div>
    )
  }

  return (
    <div>
      {/* Featured / Trending - prominent top section */}
      <section className="mx-auto max-w-7xl px-4 pt-6 pb-2">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-bold text-foreground">{t("home.trending")}</h2>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            {t("home.viewAll")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trendingMarkets.length > 0 ? (
            trendingMarkets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))
          ) : (
            <p className="col-span-full text-center text-muted-foreground py-8">
              {t("home.noTrendingMarkets") || "Nenhum mercado em alta no momento"}
            </p>
          )}
        </div>
      </section>

      {/* Top Volume - compact horizontal list */}
      <section className="mx-auto max-w-7xl px-4 py-6">
        <h2 className="mb-4 text-lg font-bold text-foreground">{t("home.topVolume")}</h2>
        {topVolumeMarkets.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {topVolumeMarkets.map((market) => {
            const isMulti = market.type === "multi"
            const yesPercent = Math.round(market.probability * 100)
            const topOpts = isMulti ? getTopOptions(market, 3) : []

            return (
              <div
                key={market.id}
                className="flex flex-col rounded-xl border border-border bg-card p-3 transition-all hover:border-primary/40"
              >
                {/* Top row: icon + question */}
                <div className="flex items-start gap-3">
                  {market.iconUrl ? (
                    <img
                      src={market.iconUrl}
                      alt=""
                      width={36}
                      height={36}
                      className="shrink-0 rounded-lg object-cover"
                      loading="lazy"
                    />
                  ) : !isMulti ? (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <span className="text-xs font-bold tabular-nums text-primary">{yesPercent}%</span>
                    </div>
                  ) : null}
                  <div className="flex-1 min-w-0">
                    <Link href={`/mercado/${market.id}`} className="cursor-pointer">
                      <h3 className="text-sm font-bold leading-snug text-foreground hover:text-primary transition-colors text-balance">
                        {market.question[locale]}
                      </h3>
                    </Link>
                    <span className="text-xs text-muted-foreground">{formatBRL(market.volume)} vol.</span>
                  </div>
                </div>

                {/* Bottom row: actions */}
                {isMulti ? (
                  <div className="mt-2.5 flex flex-col gap-1.5">
                    {topOpts.map((opt) => {
                      const pct = Math.round(opt.probability * 100)
                      return (
                        <div
                          key={opt.id}
                          className="flex items-center gap-1.5"
                        >
                          <span className="flex-1 truncate text-xs font-medium text-foreground cursor-pointer hover:text-primary transition-colors">
                            {opt.label[locale]}
                          </span>
                          <span className="shrink-0 w-10 text-right text-xs font-bold tabular-nums text-muted-foreground">
                            {pct}%
                          </span>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              router.push(`/mercado/${market.id}?action=buy&option=${opt.id}`)
                            }}
                            className="shrink-0 cursor-pointer rounded bg-success/10 px-2 py-1 text-xs font-bold text-success hover:bg-success/20 transition-colors"
                          >
                            {t("market.yes")}
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              router.push(`/mercado/${market.id}?action=buy&option=${opt.id}&side=no`)
                            }}
                            className="shrink-0 cursor-pointer rounded bg-destructive/10 px-2 py-1 text-xs font-bold text-destructive hover:bg-destructive/20 transition-colors"
                          >
                            {t("market.no")}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="mt-2.5 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        router.push(`/mercado/${market.id}?action=buy&side=yes`)
                      }}
                      className="flex-1 cursor-pointer rounded-md bg-success/10 py-1.5 text-xs font-bold text-success hover:bg-success/20 transition-colors tabular-nums"
                    >
                      {t("market.yes")} {formatPercent(market.probability)}
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        router.push(`/mercado/${market.id}?action=buy&side=no`)
                      }}
                      className="flex-1 cursor-pointer rounded-md bg-destructive/10 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/20 transition-colors tabular-nums"
                    >
                      {t("market.no")} {formatPercent(getNoPrice(market))}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        )}
      </section>

      {/* All Markets with Category Filter */}
      <section className="mx-auto max-w-7xl px-4 py-6">
        <h2 className="mb-4 text-lg font-bold text-foreground">{t("nav.markets")}</h2>
        <CategoryBar selected={category} onSelect={setCategory} />
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMarkets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
        {filteredMarkets.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            Nenhum mercado encontrado nesta categoria.
          </div>
        )}
      </section>
    </div>
  )
}
