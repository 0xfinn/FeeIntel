import type { Metadata } from 'next'
import { TokenDetail } from '@/components/token-detail'

export const metadata: Metadata = {
  title: 'Token fees | FeeIntel',
  description: 'Token fee and market analytics for Clanker on Base.',
}

export default async function TokenPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params
  return <TokenDetail address={address} />
}
