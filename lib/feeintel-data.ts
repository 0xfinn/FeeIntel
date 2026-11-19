export type FeeToken = {
  name: string
  symbol: string
  address: string
  marketCap?: number
  volume24h?: number
  holders?: number
  pairSymbol?: string
  imageUrl?: string
  accent: string
  launchDate?: string
  claimedAmount?: string
  unclaimedAmount?: string
  totalAmount?: string
  claimedPairAmount?: number
  unclaimedPairAmount?: number
  claimedPercent?: number
}

export const defaultCreatorAddress = '0x0000000000000000000000000000000000000001'

export const isAddress = (value: string) => /^0x[a-fA-F0-9]{40}$/.test(value)

export const formatCurrency = (value: number, compact = false) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: compact && value >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: value < 100 ? 2 : 0,
  }).format(value)

export const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value)

export const shortAddress = (value: string) =>
  value.length > 14 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value

export const formatDate = (value?: string) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)
}
