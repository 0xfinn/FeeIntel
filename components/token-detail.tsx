'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Check, Coins, Copy, ExternalLink, Info, LoaderCircle, LockKeyhole, Wallet } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AppShell } from '@/components/app-shell'
import { FeeBreakdown } from '@/components/fee-breakdown'
import { TokenMark } from '@/components/token-mark'
import { asRecord, clankerFetcher, formatTokenAmount, getFeeAmounts, getFeeSwaps, readNumber, readString } from '@/lib/clanker-api'
import { formatCurrency, formatNumber, shortAddress } from '@/lib/feeintel-data'

function formatFeeRate(rate?: number) {
  return rate === undefined ? '—' : `${(rate / 10000).toFixed(2)}%`
}

function formatEventTime(value: unknown) {
  const timestamp = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(timestamp) || timestamp <= 0) return 'Time unavailable'
  const date = new Date(timestamp > 1e12 ? timestamp : timestamp * 1000)
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export function TokenDetail({ address }: { address: string }) {
  const [copied, setCopied] = useState(false)
  const { data: feeResponse, error: feeError, isLoading: feesLoading } = useSWR(
    `/api/tokens/${encodeURIComponent(address)}/fees`,
    clankerFetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )
  const { data: marketResponse, error: marketError, isLoading: marketLoading } = useSWR(
    `/api/tokens/${encodeURIComponent(address)}/market?chainId=8453`,
    clankerFetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )
  const feeRoot = asRecord(feeResponse)
  const tokenData = asRecord(feeRoot.token)
  const feeConfig = asRecord(feeRoot.feeConfig)
  const marketRoot = asRecord(marketResponse)
  const marketData = asRecord(marketRoot.market)
  const fee = feeResponse ? getFeeAmounts(feeResponse) : undefined
  const tokenName = readString(tokenData, ['name']) ?? 'Clanker token'
  const symbol = readString(tokenData, ['symbol']) ?? 'TOKEN'
  const imageUrl = readString(tokenData, ['imgUrl', 'img_url', 'imageUrl', 'image_url'])
  const marketCap = readNumber(marketData, ['marketCap'])
  const volume = readNumber(marketData, ['volume24h'])
  const holders = readNumber(marketRoot, ['holders'])
  const buyFeeRate = readNumber(feeConfig, ['buyFeeRate'])
  const sellFeeRate = readNumber(feeConfig, ['sellFeeRate'])
  const totalBuyFeeRate = readNumber(feeConfig, ['totalBuyFeeRate'])
  const creatorShare = buyFeeRate === undefined || !totalBuyFeeRate
    ? '—'
    : `${((buyFeeRate / totalBuyFeeRate) * 100).toFixed(1)}%`
  const feeSwaps = getFeeSwaps(feeResponse)
    .sort((a, b) => (readNumber(b, ['timestamp']) ?? 0) - (readNumber(a, ['timestamp']) ?? 0))
    .slice(0, 5)

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <AppShell>
      <div className="detail-page">
        <Link href="/" className="back-link"><ArrowLeft aria-hidden="true" /> Back to overview</Link>
        <div className="detail-heading">
          <div className="detail-token-identity">
            <TokenMark symbol={symbol} accent="blue" imageUrl={imageUrl} size="large" />
            <div><div className="eyebrow"><span className="network-dot" /> CLANKER TOKEN</div><h1>{tokenName} <span>${symbol}</span></h1><div className="detail-address"><code>{shortAddress(address)}</code><button type="button" onClick={copyAddress} aria-label="Copy token address">{copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}</button><span className="address-divider" /><a href={`https://www.clanker.world/clanker/${address}`} target="_blank" rel="noreferrer">View on Clanker <ExternalLink aria-hidden="true" /></a></div></div>
          </div>
          <div className="detail-badges"><span className="network-pill"><span className="network-dot" /> Base</span><span className={feeResponse || marketResponse ? 'data-badge data-live' : 'data-badge'}><span />{feeResponse || marketResponse ? 'Live API' : 'Connecting'}</span></div>
        </div>

        {(feesLoading || marketLoading) && <div className="inline-status" role="status"><LoaderCircle aria-hidden="true" /> Loading token data from Clanker…</div>}
        {(feeError || marketError) && <div className="inline-status status-warning" role="status"><Info aria-hidden="true" />{feeError && marketError ? 'Fee and market data are temporarily unavailable.' : feeError ? 'Fee data is temporarily unavailable.' : 'Market data is temporarily unavailable.'} Any unavailable values are left blank rather than estimated.</div>}

        <section className="detail-kpis" aria-label="Token fee overview">
          <article className="detail-kpi detail-kpi-primary"><span className="detail-kpi-label">TOTAL FEES GENERATED</span><strong className={fee && !fee.hasFees ? 'detail-zero-value' : undefined}>{fee ? fee.hasFees ? fee.totalAmount : 'No fees yet' : '—'}</strong><span className="detail-kpi-caption">Claimed plus unclaimed balances</span><div className="detail-kpi-watermark"><Wallet aria-hidden="true" /></div></article>
          <article className="detail-kpi"><span className="detail-kpi-label">CLAIMED</span><strong>{fee?.claimedAmount ?? '—'}</strong><span className="detail-kpi-caption"><Check aria-hidden="true" /> {fee ? `${fee.claimedPercent}% of paired fees` : 'Claimed fee balance'}</span></article>
          <article className="detail-kpi"><span className="detail-kpi-label">UNCLAIMED</span><strong>{fee?.unclaimedAmount ?? '—'}</strong><span className="detail-kpi-caption"><LockKeyhole aria-hidden="true" /> Available to claim</span></article>
          <article className="detail-kpi"><span className="detail-kpi-label">FEE CONFIGURATION</span><div className="fee-config-values"><span><ArrowDownLeft aria-hidden="true" /> Buy <strong>{formatFeeRate(buyFeeRate)}</strong></span><span><ArrowUpRight aria-hidden="true" /> Sell <strong>{formatFeeRate(sellFeeRate)}</strong></span></div><span className="detail-kpi-caption">Creator share · {creatorShare}</span></article>
        </section>

        <div className="detail-content-grid">
          <section className="content-card market-card">
            <div className="card-heading"><div><div className="eyebrow">MARKET SNAPSHOT</div><h2>Token metrics</h2></div><span className="metric-live"><span /> 24h</span></div>
            <div className="market-stats"><div><span>MARKET CAP</span><strong>{marketCap === undefined ? '—' : formatCurrency(marketCap, true)}</strong><small>Fully diluted value</small></div><div><span>VOLUME</span><strong>{volume === undefined ? '—' : formatCurrency(volume, true)}</strong><small>Last 24 hours</small></div><div><span>HOLDERS</span><strong>{holders === undefined ? '—' : formatNumber(holders)}</strong><small>Unique addresses</small></div></div>
            {marketError && <p className="subtle-note"><Info aria-hidden="true" /> Live market metrics could not be loaded from Clanker.</p>}
          </section>
          <section className="content-card claim-summary-card">
            <div className="card-heading"><div><div className="eyebrow">FEE DISTRIBUTION</div><h2>Claim overview</h2></div><span className="claim-icon"><Wallet aria-hidden="true" /></span></div>
            <FeeBreakdown claimedAmount={fee?.claimedAmount} unclaimedAmount={fee?.unclaimedAmount} claimedPercent={fee?.claimedPercent} variant="summary" />
            <p className="subtle-note"><Info aria-hidden="true" /> Values use the paired asset and token units reported by Clanker; no USD conversion is inferred.</p>
          </section>
        </div>

        <section className="content-card events-card">
          <div className="card-heading"><div><div className="eyebrow">ONCHAIN ACTIVITY</div><h2>Recent fee events</h2></div><Button variant="outline" size="sm" className="explorer-button" onClick={() => window.open(`https://basescan.org/token/${address}`, '_blank', 'noopener,noreferrer')}>BaseScan <ExternalLink data-icon="inline-end" /></Button></div>
          <div className="events-list">
            {feeSwaps.map((swap, index) => {
              const pairDecimals = readNumber(tokenData, ['pairedTokenDecimals']) ?? 18
              const pairSymbol = readString(tokenData, ['pairedTokenSymbol', 'pair']) ?? 'PAIR'
              let eventAmount = '—'
              try {
                eventAmount = formatTokenAmount(BigInt(String(swap.creatorFee ?? '0')), pairDecimals, pairSymbol)
              } catch {
                eventAmount = '—'
              }
              const timestamp = readNumber(swap, ['timestamp'])
              const txHash = readString(swap, ['txHash']) ?? `${timestamp ?? 'event'}-${index}`
              return <div className="event-row" key={txHash}><span className="event-icon pending"><Coins aria-hidden="true" /></span><div className="event-description"><strong>{swap.isSniper ? 'Sniper fee accrued' : 'Trading fees accrued'}</strong><span>{formatEventTime(timestamp)}</span></div><strong className="event-amount">{eventAmount}</strong><span className="event-status">Accrued</span></div>
            })}
            {!feeSwaps.length && <div className="empty-state"><span>{feesLoading ? 'Loading onchain fee events…' : feeError ? 'Fee events are currently unavailable.' : 'No recent fee events were returned by Clanker.'}</span></div>}
          </div>
        </section>
        <p className="data-footnote">{feeResponse && marketResponse ? 'Fee and market information synced from the Clanker Public API.' : 'Showing values returned by the Clanker Public API.'}</p>
      </div>
    </AppShell>
  )
}
