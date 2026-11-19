const CLANKER_PROXY_PREFIX = '/api/clanker'

export async function clankerFetcher<T = unknown>(path: string): Promise<T> {
  const normalizedPath = path.replace(/^\/api\//, '').replace(/^\/+/, '')
  const response = await fetch(`${CLANKER_PROXY_PREFIX}/${normalizedPath}`, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    const error = new Error(`Clanker API returned ${response.status}`) as Error & { status: number }
    error.status = response.status
    throw error
  }

  return (await response.json()) as T
}

export function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const record = value as Record<string, unknown>
  const nested = record.data
  return nested && typeof nested === 'object' && !Array.isArray(nested)
    ? (nested as Record<string, unknown>)
    : record
}

export function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

export function readNumber(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
      return Number(value)
    }
  }
  return undefined
}

export function readString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  return undefined
}

export type FeeAmounts = {
  pairSymbol: string
  tokenSymbol: string
  claimedAmount: string
  unclaimedAmount: string
  totalAmount: string
  claimedPairValue: number
  unclaimedPairValue: number
  claimedPercent: number
  hasFees: boolean
}

function rawAmount(value: unknown) {
  if (typeof value === 'bigint') return value > 0n ? value : 0n
  const normalized = typeof value === 'number' && Number.isFinite(value) ? String(Math.trunc(value)) : String(value ?? '0').trim()
  return /^\d+$/.test(normalized) ? BigInt(normalized) : 0n
}

function decimalsValue(value: number | undefined) {
  return Math.max(0, Math.min(36, Math.trunc(value ?? 18)))
}

export function formatTokenAmount(raw: bigint, decimals: number, symbol: string, maxFraction = 6) {
  const safeDecimals = decimalsValue(decimals)
  const scale = 10n ** BigInt(safeDecimals)
  const fractionScale = 10n ** BigInt(maxFraction)
  const rounded = (raw * fractionScale + scale / 2n) / scale
  const whole = rounded / fractionScale
  const fraction = (rounded % fractionScale).toString().padStart(maxFraction, '0').replace(/0+$/, '')
  const wholeText = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const amountText = raw > 0n && rounded === 0n
    ? `<0.${'0'.repeat(maxFraction - 1)}1`
    : `${wholeText}${fraction ? `.${fraction}` : ''}`
  return `${amountText} ${symbol}`
}

function decimalAmount(raw: bigint, decimals: number) {
  const value = Number(raw) / 10 ** decimals
  return Number.isFinite(value) ? value : 0
}

export function getFeeAmounts(payload: unknown): FeeAmounts {
  const root = asRecord(payload)
  const token = asRecord(root.token)
  const claimed = asRecord(root.claimed)
  const uncollected = asRecord(root.uncollected)
  const pairSymbol = readString(token, ['pairedTokenSymbol', 'pair']) ?? 'PAIR'
  const tokenSymbol = readString(token, ['symbol']) ?? 'TOKEN'
  const pairDecimals = decimalsValue(readNumber(token, ['pairedTokenDecimals']))
  const tokenDecimals = decimalsValue(readNumber(token, ['decimals', 'tokenDecimals']))
  const claimedRaw = rawAmount(claimed.total)
  const unclaimedPairRaw = rawAmount(uncollected.totalPaired)
  const unclaimedTokenRaw = rawAmount(uncollected.totalClanker)
  const totalPairRaw = claimedRaw + unclaimedPairRaw
  const claimedPairValue = decimalAmount(claimedRaw, pairDecimals)
  const unclaimedPairValue = decimalAmount(unclaimedPairRaw, pairDecimals)
  const comparableTotal = claimedPairValue + unclaimedPairValue
  const claimedPercent = comparableTotal > 0 ? Math.round((claimedPairValue / comparableTotal) * 100) : 0
  const unclaimedAssets = [
    ...(unclaimedPairRaw > 0n ? [formatTokenAmount(unclaimedPairRaw, pairDecimals, pairSymbol)] : []),
    ...(unclaimedTokenRaw > 0n ? [formatTokenAmount(unclaimedTokenRaw, tokenDecimals, tokenSymbol)] : []),
  ]
  const totalAssets = [
    ...(totalPairRaw > 0n ? [formatTokenAmount(totalPairRaw, pairDecimals, pairSymbol)] : []),
    ...(unclaimedTokenRaw > 0n ? [formatTokenAmount(unclaimedTokenRaw, tokenDecimals, tokenSymbol)] : []),
  ]
  const hasFees = claimedRaw > 0n || unclaimedPairRaw > 0n || unclaimedTokenRaw > 0n

  return {
    pairSymbol,
    tokenSymbol,
    claimedAmount: formatTokenAmount(claimedRaw, pairDecimals, pairSymbol),
    unclaimedAmount: unclaimedAssets.join(' + ') || formatTokenAmount(0n, pairDecimals, pairSymbol),
    totalAmount: totalAssets.join(' + ') || formatTokenAmount(0n, pairDecimals, pairSymbol),
    claimedPairValue,
    unclaimedPairValue,
    claimedPercent,
    hasFees,
  }
}

export type TrendingToken = {
  address: string
  name: string
  symbol: string
  marketCap?: number
  volume24h?: number
  imageUrl?: string
  accent: string
  priceChange24h?: number
}

const accents = ['blue', 'violet', 'cyan', 'orange', 'pink', 'green']

export function parseTrendingTokens(payload: unknown): TrendingToken[] {
  const root = asRecord(payload)
  const rows = Array.isArray(payload)
    ? payload
    : [root.trending, root.tokens, root.data].find(Array.isArray) as unknown[] | undefined
  if (!rows) return []

  const seen = new Set<string>()
  return rows.flatMap((value, index) => {
    const row = asRecord(value)
    const attributes = asRecord(row.attributes)
    const relationships = asRecord(row.relationships)
    const baseToken = asRecord(relationships.base_token)
    const referenceId = readString(baseToken, ['id', 'address']) ?? ''
    const poolId = readString(row, ['id']) ?? ''
    const address = referenceId.match(/0x[a-fA-F0-9]{40}/)?.[0]
      ?? readString(row, ['tokenAddress', 'token_address'])
      ?? (row.type === 'token' ? readString(attributes, ['address']) : undefined)

    if (!address || seen.has(address.toLowerCase()) || (poolId && !poolId.toLowerCase().startsWith('base_') && poolId.includes('_'))) {
      return []
    }
    seen.add(address.toLowerCase())

    const poolName = readString(attributes, ['name', 'pool_name']) ?? 'Clanker token'
    const symbol = poolName.split('/')[0]?.trim() || 'TOKEN'
    const volumeRecord = asRecord(attributes.volume_usd)
    const changeRecord = asRecord(attributes.price_change_percentage)

    return [{
      address,
      name: symbol,
      symbol,
      marketCap: readNumber(attributes, ['market_cap_usd', 'fdv_usd']),
      volume24h: readNumber(attributes, ['h24_volume_usd']) ?? readNumber(volumeRecord, ['h24']),
      imageUrl: readString(attributes, ['imgUrl', 'img_url', 'imageUrl', 'image_url'])
        ?? readString(row, ['imgUrl', 'img_url', 'imageUrl', 'image_url']),
      accent: accents[index % accents.length],
      priceChange24h: readNumber(changeRecord, ['h24']),
    } as TrendingToken]
  })
}

export function getFeeSwaps(payload: unknown) {
  const root = asRecord(payload)
  const logs = asRecord(root.feeLogs)
  return readArray(logs.swaps).map(asRecord)
}

export type PeriodFeeSummary = {
  amount: string
  value: number
  pairSymbol: string
  swapCount: number
}

export function getPeriodFeeSummary(payload: unknown, periodDays: number): PeriodFeeSummary | undefined {
  const root = asRecord(payload)
  const token = asRecord(root.token)
  const pairDecimals = decimalsValue(readNumber(token, ['pairedTokenDecimals']))
  const pairSymbol = readString(token, ['pairedTokenSymbol', 'pair']) ?? 'PAIR'
  const cutoff = Date.now() / 1000 - periodDays * 24 * 60 * 60
  const matchingSwaps = getFeeSwaps(payload).filter((swap) => {
    const timestamp = readNumber(swap, ['timestamp'])
    return timestamp !== undefined && (timestamp > 1e12 ? timestamp / 1000 : timestamp) >= cutoff
  })
  if (!matchingSwaps.length) return undefined

  const total = matchingSwaps.reduce((sum, swap) => sum + rawAmount(swap.creatorFee), 0n)
  return {
    amount: formatTokenAmount(total, pairDecimals, pairSymbol),
    value: decimalAmount(total, pairDecimals),
    pairSymbol,
    swapCount: matchingSwaps.length,
  }
}

export function getPeriodFeeAmount(payload: unknown, periodDays: number) {
  return getPeriodFeeSummary(payload, periodDays)?.amount
}
