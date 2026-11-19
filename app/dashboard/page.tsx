import type { Metadata } from 'next'
import { AppShell } from '@/components/app-shell'
import { Dashboard } from '@/components/dashboard'

export const metadata: Metadata = {
  title: 'Dashboard | FeeIntel',
  description: 'Explore trending Clanker tokens, creator fee balances, and activity on Base.',
}

type DashboardPageProps = {
  searchParams: Promise<{ period?: string | string[] }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams
  const initialPeriod = params.period === '7d' ? '7d' : '24h'

  return <AppShell><Dashboard initialPeriod={initialPeriod} /></AppShell>
}
