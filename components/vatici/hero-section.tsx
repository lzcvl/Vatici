"use client"

import Link from "next/link"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { OrigamiCrane, OrigamiStar } from "./origami-icons"
import { ArrowRight } from "lucide-react"

export function HeroSection() {
  const { t } = useI18n()

  return (
    <section className="relative overflow-hidden border-b border-border bg-card">
      {/* Decorative origami elements */}
      <div className="pointer-events-none absolute -right-8 -top-8 text-primary/5">
        <OrigamiCrane className="h-64 w-64" />
      </div>
      <div className="pointer-events-none absolute -left-4 bottom-4 text-accent/5">
        <OrigamiStar className="h-40 w-40" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 md:py-24">
        <div className="flex max-w-2xl flex-col gap-6">
          <div className="flex items-center gap-2">
            <OrigamiCrane className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium text-primary">VATICI</span>
          </div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-foreground md:text-5xl text-balance">
            {t("home.hero")}
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground md:text-lg text-pretty">
            {t("home.heroSub")}
          </p>
          <div className="flex items-center gap-3">
            <Link href="/cadastro">
              <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                {t("home.startTrading")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="outline" className="border-border text-foreground hover:bg-secondary">
              {t("footer.docs")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
