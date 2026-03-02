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

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://vatici.com/#organization',
      name: 'VATICI',
      url: 'https://vatici.com',
      description:
        'Plataforma brasileira de mercados de previsão. Compre e venda cotas em eventos do mundo real.',
      logo: {
        '@type': 'ImageObject',
        url: 'https://vatici.com/images/vatici-logo.png',
      },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://vatici.com/#website',
      name: 'VATICI',
      url: 'https://vatici.com',
      publisher: { '@id': 'https://vatici.com/#organization' },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://vatici.com/?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
}

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<HomePageSkeleton />}>
        <HomePageData />
      </Suspense>
    </>
  )
}
