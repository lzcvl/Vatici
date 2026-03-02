import type { Metadata, Viewport } from 'next'
import { Inter, Space_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Providers } from '@/components/vatici/providers'
import { AppShell } from '@/components/vatici/app-shell'
import './globals.css'

const _inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const _spaceMono = Space_Mono({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-space-mono" });

export const metadata: Metadata = {
  metadataBase: new URL('https://vatici.com'),
  title: {
    default: 'VATICI — Mercados de Previsão',
    template: '%s | VATICI',
  },
  description: 'Compre e venda cotas em eventos do mundo real. Preveja o futuro e lucre com suas opiniões no maior mercado de predições do Brasil.',
  openGraph: {
    siteName: 'VATICI',
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@vaticiapp',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.svg',
        type: 'image/svg+xml',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.svg',
        type: 'image/svg+xml',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0a2e',
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body className={`${_inter.variable} ${_spaceMono.variable} font-sans antialiased`}>
        <Providers>
          <AppShell>
            {children}
          </AppShell>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
