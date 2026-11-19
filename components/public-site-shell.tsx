import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'

export function PublicSiteShell({ children, activePage }: { children: React.ReactNode; activePage?: 'home' | 'docs' }) {
  return (
    <div className="public-site">
      <header className="public-header">
        <div className="public-header-inner">
          <Link href="/" className="brand-lockup public-brand" aria-label="FeeIntel home" aria-current={activePage === 'home' ? 'page' : undefined}>
            <Image src="/feeintel-logo.jpg" alt="" width={38} height={31} className="brand-logo" priority />
            <span className="brand-name">Fee<span>Intel</span></span>
          </Link>
          <nav className="public-nav" aria-label="Main navigation">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/docs" aria-current={activePage === 'docs' ? 'page' : undefined}>Docs</Link>
            <a href="https://www.clanker.world" target="_blank" rel="noreferrer">Clanker <ArrowUpRight aria-hidden="true" /></a>
          </nav>
          <Link href="/dashboard" className="public-header-cta">Open Dashboard <ArrowRight aria-hidden="true" /></Link>
        </div>
      </header>
      {children}
      <footer className="public-footer">
        <Link href="/" className="public-footer-brand"><Image src="/feeintel-logo.jpg" alt="" width={28} height={23} /><span>Fee<span>Intel</span></span></Link>
        <span className="public-footer-note">Fee analytics for the Clanker ecosystem</span>
        <nav aria-label="Footer navigation"><Link href="/dashboard">Dashboard</Link><Link href="/docs">Docs</Link><a href="https://www.clanker.world" target="_blank" rel="noreferrer">Clanker <ArrowUpRight aria-hidden="true" /></a></nav>
        <a className="public-footer-credit" href="https://x.com/Finnegan_Shaw" target="_blank" rel="noreferrer">Built by @Finnegan_Shaw <ArrowUpRight aria-hidden="true" /></a>
      </footer>
    </div>
  )
}
