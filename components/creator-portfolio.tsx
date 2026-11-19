'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Copy, ExternalLink, Info, LoaderCircle, Wallet } from 'lucide-react'
import { useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { FeeBreakdown } from '@/components/fee-breakdown'
import { TableSkeleton } from '@/components/table-skeleton'
import { TokenMark } from '@/components/token-mark'
import { asRecord, clankerFetcher, getFeeAmounts, readNumber, readString } from '@/lib/clanker-api'
import { formatCurrency, formatDate, formatNumber, shortAddress, type FeeToken } from '@/lib/feeintel-data'

const accents = ['blue', 'violet', 'cyan', 'orange', 'pink', 'green']

type PortfolioToken = FeeToken & { apiFeeData?: unknown }

type FeeResponseMap = Record<string, unknown | null>

function deployedRows(payload: unknown): PortfolioToken[] {
  const root = asRecord(payload)
  const candidates = Array.isArray(payload) ? payload : [root.data, root.tokens, root.items]
  const rows = candidates.find(Array.isArray) as unknown[] | undefined
  if (!rows) return []

  return rows.flatMap((value, index) => {
    const row = asRecord(value)
    const related = asRecord(row.related)
    const market = asRecord(related.market)
    const tokenAddress = readString(row, ['contract_address', 'contractAddress', 'address', 'tokenAddress'])
    if (!tokenAddress) return []

    return [{
      name: readString(row, ['name', 'tokenName']) ?? 'Clanker token',
      symbol: readString(row, ['symbol', 'ticker']) ?? 'TOKEN',
      address: tokenAddress,
      imageUrl: readString(row, ['imgUrl', 'img_url', 'imageUrl', 'image_url']),
      marketCap: readNumber(market, ['marketCap']),
      volume24h: readNumber(market, ['volume24h']),
      holders: readNumber(market, ['holders']),
      accent: accents[index % accents.length],
      launchDate: readString(row, ['deployed_at', 'deployedAt', 'created_at', 'createdAt']),
    }]
  })
}

async function loadTokenFees(addressKey: string): Promise<FeeResponseMap> {
  const addresses = addressKey.split(',').filter(Boolean)
  const results: FeeResponseMap = {}
  let cursor = 0

  async function worker() {
    while (cursor < addresses.length) {
      const address = addresses[cursor]
      cursor += 1
      try {
        results[address] = await clankerFetcher(`/api/tokens/${encodeURIComponent(address)}/fees`)
      } catch {
        results[address] = null
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(5, addresses.length) }, () => worker()))
  return results
}

export function CreatorPortfolio({ address }: { address: string }) {
  const [copied, setCopied] = useState(false)
  const { data: deployedData, error: deployedError, isLoading: deployedLoading } = useSWR(
    `/api/tokens/fetch-deployed-by-address?address=${encodeURIComponent(address)}`,
    clankerFetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )
  const { data: creatorFeeData, error: creatorFeeError, isLoading: feesLoading } = useSWR(
    `/api/wallet/${encodeURIComponent(address)}/creator-fees`,
    clankerFetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )
  const feeRecord = asRecord(creatorFeeData)
  const totalClaimed = readNumber(feeRecord, ['claimedUsd', 'claimed_usd'])
  const totalEarned = readNumber(feeRecord, ['earnedUsd', 'earned_usd'])
  const creatorFeeIncomplete = feeRecord.isIncomplete === true
  const tokens = deployedData ? deployedRows(deployedData) : []
  const addressKey = tokens.map((token) => token.address).join(',')
  const { data: tokenFees, isLoading: tokenFeesLoading } = useSWR<FeeResponseMap>(
    addressKey ? ['creator-token-fees', addressKey] : null,
    ([, key]) => loadTokenFees(String(key)),
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )
  const feeDetailsFailed = Boolean(tokenFees && Object.values(tokenFees).some((result) => result === null))
  const loading = deployedLoading || feesLoading || tokenFeesLoading

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
      <div className="creator-page">
        <Link href="/" className="back-link"><ArrowLeft aria-hidden="true" /> Back to overview</Link>
        <div className="creator-hero">
          <div className="creator-avatar"><Wallet aria-hidden="true" /></div>
          <div className="creator-title"><div className="eyebrow"><span className="network-dot" /> CREATOR PORTFOLIO</div><h1>Creator overview</h1><div className="detail-address"><code>{shortAddress(address)}</code><button type="button" onClick={copyAddress} aria-label="Copy wallet address">{copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}</button><a href={`https://basescan.org/address/${address}`} target="_blank" rel="noreferrer">View wallet <ExternalLink aria-hidden="true" /></a></div></div>
          <span className={deployedData || creatorFeeData ? 'data-badge data-live' : 'data-badge'}><span />{deployedData || creatorFeeData ? 'Live API' : 'Connecting'}</span>
        </div>

        {loading && <div className="inline-status" role="status"><LoaderCircle aria-hidden="true" /> Loading creator portfolio from Clanker…</div>}
        {(deployedError || creatorFeeError || feeDetailsFailed || creatorFeeIncomplete) && <div className="inline-status status-warning" role="status"><Info aria-hidden="true" />{deployedError && creatorFeeError ? 'Creator fees and deployed tokens are temporarily unavailable.' : deployedError ? 'Deployed tokens could not be loaded.' : creatorFeeError ? 'Creator fee totals could not be loaded.' : feeDetailsFailed ? 'Fee details could not be loaded for some deployed tokens.' : 'Clanker reports that some lifetime fee records are incomplete.'}</div>}

        <section className="creator-kpis" aria-label="Creator portfolio summary">
          <article className="creator-kpi creator-kpi-primary"><span className="detail-kpi-label">LIFETIME CLAIMED FEES</span><strong>{totalClaimed === undefined ? '—' : formatCurrency(totalClaimed)}</strong><span className="detail-kpi-caption"><Check aria-hidden="true" /> {totalClaimed === 0 ? 'No fees claimed yet' : 'Total creator fees claimed'}</span><div className="creator-kpi-mark"><Wallet aria-hidden="true" /></div></article>
          <article className="creator-kpi"><span className="detail-kpi-label">TOKENS LAUNCHED</span><strong>{deployedData ? formatNumber(tokens.length) : '—'}</strong><span className="detail-kpi-caption">Deployed through Clanker</span></article>
          <article className="creator-kpi"><span className="detail-kpi-label">TOTAL FEES EARNED</span><strong>{totalEarned === undefined ? '—' : formatCurrency(totalEarned, true)}</strong><span className="detail-kpi-caption">{totalEarned === 0 ? 'No fees earned yet' : 'Lifetime creator earnings · USD'}</span></article>
        </section>

        <section className="table-section portfolio-section">
          <div className="section-heading">
            <div><div className="eyebrow">DEPLOYED BY THIS CREATOR</div><h2>Token portfolio</h2><p>All tokens launched by this wallet and their fee performance.</p></div>
            <a className="outline-link" href={`https://www.clanker.world/creator/${address}`} target="_blank" rel="noreferrer">Clanker profile <ArrowUpRight aria-hidden="true" /></a>
          </div>
          <div className="data-table-shell">
            <div className="table-scroll">
              <table className="fee-table portfolio-table">
                <thead><tr><th scope="col">TOKEN</th><th scope="col">LAUNCH DATE</th><th scope="col">VOLUME</th><th scope="col">FEES GENERATED</th><th scope="col">CLAIMED / UNCLAIMED</th><th scope="col"><span className="sr-only">View token</span></th></tr></thead>
                <tbody>
                  {tokens.map((token) => {
                    const feePayload = tokenFees?.[token.address]
                    const fee = feePayload ? getFeeAmounts(feePayload) : undefined
                    const feeUnavailable = feePayload === null
                    return <tr key={token.address}><td><Link href={`/token/${token.address}`} className="token-cell"><TokenMark symbol={token.symbol} accent={token.accent} imageUrl={token.imageUrl} /><span className="token-label"><strong>{token.name}</strong><span>${token.symbol}</span></span></Link></td><td className="date-cell">{formatDate(token.launchDate)}</td><td className="numeric-cell">{token.volume24h === undefined ? '—' : formatCurrency(token.volume24h, true)}</td><td><span className={`fees-cell${fee && !fee.hasFees ? ' fees-cell-zero' : ''}`}>{fee ? fee.hasFees ? fee.totalAmount : <span className="zero-fee-value">No fees yet</span> : feeUnavailable ? 'Unavailable' : tokenFeesLoading ? 'Loading…' : '—'}<span className="fees-period">Lifetime · paired asset</span></span></td><td className="claim-cell">{fee ? <FeeBreakdown claimedAmount={fee.claimedAmount} unclaimedAmount={fee.unclaimedAmount} claimedPercent={fee.claimedPercent} /> : <span className="fee-data-state">{feeUnavailable ? 'Fee data unavailable' : tokenFeesLoading ? 'Loading fee split…' : '—'}</span>}</td><td><Link href={`/token/${token.address}`} className="row-open" aria-label={`View ${token.name} details`}><ArrowRight aria-hidden="true" /></Link></td></tr>
                  })}
                  {!tokens.length && !loading && <tr><td colSpan={6} className="empty-cell"><div className="empty-state"><span className="empty-icon"><Wallet aria-hidden="true" /></span><strong>{deployedError ? 'Deployed tokens are unavailable' : 'No deployed tokens found'}</strong><span>{deployedError ? "Clanker could not return this wallet's token launches. Try again later." : 'No Clanker launches were returned for this wallet.'}</span></div></td></tr>}
                  {!tokens.length && loading && <TableSkeleton columns={6} variant="portfolio" />}
                </tbody>
              </table>
            </div>
            <div className="table-footer"><span><span className="footer-live-dot" /> {deployedData ? `Showing ${formatNumber(tokens.length)} token${tokens.length === 1 ? '' : 's'}` : 'Creator token data'}</span></div>
          </div>
        </section>
        <p className="data-footnote">Creator fee totals are USD values from the Clanker Public API. Token fee balances are shown in their reported asset units.</p>
      </div>
    </AppShell>
  )
}
