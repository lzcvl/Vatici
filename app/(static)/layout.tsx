import type { ReactNode } from "react"

export default function StaticLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
      {children}
    </div>
  )
}
