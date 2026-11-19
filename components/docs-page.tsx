import Link from 'next/link'
import { ArrowRight, ArrowUpRight, BookOpen, CircleHelp, Database, Gauge, Search, WalletCards } from 'lucide-react'
import { PublicSiteShell } from '@/components/public-site-shell'

const sections = [
  { id: 'about', label: 'What is FeeIntel?' },
  { id: 'dashboard', label: 'Using the dashboard' },
  { id: 'token', label: 'Checking a token' },
  { id: 'creator', label: 'Creator portfolios' },
  { id: 'data-sources', label: 'Data sources' },
  { id: 'faq', label: 'FAQ' },
  { id: 'limitations', label: 'Limitations' },
]

export function DocsPage() {
  return (
    <PublicSiteShell activePage="docs">
      <main className="docs-layout">
        <aside className="docs-toc" aria-label="Documentation contents">
          <div className="docs-toc-heading"><BookOpen aria-hidden="true" /><span>DOCUMENTATION</span></div>
          <nav>
            {sections.map((section, index) => <a href={`#${section.id}`} key={section.id}><span>{String(index + 1).padStart(2, '0')}</span>{section.label}</a>)}
          </nav>
          <div className="docs-toc-card"><span className="docs-toc-card-icon"><CircleHelp aria-hidden="true" /></span><strong>Ready to explore?</strong><p>Open the live dashboard and follow the fees.</p><Link href="/dashboard">Go to dashboard <ArrowRight aria-hidden="true" /></Link></div>
        </aside>

        <article className="docs-content">
          <header className="docs-intro">
            <div className="landing-kicker"><span className="eyebrow-line" /> FEEINTEL GUIDE</div>
            <h1>Documentation</h1>
            <p>A practical guide to exploring creator fees and token activity across Clanker on Base.</p>
            <div className="docs-updated"><span className="docs-live-dot" /> Data is sourced from the Clanker Public API</div>
          </header>

          <section className="docs-section" id="about" aria-labelledby="about-heading">
            <div className="docs-section-icon"><Gauge aria-hidden="true" /></div>
            <div className="docs-section-body"><span className="docs-section-label">THE BASICS</span><h2 id="about-heading">What is FeeIntel?</h2><p>FeeIntel is an analytics workspace for creator fees in the Clanker ecosystem on Base. It brings trending token activity, fee balances, and creator portfolios into one place so you can move from an address to useful context without piecing it together manually.</p><p>FeeIntel is an independent explorer. Token deployment, fee configuration, and claims are handled by Clanker and the relevant onchain contracts.</p></div>
          </section>

          <section className="docs-section" id="dashboard" aria-labelledby="dashboard-heading">
            <div className="docs-section-icon"><Gauge aria-hidden="true" /></div>
            <div className="docs-section-body"><span className="docs-section-label">01 · OVERVIEW</span><h2 id="dashboard-heading">How to use the dashboard</h2><p>The dashboard opens on Clanker tokens currently appearing in the trending index. Each row brings together market context and available creator-fee information.</p><ul><li>Use the <strong>24 hours</strong> and <strong>7 days</strong> controls to change the fee activity window.</li><li>Choose a token row to see its fee breakdown and additional details.</li><li>Use the sort control to arrange available fee activity; amounts in different paired assets are not directly comparable.</li><li>The search field accepts a token contract or creator wallet address.</li></ul><p>Fee activity is calculated from available fee-swap logs. If period logs are missing, the dashboard shows the lifetime balance instead and labels it accordingly.</p><Link className="docs-inline-link" href="/dashboard">Open the dashboard <ArrowUpRight aria-hidden="true" /></Link></div>
          </section>

          <section className="docs-section" id="token" aria-labelledby="token-heading">
            <div className="docs-section-icon"><Search aria-hidden="true" /></div>
            <div className="docs-section-body"><span className="docs-section-label">02 · TOKEN LOOKUP</span><h2 id="token-heading">How to check a token</h2><p>From the dashboard, enter the token contract address in the search field. You can also open a token directly by selecting its row in the trending table. The token page shows available fee balances, claim details, and market data.</p><div className="docs-callout"><strong>Tip</strong><span>Use the full <code>0x</code> contract address on Base for the most reliable lookup.</span></div></div>
          </section>

          <section className="docs-section" id="creator" aria-labelledby="creator-heading">
            <div className="docs-section-icon"><WalletCards aria-hidden="true" /></div>
            <div className="docs-section-body"><span className="docs-section-label">03 · CREATOR LOOKUP</span><h2 id="creator-heading">How to check a creator portfolio</h2><p>Search for a creator wallet address from the dashboard. When the address is not recognized as a token, FeeIntel opens the creator portfolio view. There you can explore matching token launches and the available fee information associated with that wallet.</p><p>Portfolio results depend on the Clanker API returning creator-fee records for the address.</p></div>
          </section>

          <section className="docs-section" id="data-sources" aria-labelledby="sources-heading">
            <div className="docs-section-icon"><Database aria-hidden="true" /></div>
            <div className="docs-section-body"><span className="docs-section-label">04 · DATA</span><h2 id="sources-heading">Data sources</h2><p>FeeIntel reads data from the <a href="https://www.clanker.world" target="_blank" rel="noreferrer">Clanker Public API <ArrowUpRight aria-hidden="true" /></a>. The app uses the trending-token index, token fee and market endpoints, and creator-fee records for wallet lookups. Market requests target Base (chain ID <code>8453</code>).</p><p>Data is presented as returned by the API. Fee balances use their paired-asset units; USD estimates are only shown for recognized stablecoin pairs and are approximate.</p></div>
          </section>

          <section className="docs-section docs-faq-section" id="faq" aria-labelledby="faq-heading">
            <div className="docs-section-icon"><CircleHelp aria-hidden="true" /></div>
            <div className="docs-section-body"><span className="docs-section-label">05 · QUICK ANSWERS</span><h2 id="faq-heading">Frequently asked questions</h2>
              <div className="docs-faq-list">
                <article><h3>Are fee balances shown in USD?</h3><p>Most amounts are displayed in the paired asset. A USD estimate appears for recognized stablecoin pairs and assumes a value near $1.</p></article>
                <article><h3>Why is a 24-hour fee amount unavailable?</h3><p>The API may not provide fee-swap logs for that period. In that case, FeeIntel labels the lifetime balance as a fallback rather than presenting it as period activity.</p></article>
                <article><h3>Can I claim fees from FeeIntel?</h3><p>No. FeeIntel is for analytics and exploration; it does not submit transactions or claim fees.</p></article>
                <article><h3>How often does the dashboard refresh?</h3><p>The dashboard rechecks its trending and fee data periodically. Upstream availability and caching can affect when an update appears.</p></article>
              </div>
            </div>
          </section>

          <section className="docs-section docs-limitations" id="limitations" aria-labelledby="limitations-heading">
            <div className="docs-section-icon"><Database aria-hidden="true" /></div>
            <div className="docs-section-body"><span className="docs-section-label">06 · IMPORTANT CONTEXT</span><h2 id="limitations-heading">Limitations</h2><ul><li>The dashboard fee ranking is based on tokens returned by the trending index, not every Clanker token.</li><li>Fee and market data depend on the availability and completeness of the Clanker Public API.</li><li>Tokens paired with different assets cannot be ranked by raw token amount; USD sorting is only an estimate for supported stablecoin pairs.</li><li>FeeIntel is informational and does not replace onchain verification before taking action.</li></ul></div>
          </section>

          <div className="docs-bottom-cta"><div><span>KEEP EXPLORING</span><strong>See the fee data in context.</strong></div><Link href="/dashboard" className="landing-button landing-button-primary">Open Dashboard <ArrowRight aria-hidden="true" /></Link></div>
        </article>
      </main>
    </PublicSiteShell>
  )
}
