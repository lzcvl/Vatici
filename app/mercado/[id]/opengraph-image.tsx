import { ImageResponse } from 'next/og'
import type { FrontendMarket } from '@/lib/api-types'

export const runtime = 'edge'
export const alt = 'Mercado de predição VATICI'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function fetchMarket(id: string): Promise<FrontendMarket | null> {
  try {
    const res = await fetch(`${API_URL}/markets/${id}`, { next: { revalidate: 60 } })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

function formatBRL(n: number) {
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `R$ ${(n / 1_000).toFixed(0)}K`
  return `R$ ${n.toFixed(0)}`
}

export default async function Image({ params }: { params: { id: string } }) {
  const market = await fetchMarket(params.id)

  // ── Fallback image ──────────────────────────────────────────
  if (!market) {
    return new ImageResponse(
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #0a0a2e 0%, #12124a 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ color: '#7c6af7', fontSize: 64, fontWeight: 800, letterSpacing: '-2px' }}>
          VATICI
        </span>
      </div>,
      { ...size }
    )
  }

  const yesProb = Math.round(market.probability * 100)
  const noProb = 100 - yesProb
  const vol = formatBRL(market.volume)
  const closesAt = new Date(market.closesAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const question = market.question.pt
  // Truncate question if too long for the image
  const displayQuestion = question.length > 110 ? question.slice(0, 108) + '…' : question

  // Category label
  const categoryMap: Record<string, string> = {
    politics: 'Política',
    economy: 'Economia',
    sports: 'Esportes',
    technology: 'Tecnologia',
    entertainment: 'Entretenimento',
    science: 'Ciência',
    world: 'Mundo',
  }
  const categoryLabel = categoryMap[market.category] ?? market.category

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #0a0a2e 0%, #0f0f3d 50%, #0a0a2e 100%)',
        display: 'flex',
        flexDirection: 'column',
        padding: '48px 64px',
        fontFamily: 'sans-serif',
        position: 'relative',
      }}
    >
      {/* Subtle grid overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(124,106,247,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,106,247,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Header: logo + category */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36,
            height: 36,
            background: 'linear-gradient(135deg, #7c6af7, #a78bfa)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', border: '3px solid white', opacity: 0.9 }} />
          </div>
          <span style={{ color: '#ffffff', fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>
            VATICI
          </span>
        </div>
        <div style={{
          background: 'rgba(124,106,247,0.2)',
          border: '1px solid rgba(124,106,247,0.4)',
          borderRadius: 20,
          padding: '6px 16px',
          color: '#a78bfa',
          fontSize: 15,
          fontWeight: 600,
        }}>
          {categoryLabel}
        </div>
      </div>

      {/* Question */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{
          color: '#f0f0ff',
          fontSize: displayQuestion.length > 80 ? 34 : 42,
          fontWeight: 700,
          lineHeight: 1.3,
          marginBottom: 40,
          letterSpacing: '-0.5px',
        }}>
          {displayQuestion}
        </div>

        {/* Probability display */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 20 }}>
          {/* YES */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ color: '#4ade80', fontSize: 52, fontWeight: 800, lineHeight: 1, letterSpacing: '-2px' }}>
              {yesProb}%
            </span>
            <span style={{ color: 'rgba(74,222,128,0.7)', fontSize: 16, fontWeight: 600, marginTop: 2 }}>SIM</span>
          </div>

          {/* Bar */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{
              height: 12,
              borderRadius: 6,
              background: 'rgba(255,255,255,0.08)',
              overflow: 'hidden',
              display: 'flex',
            }}>
              <div style={{
                width: `${yesProb}%`,
                background: 'linear-gradient(90deg, #4ade80, #22c55e)',
                borderRadius: '6px 0 0 6px',
              }} />
              <div style={{
                width: `${noProb}%`,
                background: 'linear-gradient(90deg, #f87171, #ef4444)',
                borderRadius: noProb === 100 ? 6 : '0 6px 6px 0',
              }} />
            </div>
          </div>

          {/* NO */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ color: '#f87171', fontSize: 52, fontWeight: 800, lineHeight: 1, letterSpacing: '-2px' }}>
              {noProb}%
            </span>
            <span style={{ color: 'rgba(248,113,113,0.7)', fontSize: 16, fontWeight: 600, marginTop: 2 }}>NÃO</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 24,
        borderTop: '1px solid rgba(255,255,255,0.08)',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ display: 'flex', gap: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 500 }}>VOLUME</span>
            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 18, fontWeight: 700 }}>{vol}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 500 }}>ENCERRA</span>
            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 18, fontWeight: 700 }}>{closesAt}</span>
          </div>
        </div>
        <div style={{
          color: 'rgba(255,255,255,0.3)',
          fontSize: 14,
          fontWeight: 500,
        }}>
          vatici.com
        </div>
      </div>
    </div>,
    { ...size }
  )
}
