'use client'

import { Activity, ArrowDownRight, ArrowUpRight, LockKeyhole } from 'lucide-react'
import useSWR from 'swr'
import { useMemo } from 'react'
import { TokenMark } from '@/components/token-mark'
import { asRecord, clankerFetcher, getFeeAmounts, parseTrendingTokens, readNumber, readString, type TrendingToken } from '@/lib/clanker-api'
import { formatCurrency } from '@/lib/feeintel-data'

type LandingToken = TrendingToken & {
  claimedPercent?: number
  feeDataAvailable: boolean
  hasFees: boolean
}

const TOKEN_LIMIT = 6

function useLandingTokenFeed() {
  const { data: trendingResponse, error: trendingError, isLoading: trendingLoading } = useSWR<unknown>(
    '/api/tokens/trending',
    clankerFetcher,
    { revalidateOnFocus: false, refreshInterval: 60000, shouldRetryOnError: false },
  )
  const allTrendingTokens = useMemo(() => parseTrendingTokens(trendingResponse), [trendingResponse])
  const trendingTokens = useMemo(() => allTrendingTokens.slice(0, TOKEN_LIMIT), [allTrendingTokens])
  const addressKey = trendingTokens.map((token) => token.address).join(',')
  const { data: enrichedTokens, isLoading: detailsLoading } = useSWR<LandingToken[]>(
    addressKey ? ['landing-token-details', addressKey] : null,
    async () => Promise.all(trendingTokens.map(async (token) => {
      const feeResponse = await clankerFetcher(`/api/tokens/${encodeURIComponent(token.address)}/fees`).catch(() => null)
      const feeRoot = asRecord(feeResponse)
      const tokenInfo = asRecord(feeRoot.token)
      const fee = feeResponse ? getFeeAmounts(feeResponse) : undefined

      return {
        ...token,
        name: readString(tokenInfo, ['name']) ?? token.name,
        symbol: readString(tokenInfo, ['symbol']) ?? token.symbol,
        imageUrl: readString(tokenInfo, ['imgUrl', 'img_url', 'imageUrl', 'image_url']) ?? token.imageUrl,
        marketCap: readNumber(tokenInfo, ['marketCap', 'market_cap_usd']) ?? token.marketCap,
        claimedPercent: fee?.hasFees ? fee.claimedPercent : undefined,
        feeDataAvailable: Boolean(feeResponse),
        hasFees: Boolean(fee?.hasFees),
      }
    })),
    { revalidateOnFocus: false, refreshInterval: 60000, shouldRetryOnError: false },
  )

  const tokens: LandingToken[] = enrichedTokens ?? trendingTokens.map((token) => ({ ...token, feeDataAvailable: false, hasFees: false }))

  return {
    tokens,
    totalTokenCount: allTrendingTokens.length,
    isLoading: trendingLoading || (trendingTokens.length > 0 && detailsLoading),
    hasError: Boolean(trendingError),
  }
}

function compactCurrency(value?: number) {
  return value === undefined || !Number.isFinite(value) ? '—' : formatCurrency(value, true)
}

function DashboardPreview() {
  const { tokens, totalTokenCount, isLoading, hasError } = useLandingTokenFeed()
  const leader = tokens[0]
  const totalVolume = tokens.reduce((sum, token) => sum + (token.volume24h ?? 0), 0)

  return (
    <div className="dashboard-preview" role="region" aria-label="Live preview of trending Clanker token data on Base">
      <div className="preview-glow" aria-hidden="true" />
      <div className="preview-window">
        <div className="preview-titlebar">
          <div className="preview-window-dots" aria-hidden="true"><span /><span /><span /></div>
          <div className="preview-browser-address"><LockKeyhole aria-hidden="true" /><span>feeintel.app</span><span className="preview-address-path">/ dashboard</span></div>
          <span className="preview-live"><i /> LIVE</span>
        </div>
        <div className="preview-content">
          <div className="preview-heading-row">
            <div>
              <span className="preview-eyebrow">CLANKER ON BASE · LIVE INDEX</span>
              <h2>Fee intelligence, <span>at a glance.</span></h2>
              <p>Trending tokens and creator fee activity, straight from Clanker.</p>
            </div>
            <span className="preview-period"><Activity aria-hidden="true" /> 24 hours</span>
          </div>
          <div className="preview-metrics">
            <div className="preview-metric preview-metric-featured"><span>TOKENS IN INDEX</span><strong>{totalTokenCount ? String(totalTokenCount).padStart(2, '0') : '—'}</strong><small>live Clanker feed</small></div>
            <div className="preview-metric"><span>LEADING MARKET CAP</span><strong>{compactCurrency(leader?.marketCap)}</strong><small>{leader ? `${leader.name} · $${leader.symbol}` : 'Top trending token'}</small></div>
            <div className="preview-metric"><span>TOP 6 VOLUME · 24H</span><strong>{tokens.length ? compactCurrency(totalVolume) : '—'}</strong><small>trending tokens</small></div>
          </div>
          <div className="preview-table-head"><span>TOKEN</span><span>MARKET CAP</span><span>VOLUME · 24H</span><span>CLAIM / UNCLAIM</span></div>
          <div className="preview-token-list" aria-busy={isLoading}>
            {tokens.slice(0, 3).map((token) => (
              <div className="preview-token-row" key={token.address}>
                <div className="preview-token-name"><TokenMark symbol={token.symbol} accent={token.accent} imageUrl={token.imageUrl} size="sm" /><span><strong>{token.name}</strong><small>${token.symbol}</small></span></div>
                <span className="preview-number">{compactCurrency(token.marketCap)}</span>
                <span className="preview-number preview-volume">{compactCurrency(token.volume24h)}</span>
                <div className="preview-claim-cell">
                  {token.claimedPercent === undefined ? (
                    <span className="preview-claim-label">{token.feeDataAvailable && !token.hasFees ? 'No fees yet' : 'Fee data pending'}</span>
                  ) : (
                    <>
                      <div className="preview-claim-bar" role="meter" aria-label={`${token.name} claimed fees`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={token.claimedPercent}><span style={{ width: `${token.claimedPercent}%` }} /></div>
                      <span className="preview-claim-label">{token.claimedPercent}% claimed · {100 - token.claimedPercent}% unclaimed</span>
                    </>
                  )}
                </div>
              </div>
            ))}
            {!tokens.length && <div className="preview-empty-row" role="status">{hasError ? 'Trending data is temporarily unavailable.' : isLoading ? 'Loading live Clanker tokens…' : 'No trending tokens in the current feed.'}</div>}
          </div>
          <div className="preview-footnote"><span><i />{hasError ? 'Clanker feed unavailable' : 'Live Clanker data'}</span><span>{totalTokenCount ? `${totalTokenCount} tokens indexed` : 'Base network'}</span></div>
        </div>
      </div>
      <div className="preview-float-card preview-float-top"><span className="float-icon"><ArrowUpRight aria-hidden="true" /></span><span><small>Creator fees</small><strong>Clear at a glance</strong></span></div>
      <div className="preview-float-card preview-float-bottom"><span className="float-icon float-icon-mint"><ArrowDownRight aria-hidden="true" /></span><span><small>Clanker API</small><strong>Live Base data</strong></span></div>
    </div>
  )
}

function PriceChange({ change }: { change?: number }) {
  if (change === undefined || !Number.isFinite(change)) {
    return <span className="ticker-change is-neutral">—</span>
  }

  const isPositive = change > 0
  const isNegative = change < 0
  const Icon = isNegative ? ArrowDownRight : ArrowUpRight
  const changeClass = isPositive ? 'is-positive' : isNegative ? 'is-negative' : 'is-neutral'

  return <span className={`ticker-change ${changeClass}`} aria-label={`24-hour change ${change > 0 ? 'up' : change < 0 ? 'down' : 'unchanged'} ${Math.abs(change).toFixed(1)} percent`}><Icon aria-hidden="true" />{change > 0 ? '+' : ''}{change.toFixed(1)}%</span>
}

function TickerToken({ token }: { token: LandingToken }) {
  return (
    <li className="ticker-token">
      <TokenMark symbol={token.symbol} accent={token.accent} imageUrl={token.imageUrl} size="sm" />
      <span className="ticker-token-name"><strong>{token.name}</strong><small>${token.symbol}</small></span>
      <PriceChange change={token.priceChange24h} />
    </li>
  )
}

export function TrendingTokenTicker() {
  const { tokens, hasError, isLoading } = useLandingTokenFeed()

  return (
    <section className="landing-ticker" aria-labelledby="landing-ticker-heading">
      <div className="landing-ticker-heading">
        <h2 id="landing-ticker-heading"><span className="ticker-live-dot" /> Trending across Clanker</h2>
        <span>24H PRICE CHANGE <i /> BASE</span>
      </div>
      <div className="ticker-viewport" role="region" aria-label="Trending Clanker token prices" tabIndex={0}>
        {tokens.length ? (
          <div className="token-ticker-track">
            {[0, 1].map((sequenceIndex) => (
              <div className="token-ticker-sequence" key={sequenceIndex} aria-hidden={sequenceIndex === 1}>
                {[0, 1, 2].map((repeatIndex) => (
                  <ul className="ticker-list" key={repeatIndex} aria-hidden={sequenceIndex === 0 && repeatIndex > 0 ? true : undefined}>
                    {tokens.map((token) => <TickerToken key={`${repeatIndex}-${token.address}`} token={token} />)}
                  </ul>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <p className="ticker-status" role="status">{hasError ? 'Trending data is temporarily unavailable.' : isLoading ? 'Loading live token prices…' : 'No trending tokens are available.'}</p>
        )}
      </div>
    </section>
  )
}

export { DashboardPreview as LandingDashboardPreview }
