"use client"

import { useI18n } from "@/lib/i18n"

const categories = [
  "all",
  "trending",
  "politics",
  "sports",
  "crypto",
  "science",
  "entertainment",
  "economy",
  "technology",
] as const

export function CategoryBar({
  selected,
  onSelect,
}: {
  selected: string
  onSelect: (cat: string) => void
}) {
  const { t } = useI18n()

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            selected === cat
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
          }`}
        >
          {t(`cat.${cat}` as Parameters<typeof t>[0])}
        </button>
      ))}
    </div>
  )
}
