"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { TrendingUp, Bookmark } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import type { Market } from "@/lib/mock-data"
import { formatBRL, formatPercent, getNoPrice, getTopOptions } from "@/lib/mock-data"

/* ── Circular probability ring (SVG) ── */
function ProbabilityRing({ value, size = 48 }: { value: number; size?: number }) {
  const pct = Math.round(value * 100)
  const stroke = 3.5
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (value * circumference)

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="text-primary"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs font-bold tabular-nums leading-none text-foreground">{pct}%</span>
        <span className="text-[10px] text-muted-foreground leading-none mt-0.5">chance</span>
      </div>
    </div>
  )
}

/* ── Binary card actions (Yes / No buttons) ── */
function BinaryActions({ market }: { market: Market }) {
  const { t } = useI18n()
  const router = useRouter()

  return (
    <div className="flex gap-2">
      <button
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          router.push(`/mercado/${market.id}?action=buy&side=yes`)
        }}
        className="flex-1 cursor-pointer rounded-lg bg-success/15 py-2.5 text-center text-sm font-bold text-success transition-all hover:bg-success/25 active:scale-[0.98]"
      >
        {t("market.yes")}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          router.push(`/mercado/${market.id}?action=buy&side=no`)
        }}
        className="flex-1 cursor-pointer rounded-lg bg-destructive/15 py-2.5 text-center text-sm font-bold text-destructive transition-all hover:bg-destructive/25 active:scale-[0.98]"
      >
        {t("market.no")}
      </button>
    </div>
  )
}

/* ── Multi-option rows with Yes/No per option ── */
function MultiOptions({ market }: { market: Market }) {
  const { t, locale } = useI18n()
  const router = useRouter()
  const topOptions = getTopOptions(market, 4)
  const remaining = (market.options?.length ?? 0) - topOptions.length

  return (
    <div className="flex flex-col gap-1.5">
      {topOptions.map((opt) => {
        const pct = Math.round(opt.probability * 100)
        return (
          <div key={opt.id} className="flex items-center gap-2">
            <span className="flex-1 truncate text-sm font-medium text-foreground cursor-pointer hover:text-primary transition-colors">
              {opt.label[locale]}
            </span>
            <span className="shrink-0 w-11 text-right text-sm font-bold tabular-nums text-muted-foreground">
              {pct}%
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                router.push(`/mercado/${market.id}?action=buy&option=${opt.id}`)
              }}
              className="shrink-0 cursor-pointer rounded-md bg-success/15 px-2.5 py-1 text-xs font-bold text-success hover:bg-success/25 transition-colors"
            >
              {t("market.yes")}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                router.push(`/mercado/${market.id}?action=buy&option=${opt.id}&side=no`)
              }}
              className="shrink-0 cursor-pointer rounded-md bg-destructive/15 px-2.5 py-1 text-xs font-bold text-destructive hover:bg-destructive/25 transition-colors"
            >
              {t("market.no")}
            </button>
          </div>
        )
      })}
      {remaining > 0 && (
        <span className="text-xs text-muted-foreground mt-0.5">
          +{remaining} {locale === "pt" ? "opcoes" : locale === "es" ? "opciones" : "options"}
        </span>
      )}
    </div>
  )
}

/* ── Main MarketCard ── */
export function MarketCard({ market }: { market: Market }) {
  const { locale } = useI18n()
  const isMulti = market.type === "multi"

  return (
    <div className="group flex w-full flex-col rounded-xl border border-border bg-card transition-all hover:border-primary/40">
      {/* Clickable header: icon + question + probability ring */}
      <Link
        href={`/mercado/${market.id}`}
        className="flex items-start gap-3 p-4 pb-3 cursor-pointer"
      >
        {/* Icon */}
        {market.iconUrl && (
          <img
            src={market.iconUrl}
            alt=""
            width={40}
            height={40}
            className="shrink-0 rounded-lg object-cover mt-0.5"
            loading="lazy"
          />
        )}

        {/* Question + trending */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold leading-snug text-foreground group-hover:text-primary transition-colors text-balance">
            {market.question[locale]}
          </h3>
          {market.trending && (
            <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-accent">
              <TrendingUp className="h-3 w-3" />
              Em alta
            </span>
          )}
        </div>

        {/* Probability ring -- binary only */}
        {!isMulti && <ProbabilityRing value={market.probability} />}
      </Link>

      {/* Action area */}
      <div className="px-4 pb-3">
        {isMulti ? <MultiOptions market={market} /> : <BinaryActions market={market} />}
      </div>

      {/* Footer: volume + bookmark */}
      <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
        <span className="text-xs text-muted-foreground">{formatBRL(market.volume)} Vol.</span>
        <button
          onClick={(e) => e.stopPropagation()}
          className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Salvar"
        >
          <Bookmark className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
