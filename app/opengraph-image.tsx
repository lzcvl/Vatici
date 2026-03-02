import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'VATICI — Mercados de Previsão'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#001a6c',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Subtle grid pattern overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(90,90,210,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(90,90,210,0.08) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* V lettermark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
          }}
        >
          <svg
            width="80"
            height="80"
            viewBox="0 0 180 180"
            style={{ marginRight: 24 }}
          >
            <rect width="180" height="180" rx="37" fill="rgba(255,255,255,0.1)" />
            <polygon
              fill="white"
              points="118.12,29.48 90.17,104.51 61.88,29.48 25.24,29.48 70.89,150.52 73.02,150.52 107.52,150.52 109.66,150.52 154.76,29.48"
            />
          </svg>

          <span
            style={{
              color: 'white',
              fontSize: 96,
              fontWeight: 800,
              letterSpacing: '-2px',
              lineHeight: 1,
            }}
          >
            VATICI
          </span>
        </div>

        {/* Tagline */}
        <p
          style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: 32,
            fontWeight: 400,
            letterSpacing: '0.5px',
            margin: 0,
            textAlign: 'center',
          }}
        >
          Mercados de Previsão · Preveja. Aposte. Lucre.
        </p>

        {/* Bottom URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            display: 'flex',
            alignItems: 'center',
            color: 'rgba(255,255,255,0.4)',
            fontSize: 22,
            letterSpacing: '1px',
          }}
        >
          vatici.com
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
