"use client"

import { useState, useMemo } from "react"
import type { ProbabilityHistory } from "@/lib/mock-data"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from "recharts"

// ── Tipos ──────────────────────────────────────────────
interface ProbabilityChartProps {
  history: ProbabilityHistory[]
  currentProbability: number
}

type FilterKey = "1S" | "1M" | "3M" | "ALL"

// ── Helpers ────────────────────────────────────────────
const SHORT_MONTHS = [
  "jan","fev","mar","abr","mai","jun",
  "jul","ago","set","out","nov","dez",
]

function formatChartDate(dateStr: string): string {
  const parts = dateStr.split("-")
  const monthIdx = parseInt(parts[1], 10) - 1
  const day = parts[2] ? parseInt(parts[2], 10) : null
  const month = SHORT_MONTHS[monthIdx] ?? parts[1]
  return day ? `${day} ${month}` : month
}

function filterByRange(
  data: ProbabilityHistory[],
  key: FilterKey,
): ProbabilityHistory[] {
  if (key === "ALL") return data
  const now = new Date("2026-02-25")
  const ms: Record<Exclude<FilterKey, "ALL">, number> = {
    "1S": 7 * 24 * 60 * 60 * 1000,
    "1M": 30 * 24 * 60 * 60 * 1000,
    "3M": 90 * 24 * 60 * 60 * 1000,
  }
  const cutoff = new Date(now.getTime() - ms[key])
  return data.filter((d) => {
    const dStr = d.date.length <= 7 ? `${d.date}-01` : d.date
    return new Date(dStr) >= cutoff
  })
}

// ── Cores ──────────────────────────────────────────────
const COLORS = {
  yes: {
    stroke: "oklch(0.65 0.2 155)",
    fillStart: "oklch(0.65 0.2 155)",
  },
  no: {
    stroke: "oklch(0.60 0.2 25)",
    fillStart: "oklch(0.60 0.2 25)",
  },
}

// ── Custom Tooltip ─────────────────────────────────────
function ChartTooltip({
  active,
  payload,
  label,
  visibleLines,
}: {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string }>
  label?: string
  visibleLines: { yes: boolean; no: boolean }
}) {
  if (!active || !payload?.length || !label) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-medium text-muted-foreground">
        {formatChartDate(String(label))}
      </p>
      {payload.map((entry) => {
        const isYes = entry.dataKey === "yes"
        if (isYes && !visibleLines.yes) return null
        if (!isYes && !visibleLines.no) return null
        return (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: isYes ? COLORS.yes.stroke : COLORS.no.stroke }}
            />
            <span className="text-xs text-muted-foreground">
              {isYes ? "Sim" : "Nao"}:
            </span>
            <span className="text-sm font-bold text-foreground">{entry.value}%</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Componente Principal ───────────────────────────────
export function ProbabilityChart({ history, currentProbability }: ProbabilityChartProps) {
  const [filter, setFilter] = useState<FilterKey>("ALL")
  const [visibleLines, setVisibleLines] = useState({ yes: true, no: true })

  const filters: FilterKey[] = ["1S", "1M", "3M", "ALL"]

  const filteredData = useMemo(() => filterByRange(history, filter), [history, filter])

  const chartData = useMemo(
    () =>
      filteredData.map((h) => ({
        date: h.date,
        yes: Math.round(h.probability * 100),
        no: Math.round((1 - h.probability) * 100),
      })),
    [filteredData],
  )

  const finalData = useMemo(() => {
    if (chartData.length === 0) {
      const yesVal = Math.round(currentProbability * 100)
      return [{ date: "Agora", yes: yesVal, no: 100 - yesVal }]
    }
    return chartData
  }, [chartData, currentProbability])

  const yesPercent = Math.round(currentProbability * 100)
  const noPercent = 100 - yesPercent

  function toggleLine(line: "yes" | "no") {
    setVisibleLines((prev) => {
      const next = { ...prev, [line]: !prev[line] }
      // Impede desligar ambas
      if (!next.yes && !next.no) return prev
      return next
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {/* Legend / toggle botoes */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleLine("yes")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
              visibleLines.yes
                ? "bg-success/15 text-success ring-1 ring-success/30"
                : "bg-secondary text-muted-foreground opacity-50"
            }`}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: COLORS.yes.stroke }}
            />
            Sim {yesPercent}%
          </button>
          <button
            onClick={() => toggleLine("no")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
              visibleLines.no
                ? "bg-destructive/15 text-destructive ring-1 ring-destructive/30"
                : "bg-secondary text-muted-foreground opacity-50"
            }`}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: COLORS.no.stroke }}
            />
            Nao {noPercent}%
          </button>
        </div>

        {/* Filtros de periodo */}
        <div className="flex rounded-lg bg-secondary p-0.5">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "ALL" ? "Tudo" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Grafico */}
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={finalData}
            margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
          >
            <defs>
              <linearGradient id="gradYes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.yes.fillStart} stopOpacity={0.3} />
                <stop offset="100%" stopColor={COLORS.yes.fillStart} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradNo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.no.fillStart} stopOpacity={0.3} />
                <stop offset="100%" stopColor={COLORS.no.fillStart} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="date"
              tickFormatter={formatChartDate}
              tick={{ fontSize: 11, fill: "oklch(0.65 0.02 270)" }}
              axisLine={false}
              tickLine={false}
              tickMargin={8}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tick={{ fontSize: 11, fill: "oklch(0.65 0.02 270)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v}%`}
              width={40}
            />

            {/* Linha tracejada 50% */}
            <ReferenceLine
              y={50}
              stroke="oklch(0.40 0.02 270)"
              strokeDasharray="6 4"
              strokeWidth={1}
            />

            <Tooltip
              content={<ChartTooltip visibleLines={visibleLines} />}
              cursor={{
                stroke: "oklch(0.40 0.02 270)",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
            />

            {/* Area YES */}
            {visibleLines.yes && (
              <Area
                type="monotone"
                dataKey="yes"
                stroke={COLORS.yes.stroke}
                strokeWidth={2.5}
                fill="url(#gradYes)"
                dot={false}
                activeDot={{
                  r: 5,
                  fill: COLORS.yes.stroke,
                  stroke: "oklch(0.17 0.025 270)",
                  strokeWidth: 2,
                }}
              />
            )}

            {/* Area NO */}
            {visibleLines.no && (
              <Area
                type="monotone"
                dataKey="no"
                stroke={COLORS.no.stroke}
                strokeWidth={2.5}
                fill="url(#gradNo)"
                dot={false}
                activeDot={{
                  r: 5,
                  fill: COLORS.no.stroke,
                  stroke: "oklch(0.17 0.025 270)",
                  strokeWidth: 2,
                }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
