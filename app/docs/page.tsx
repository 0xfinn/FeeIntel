import type { Metadata } from 'next'
import { DocsPage } from '@/components/docs-page'

export const metadata: Metadata = {
  title: 'Documentation | FeeIntel',
  description: 'Learn how to explore Clanker token fees, creator portfolios, and data in FeeIntel.',
}

export default function DocumentationPage() {
  return <DocsPage />
}
