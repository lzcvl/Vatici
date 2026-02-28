import { Suspense } from "react"
import { HomePage } from "@/components/vatici/home-page"
import { HomePageSkeleton } from "@/components/vatici/home-page-skeleton"
import type { FrontendMarket } from "@/lib/api-types"

// Fetch markets on the server with ISR cache (revalidates every 60s)
async function HomePageData() {
  let initialMarkets: FrontendMarket[] = []
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
    const res = await fetch(`${apiUrl}/markets?status=open&limit=100`, {
      next: { revalidate: 60 },
    })
    if (res.ok) {
      initialMarkets = await res.json()
    }
  } catch {
    // silently fail — HomePage will show empty state
  }
  return <HomePage initialMarkets={initialMarkets} />
}

export default function Page() {
  return (
    <Suspense fallback={<HomePageSkeleton />}>
      <HomePageData />
    </Suspense>
  )
}
