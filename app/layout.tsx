import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { PageTransition } from '@/components/page-transition'
import './globals.css'

export const metadata: Metadata = {
  title: 'FeeIntel — Fee intelligence for Clanker tokens',
  description: 'Track creator fees, token balances, and portfolios across the Clanker ecosystem on Base.',
  generator: 'v0.app',
  icons: {
    icon: '/feeintel-logo.jpg',
    apple: '/feeintel-logo.jpg',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#081321',
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <PageTransition>{children}</PageTransition>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
