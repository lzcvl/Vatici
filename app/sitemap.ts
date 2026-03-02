import type { MetadataRoute } from 'next'
import type { FrontendMarket } from '@/lib/api-types'

const BASE_URL = 'https://vatici.com'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: BASE_URL,                         changeFrequency: 'hourly',  priority: 1.0 },
  { url: `${BASE_URL}/sobre`,              changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE_URL}/documentacao`,       changeFrequency: 'weekly',  priority: 0.6 },
  { url: `${BASE_URL}/blog`,               changeFrequency: 'weekly',  priority: 0.7 },
  { url: `${BASE_URL}/suporte`,            changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE_URL}/termos`,             changeFrequency: 'monthly', priority: 0.3 },
  { url: `${BASE_URL}/privacidade`,        changeFrequency: 'monthly', priority: 0.3 },
]

export const revalidate = 3600 // 1 hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const res = await fetch(`${API_URL}/markets?status=open&limit=500`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return STATIC_PAGES

    const markets: FrontendMarket[] = await res.json()
    const marketPages: MetadataRoute.Sitemap = markets.map((m) => ({
      url: `${BASE_URL}/mercado/${m.id}`,
      lastModified: new Date(m.closesAt),
      changeFrequency: 'hourly',
      priority: m.trending ? 0.9 : 0.8,
    }))

    return [...STATIC_PAGES, ...marketPages]
  } catch {
    return STATIC_PAGES
  }
}
