import type { Metadata } from 'next'
import { LandingPage } from '@/components/landing-page'

export const metadata: Metadata = {
  title: 'FeeIntel | Creator fee intelligence for Clanker tokens',
  description: 'Explore Clanker token fees on Base. Track creator balances, compare claimed and unclaimed fees, and follow token activity from one focused dashboard.',
}

export default function HomePage() {
  return <LandingPage />
}
