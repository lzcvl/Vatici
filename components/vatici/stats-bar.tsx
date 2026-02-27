"use client"

import { useEffect, useState } from "react"
import { formatBRL } from "@/lib/mock-data"
import { apiGet } from "@/lib/api"
import type { FrontendMarket } from "@/lib/api-types"
import { OrigamiDiamond, OrigamiBird, OrigamiStar } from "./origami-icons"

export function StatsBar() {
  const [totalVolume, setTotalVolume] = useState<number | null>(null)
  const [totalMarkets, setTotalMarkets] = useState<number | null>(null)

  useEffect(() => {
    apiGet<FrontendMarket[]>('/markets')
      .then((markets) => {
        setTotalVolume(markets.reduce((sum, m) => sum + m.volume, 0))
        setTotalMarkets(markets.length)
      })
      .catch(() => {
        setTotalVolume(0)
        setTotalMarkets(0)
      })
  }, [])

  return (
    <div className="border-b border-border bg-card/50">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-8 px-4 py-4 md:gap-16">
        <div className="flex items-center gap-2 text-center">
          <OrigamiDiamond className="h-5 w-5 text-primary" />
          <div>
            <div className="text-lg font-bold text-foreground md:text-xl">
              {totalVolume !== null ? formatBRL(totalVolume) : '...'}
            </div>
            <div className="text-xs text-muted-foreground">Volume Total</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-center">
          <OrigamiBird className="h-5 w-5 text-accent" />
          <div>
            <div className="text-lg font-bold text-foreground md:text-xl">BRL</div>
            <div className="text-xs text-muted-foreground">Moeda</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-center">
          <OrigamiStar className="h-5 w-5 text-chart-3" />
          <div>
            <div className="text-lg font-bold text-foreground md:text-xl">
              {totalMarkets !== null ? totalMarkets : '...'}
            </div>
            <div className="text-xs text-muted-foreground">Mercados</div>
          </div>
        </div>
      </div>
    </div>
  )
}
