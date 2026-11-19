'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Activity, ArrowUpRight, BookOpen, CircleHelp, LayoutDashboard, Search, WalletCards } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { defaultCreatorAddress, isAddress } from '@/lib/feeintel-data'
import { clankerFetcher, readString, asRecord } from '@/lib/clanker-api'

const navigation = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Creator portfolio', href: `/creator/${defaultCreatorAddress}`, icon: WalletCards },
  { label: 'Docs', href: '/docs', icon: BookOpen },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [searchError, setSearchError] = useState('')
  const [searching, setSearching] = useState(false)

  async function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = query.trim()
    if (!isAddress(value)) {
      setSearchError('Enter a valid 0x address to search.')
      return
    }
    if (searching) return

    setSearching(true)
    setSearchError('')
    try {
      const response = await clankerFetcher(`/api/tokens/${encodeURIComponent(value)}/fees`)
      const token = asRecord(asRecord(response).token)
      const tokenAddress = readString(token, ['address'])
      router.push(tokenAddress ? `/token/${value}` : `/creator/${value}`)
    } catch (error) {
      const status = (error as Error & { status?: number }).status
      if (status === 400 || status === 404) {
        try {
          const marketResponse = await clankerFetcher(`/api/tokens/${encodeURIComponent(value)}/market?chainId=8453`)
          const market = asRecord(asRecord(marketResponse).market)
          router.push(Object.keys(market).length ? `/token/${value}` : `/creator/${value}`)
        } catch (marketError) {
          const marketStatus = (marketError as Error & { status?: number }).status
          if (marketStatus === 400 || marketStatus === 404) {
            router.push(`/creator/${value}`)
          } else {
            setSearchError('Address lookup is temporarily unavailable. Please try again.')
          }
        }
      } else {
        setSearchError('Address lookup is temporarily unavailable. Please try again.')
      }
    } finally {
      setSearching(false)
    }
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.keyCode === 229)) {
      event.preventDefault()
    }
  }

  return (
    <div className="app-frame">
      <aside className="sidebar">
            <Link href="/" className="brand-lockup" aria-label="FeeIntel home" aria-current={pathname === '/' ? 'page' : undefined}>
          <Image src="/feeintel-logo.jpg" alt="" width={40} height={32} className="brand-logo" priority />
          <span className="brand-name">Fee<span>Intel</span></span>
        </Link>
        <div className="sidebar-network"><span className="network-dot" /> BASE NETWORK</div>
        <nav className="side-nav" aria-label="Main navigation">
          <p className="nav-label">WORKSPACE</p>
          {navigation.map((item) => {
            const active = item.href === '/dashboard'
              ? pathname.startsWith('/dashboard') || pathname.startsWith('/token')
              : item.href.startsWith('/creator')
                ? pathname.startsWith('/creator')
                : pathname === item.href
            const Icon = item.icon
            return (
              <Link key={item.label} href={item.href} className={`nav-link${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined}>
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
                {item.label === 'Dashboard' && <span className="nav-live-dot" aria-label="Live" />}
              </Link>
            )
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <div className="tip-icon"><Activity aria-hidden="true" /></div>
            <p>Track every fee.<br /><strong>Miss nothing.</strong></p>
            <span>Analytics for the Clanker ecosystem.</span>
          </div>
          <a className="help-link" href="https://www.clanker.world" target="_blank" rel="noreferrer">
            <CircleHelp aria-hidden="true" /> Clanker docs <ArrowUpRight aria-hidden="true" className="help-arrow" />
          </a>
          <div className="sidebar-version"><span className="version-dot" /> Clanker Public API</div>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="mobile-brand">
        <Link href="/" className="brand-lockup" aria-label="FeeIntel home" aria-current={pathname === '/' ? 'page' : undefined}>
              <Image src="/feeintel-logo.jpg" alt="" width={34} height={27} className="brand-logo" priority />
              <span className="brand-name">Fee<span>Intel</span></span>
            </Link>
          </div>
          <form className="global-search" onSubmit={submitSearch} role="search">
            <Search aria-hidden="true" className="search-icon" />
            <input
              aria-label="Search token or wallet address"
              placeholder="Search token or wallet address"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                if (searchError) setSearchError('')
              }}
              onKeyDown={handleSearchKeyDown}
              spellCheck={false}
              autoComplete="off"
            />
            <kbd>↵</kbd>
            {searching && <span className="search-error" role="status">Checking address…</span>}
            {searchError && <span className="search-error" role="alert">{searchError}</span>}
          </form>
          <div className="topbar-actions">
            <span className="network-pill"><span className="network-dot" /> Base</span>
            <Button variant="ghost" size="sm" className="topbar-action" aria-label="Refresh data" onClick={() => window.location.reload()}>
              <Activity data-icon="inline-start" /> Refresh
            </Button>
          </div>
        </header>
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navigation.map((item) => {
            const active = item.href === '/dashboard'
              ? pathname.startsWith('/dashboard') || pathname.startsWith('/token')
              : item.href.startsWith('/creator')
                ? pathname.startsWith('/creator')
                : pathname === item.href
            const Icon = item.icon
            return <Link key={item.label} href={item.href} className={active ? 'mobile-nav-link active' : 'mobile-nav-link'} aria-current={active ? 'page' : undefined}><Icon aria-hidden="true" /><span>{item.label}</span></Link>
          })}
        </nav>
        <main className="page-content">{children}</main>
        <footer className="site-footer">
          <span>FeeIntel <span className="footer-divider">/</span> Fee analytics for the Clanker ecosystem</span>
          <a href="https://x.com/Finnegan_Shaw" target="_blank" rel="noreferrer">Built by @Finnegan_Shaw <ArrowUpRight aria-hidden="true" /></a>
        </footer>
      </div>
    </div>
  )
      }
