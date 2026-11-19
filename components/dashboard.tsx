'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowDownRight, ArrowRight, ArrowUpDown, ArrowUpRight, CircleDollarSign, Coins, Download, Info, Layers3, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FeeBreakdown } from '@/components/fee-breakdown'
import { TableSkeleton } from '@/components/table-skeleton'
import { TokenMark } from '@/components/token-mark'
import { asRecord, clankerFetcher, getFeeAmounts, getPeriodFeeSummary, parseTrendingTokens, readNumber, readString, type PeriodFeeSummary } from '@/lib/clanker-api'
import { formatCurrency, formatNumber, type FeeToken } from '@/lib/feeintel-data'

type DashboardToken = FeeToken & {
  periodFee?: PeriodFeeSummary
  periodFeeUsd?: number
  feeDataAvailable: boolean
  marketDataAvailable: boolean
  hasFees?: boolean
  priceChange24h?: number
}

const stablePairSymbols = new Set(['DAI', 'USDC', 'USDBC', 'USDE', 'USDS', 'USDT'])

function estimateStablecoinUsd(value?: number, pairSymbol?: string) {
  if (value === undefined || !pairSymbol) return undefined
  const normalizedSymbol = pairSymbol.toUpperCase().replace(/[^A-Z0-9]/g, '')
  return stablePairSymbols.has(normalizedSymbol) ? value : undefined
}

function formatFeeUsd(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: value >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: value < 1 ? 4 : value < 100 ? 2 : 0,
  }).format(value)
}

async function loadDashboardTokens(
  trendingTokens: ReturnType<typeof parseTrendingTokens>,
  period: '24h' | '7d',
): Promise<DashboardToken[]> {
  return Promise.all(trendingTokens.map(async (trendingToken) => {
    const { address } = trendingToken
    const [feeResponse, marketResponse] = await Promise.all([
      clankerFetcher(`/api/tokens/${encodeURIComponent(address)}/fees`).catch(() => null),
      clankerFetcher(`/api/tokens/${encodeURIComponent(address)}/market?chainId=8453`).catch(() => null),
    ])
    const feeRoot = asRecord(feeResponse)
    const tokenInfo = asRecord(feeRoot.token)
    const marketRoot = asRecord(marketResponse)
    const market = asRecord(marketRoot.market)
    const fee = feeResponse ? getFeeAmounts(feeResponse) : undefined
    const periodFee = feeResponse ? getPeriodFeeSummary(feeResponse, period === '24h' ? 1 : 7) : undefined
    const periodFeeUsd = periodFee ? estimateStablecoinUsd(periodFee.value, periodFee.pairSymbol) : undefined

    return {
      address,
      name: readString(tokenInfo, ['name']) ?? trendingToken.name,
      symbol: readString(tokenInfo, ['symbol']) ?? trendingToken.symbol,
      imageUrl: readString(tokenInfo, ['imgUrl', 'img_url', 'imageUrl', 'image_url']) ?? trendingToken.imageUrl,
      marketCap: readNumber(market, ['marketCap']) ?? trendingToken.marketCap,
      volume24h: readNumber(market, ['volume24h']) ?? trendingToken.volume24h,
      holders: readNumber(marketRoot, ['holders']) ?? undefined,
      accent: trendingToken.accent,
      pairSymbol: fee?.pairSymbol,
      claimedAmount: fee?.claimedAmount,
      unclaimedAmount: fee?.unclaimedAmount,
      totalAmount: fee?.totalAmount,
      claimedPairAmount: fee?.claimedPairValue,
      unclaimedPairAmount: fee?.unclaimedPairValue,
      claimedPercent: fee?.claimedPercent,
      hasFees: fee?.hasFees,
      periodFee,
      periodFeeUsd,
      feeDataAvailable: Boolean(feeResponse),
      marketDataAvailable: Boolean(marketResponse),
      priceChange24h: readNumber(market, ['priceChangePercent24h']) ?? trendingToken.priceChange24h,
    }
  }))
}

export function Dashboard({ initialPeriod }: { initialPeriod: '24h' | '7d' }) {
  const [period, setPeriod] = useState<'24h' | '7d'>(initialPeriod)
  const [sortByFees, setSortByFees] = useState(false)
  const { data: trendingResponse, error: trendingError, isLoading: trendingLoading } = useSWR(
    '/api/tokens/trending',
    clankerFetcher,
    { revalidateOnFocus: false, refreshInterval: 60000, shouldRetryOnError: false },
  )
  const trendingTokens = useMemo(() => parseTrendingTokens(trendingResponse).slice(0, 8), [trendingResponse])
  const addressKey = trendingTokens.map((token) => token.address).join(',')
  const { data: enrichedTokens, error: feeError, isLoading: feeLoading } = useSWR(
    addressKey ? ['dashboard-token-details', addressKey, period] : null,
    () => loadDashboardTokens(trendingTokens, period),
    { revalidateOnFocus: false, refreshInterval: 60000, shouldRetryOnError: false },
  )
  const tokens = enrichedTokens ?? []
  const feeTokens = tokens.filter((token) => token.feeDataAvailable)
  const topToken = feeTokens[0]
  const loadError = Boolean(trendingError || feeError || tokens.some((token) => !token.feeDataAvailable || !token.marketDataAvailable))
  const periodLabel = period === '24h' ? '24h' : '7d'
  const sortedTokens = useMemo(() => {
    if (!sortByFees) return tokens

    const usdRanked: Array<{ token: DashboardToken; index: number }> = []
    const nativeGroups = new Map<string, { firstIndex: number; items: Array<{ token: DashboardToken; index: number }> }>()
    const noPeriodFees: Array<{ token: DashboardToken; index: number }> = []

    tokens.forEach((token, index) => {
      if (token.periodFeeUsd !== undefined) {
        usdRanked.push({ token, index })
      } else if (token.periodFee) {
        const groupKey = token.periodFee.pairSymbol.toUpperCase()
        const group = nativeGroups.get(groupKey) ?? { firstIndex: index, items: [] }
        group.items.push({ token, index })
        nativeGroups.set(groupKey, group)
      } else {
        noPeriodFees.push({ token, index })
      }
    })

    usdRanked.sort((left, right) => (right.token.periodFeeUsd ?? 0) - (left.token.periodFeeUsd ?? 0) || left.index - right.index)
    const nativeRanked = [...nativeGroups.values()]
      .sort((left, right) => left.firstIndex - right.firstIndex)
      .flatMap((group) => group.items.sort((left, right) => (right.token.periodFee?.value ?? 0) - (left.token.periodFee?.value ?? 0) || left.index - right.index))

    return [...usdRanked, ...nativeRanked, ...noPeriodFees].map(({ token }) => token)
  }, [sortByFees, tokens])

  useEffect(() => {
    function syncPeriodFromUrl() {
      setPeriod(new URLSearchParams(window.location.search).get('period') === '7d' ? '7d' : '24h')
    }

    window.addEventListener('popstate', syncPeriodFromUrl)
    return () => window.removeEventListener('popstate', syncPeriodFromUrl)
  }, [])

  function changePeriod(nextPeriod: '24h' | '7d') {
    if (nextPeriod === period) return

    const url = new URL(window.location.href)
    url.searchParams.set('period', nextPeriod)
    window.history.pushState(window.history.state, '', url)
    setPeriod(nextPeriod)
  }

  return (
    <div className="dashboard-page">
      <div className="page-heading-row">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> ECOSYSTEM OVERVIEW</div>
          <h1>Fee intelligence, <span>at a glance.</span></h1>
          <p className="page-subtitle">A real-time view of creator earnings across Clanker on Base.</p>
        </div>
        <div className="snapshot-pill"><span className="snapshot-pulse" /> {trendingLoading ? 'Loading live data' : trendingError ? 'API unavailable' : 'Live snapshot'} <Info aria-hidden="true" /></div>
      </div>

      {trendingLoading && <div className="inline-status" role="status"><span className="snapshot-pulse" /> Loading trending tokens from Clanker…</div>}
      {feeLoading && <div className="inline-status" role="status"><span className="snapshot-pulse" /> Loading {period === '24h' ? '24-hour' : '7-day'} fee activity and market details…</div>}
      {loadError && <div className="inline-status status-warning" role="status"><Info aria-hidden="true" />{trendingError ? 'Trending token data is temporarily unavailable.' : 'Some token fee or market details could not be loaded. Please refresh to try again.'}</div>}

      <section className="kpi-grid" aria-label="Fee overview" aria-busy={trendingLoading || feeLoading}>
        <article className="kpi-card kpi-featured">
          <div className="kpi-card-top"><span>TOKENS WITH FEE DATA</span><span className="kpi-icon"><CircleDollarSign aria-hidden="true" /></span></div>
          <div className="kpi-value">{trendingLoading || feeLoading ? <span className="kpi-loading-placeholder" aria-hidden="true" /> : formatNumber(feeTokens.length)}</div>
          <div className="kpi-foot"><span>{feeTokens.length ? 'tokens with fee data' : 'fee data available'}</span></div>
          <div className="kpi-glow" />
        </article>
        <article className="kpi-card">
          <div className="kpi-card-top"><span>TRENDING TOKEN FEE BALANCE</span><span className="kpi-icon"><Coins aria-hidden="true" /></span></div>
          {topToken ? <>
            <div className="top-token-metric"><TokenMark symbol={topToken.symbol} accent={topToken.accent} imageUrl={topToken.imageUrl} size="sm" /><div><strong>{topToken.name}</strong><span>${topToken.symbol}</span></div></div>
            <div className="kpi-foot"><span className={`kpi-highlight${topToken.hasFees ? '' : ' kpi-highlight-muted'}`}>{topToken.hasFees ? topToken.totalAmount : 'No fees yet'}</span><span>lifetime balance</span></div>
          </> : <div className="kpi-foot">{trendingLoading || feeLoading ? <span className="kpi-loading-placeholder kpi-loading-placeholder-compact" aria-hidden="true" /> : 'No fee balances available'}</div>}
        </article>
        <article className="kpi-card">
          <div className="kpi-card-top"><span>TRENDING TOKENS</span><span className="kpi-icon"><Layers3 aria-hidden="true" /></span></div>
          <div className="kpi-value">{trendingLoading ? <span className="kpi-loading-placeholder" aria-hidden="true" /> : formatNumber(trendingTokens.length)}</div>
          <div className="kpi-foot"><span>from the live Base index</span></div>
        </article>
      </section>

      <section className="table-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">ONCHAIN PERFORMANCE</div>
            <h2>Trending tokens &amp; fee balances</h2>
            <p>Fee activity uses available logs; missing period logs fall back to lifetime balances. Market volume is 24-hour only.</p>
          </div>
          <div className="table-controls">
            <div className="period-toggle" role="group" aria-label="Fee activity period" aria-busy={feeLoading}>
              <button type="button" className={period === '24h' ? 'selected' : ''} aria-pressed={period === '24h'} onClick={() => changePeriod('24h')}>24 hours</button>
              <button type="button" className={period === '7d' ? 'selected' : ''} aria-pressed={period === '7d'} onClick={() => changePeriod('7d')}>7 days</button>
            </div>
            <Button variant="outline" size="sm" className="export-button" onClick={() => window.print()}><Download data-icon="inline-start" /> Export</Button>
          </div>
        </div>

        <div className="data-table-shell">
          <div className="table-scroll">
            <table className="fee-table">
              <thead>
                <tr><th scope="col">TOKEN</th><th scope="col">MARKET CAP</th><th scope="col">VOLUME 24H</th><th scope="col" aria-sort={sortByFees ? 'descending' : 'none'}><button type="button" className="table-sort-button" aria-pressed={sortByFees} aria-label={sortByFees ? 'Fees generated sorted by USD estimate and paired asset, descending. Return to trending order.' : 'Sort period fees generated by USD estimate and paired asset, descending'} title="Stablecoin fees use an approximate $1 USD peg; other assets sort within paired-asset groups, and tokens without period logs stay in trending order." disabled={!tokens.some((token) => token.feeDataAvailable)} onClick={() => setSortByFees((current) => !current)}>FEES GENERATED · {periodLabel.toUpperCase()}{sortByFees ? <ArrowDown aria-hidden="true" /> : <ArrowUpDown aria-hidden="true" />}</button></th><th scope="col">CLAIMED / UNCLAIMED</th><th scope="col">HOLDERS</th><th scope="col"><span className="sr-only">Open token</span></th></tr>
              </thead>
              <tbody aria-busy={trendingLoading || feeLoading}>
                {sortedTokens.map((token, index) => {
                  const feeAmount = token.periodFee?.amount ?? (token.hasFees ? token.totalAmount : token.feeDataAvailable ? 'No fees yet' : '—')
                  const feeCaption = token.periodFee
                    ? `${periodLabel} fee activity`
                    : token.feeDataAvailable
                      ? token.hasFees ? `Lifetime balance · no ${periodLabel} fee logs` : `No ${periodLabel} fee activity`
                      : 'Fee data unavailable'
                  const lifetimePairAmount = token.claimedPairAmount === undefined && token.unclaimedPairAmount === undefined
                    ? undefined
                    : (token.claimedPairAmount ?? 0) + (token.unclaimedPairAmount ?? 0)
                  const feeUsdEstimate = token.periodFee
                    ? token.periodFeeUsd
                    : estimateStablecoinUsd(lifetimePairAmount, token.pairSymbol)
                  return (
                    <tr key={token.address}>
                      <td><Link href={`/token/${token.address}`} className="token-cell"><span className="rank-number">{String(index + 1).padStart(2, '0')}</span><TokenMark symbol={token.symbol} accent={token.accent} imageUrl={token.imageUrl} /><span className="token-label"><strong>{token.name}</strong><span>${token.symbol}</span></span></Link></td>
                      <td className="numeric-cell">{token.marketCap === undefined ? '—' : formatCurrency(token.marketCap, true)}</td>
                      <td className="numeric-cell">{token.volume24h === undefined ? '—' : formatCurrency(token.volume24h, true)}{token.priceChange24h === undefined ? null : <span className={`table-change ${token.priceChange24h < 0 ? 'is-negative' : token.priceChange24h > 0 ? 'is-positive' : 'is-neutral'}`} title="24-hour price change" aria-label={`24-hour price change ${token.priceChange24h > 0 ? '+' : ''}${token.priceChange24h.toFixed(1)} percent`}>{token.priceChange24h < 0 ? <ArrowDownRight aria-hidden="true" /> : <ArrowUpRight aria-hidden="true" />} {token.priceChange24h > 0 ? '+' : ''}{token.priceChange24h.toFixed(1)}%</span>}
</td>
                      <td><span className={`fees-cell${token.feeDataAvailable && !token.hasFees && !token.periodFee ? ' fees-cell-zero' : ''}`}>{!token.periodFee && token.feeDataAvailable && !token.hasFees ? <span className="zero-fee-value">No fees yet</span> : feeAmount}<span className="fees-period">{feeCaption}</span>{feeUsdEstimate !== undefined && <span className="fees-usd" title="Approximate USD estimate assumes this stablecoin remains near $1.">≈ {formatFeeUsd(feeUsdEstimate)}</span>}</span></td>
                      <td className="claim-cell"><FeeBreakdown claimedAmount={token.claimedAmount} unclaimedAmount={token.unclaimedAmount} claimedPercent={token.claimedPercent} /></td>
                      <td className="numeric-cell">{token.holders === undefined ? '—' : formatNumber(token.holders)}</td>
                      <td><Link href={`/token/${token.address}`} className="row-open" aria-label={`View ${token.name} details`}><ArrowRight aria-hidden="true" /></Link></td>
                    </tr>
                  )
                })}
                {!sortedTokens.length && !trendingLoading && !feeLoading && <tr><td colSpan={7} className="empty-cell"><div className="empty-state"><span className="empty-icon"><Layers3 aria-hidden="true" /></span><strong>{trendingError ? 'Trending tokens are unavailable' : feeError ? 'Token details are unavailable' : 'No trending tokens found'}</strong><span>{trendingError ? 'Clanker could not return the live token index. Try again shortly.' : feeError ? 'Fee and market details could not be loaded. Refresh to try again.' : 'Clanker returned no Base tokens for the current index.'}</span></div></td></tr>}
                {!sortedTokens.length && (trendingLoading || feeLoading) && <TableSkeleton columns={7} variant="dashboard" />}
              </tbody>
            </table>
          </div>
          <div className="table-footer"><span><span className="footer-live-dot" /> Showing {formatNumber(tokens.length)} trending token{tokens.length === 1 ? '' : 's'}</span>{sortedTokens[0] && <Link href={`/token/${sortedTokens[0].address}`}>Explore token data <ArrowRight aria-hidden="true" /></Link>}</div>
        </div>
      </section>

      <section className="insight-banner">
        <div className="insight-symbol"><Sparkles aria-hidden="true" /></div>
        <div><strong>Live fee balances from the Clanker Public API</strong><span>Amounts use paired-asset units; USD estimates are available for stablecoin pairs.</span></div>
        <div className="insight-trend"><span>{formatNumber(feeTokens.length)} live</span></div>
        {tokens[0] && <Link href={`/token/${tokens[0].address}`} className="insight-link" aria-label="View token details"><ArrowRight aria-hidden="true" /></Link>}
      </section>
    </div>
  )
}
