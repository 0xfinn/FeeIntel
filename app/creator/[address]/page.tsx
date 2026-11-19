import type { Metadata } from 'next'
import { CreatorPortfolio } from '@/components/creator-portfolio'

export const metadata: Metadata = {
  title: 'Creator portfolio | FeeIntel',
  description: 'Explore creator token launches and claimed fees on Clanker.',
}

export default async function CreatorPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params
  return <CreatorPortfolio address={address} />
}
