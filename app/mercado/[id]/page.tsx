import type { Metadata } from 'next'
import { MarketDetail } from "@/components/vatici/market-detail"
import type { FrontendMarket } from "@/lib/api-types"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://vatici.com'

async function fetchMarket(id: string): Promise<FrontendMarket | null> {
  try {
    const res = await fetch(`${API_URL}/markets/${id}`, { next: { revalidate: 60 } })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function generateMetadata(
  props: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await props.params
  const market = await fetchMarket(id)

  if (!market) {
    return { title: 'Mercado não encontrado' }
  }

  const prob = Math.round(market.probability * 100)
  const vol = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(market.volume)
  const question = market.question.pt
  const title = question
  const description = `${prob}% de chance de SIM · Vol: ${vol} · ${market.description.pt.slice(0, 120)}`
  const pageUrl = `${APP_URL}/mercado/${id}`

  const images = market.iconUrl
    ? [{ url: market.iconUrl, width: 1200, height: 630, alt: question }]
    : undefined

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      type: 'article',
      url: pageUrl,
      siteName: 'VATICI',
      ...(images && { images }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      site: '@vaticiapp',
    },
  }
}

export default async function MercadoPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const market = await fetchMarket(id)

  const jsonLd = market
    ? {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: market.question.pt,
        description: market.description.pt,
        startDate: market.createdAt,
        endDate: market.closesAt,
        eventStatus:
          market.status === 'resolved'
            ? 'https://schema.org/EventCancelled'
            : 'https://schema.org/EventScheduled',
        organizer: {
          '@type': 'Organization',
          name: 'VATICI',
          url: APP_URL,
        },
        url: `${APP_URL}/mercado/${id}`,
      }
    : null

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <MarketDetail marketId={id} />
    </>
  )
}
