"use client"

import { useEffect, useState } from "react"
import { useI18n } from "@/lib/i18n"
import { formatBRL, formatDate, formatTime } from "@/lib/mock-data"
import { apiGet } from "@/lib/api"
import { OrigamiCrane, OrigamiArrowUp, OrigamiArrowDown } from "./origami-icons"

interface Activity {
  id: string
  type: 'bet'
  marketId: string
  direction?: 'YES' | 'NO'
  amount: number
  shares?: number
  createdAt: string
  market?: {
    id: string
    question: { pt: string; en: string; es: string }
    type: string
  }
}

export function ActivityPage() {
  const { t, locale } = useI18n()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await apiGet<Activity[]>('/me/activity')
        setActivities(data || [])
      } catch (err) {
        console.error('Failed to fetch activity:', err)
        setError(err instanceof Error ? err.message : 'Failed to load activity')
      } finally {
        setLoading(false)
      }
    }

    fetchActivity()
  }, [])

  // Show loading state
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Carregando atividade...</p>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-destructive">Erro ao carregar atividade: {error}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <OrigamiCrane className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          {t("nav.activity")}
        </h1>
      </div>

      <div className="flex flex-col gap-3">
        {activities.map((activity) => {
          const dateStr = formatDate(activity.createdAt, locale)
          const timeStr = formatTime(activity.createdAt)

          return (
            <div
              key={activity.id}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10">
                <OrigamiArrowUp className="h-5 w-5 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="truncate text-sm font-semibold text-foreground">
                  {activity.market?.question[locale as 'pt' | 'en' | 'es'] ?? activity.marketId}
                </h3>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-bold uppercase text-success">
                    {t("market.buy")}
                  </span>
                  <span className="text-border">|</span>
                  <span
                    className={`rounded-md px-1.5 py-0.5 font-bold ${
                      activity.direction === "YES"
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {activity.direction === "YES" ? t("market.yes") : t("market.no")}
                  </span>
                  <span>
                    {activity.shares.toFixed(1)} {t("detail.shares")}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-foreground">
                  {formatBRL(activity.amount)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {dateStr} {timeStr}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
