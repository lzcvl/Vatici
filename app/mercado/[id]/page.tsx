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
    return { title: 'Mercado — VATICI' }
  }

  const prob = Math.round(market.probability * 100)
  const vol = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(market.volume)
  const question = market.question.pt
  const title = `${question} — VATICI`
  const description = `${prob}% de chance · Vol: ${vol} · Aposte agora no maior mercado de predições do Brasil.`
  const pageUrl = `${APP_URL}/mercado/${id}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: pageUrl,
      siteName: 'VATICI',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      site: '@vatici',
    },
  }
}

export default async function MercadoPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  return <MarketDetail marketId={id} />
}
