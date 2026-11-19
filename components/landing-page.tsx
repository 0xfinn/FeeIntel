import Link from 'next/link'
import { Activity, ArrowRight, ArrowUpRight, BookOpen, Coins, Layers3, Search, Sparkles, WalletCards } from 'lucide-react'
import { LandingDashboardPreview, TrendingTokenTicker } from '@/components/landing-market'
import { PublicSiteShell } from '@/components/public-site-shell'

const features = [
  {
    icon: Coins,
    title: 'Track fee balances',
    description: 'See claimed and unclaimed creator fees side by side, with paired-asset amounts kept clear.',
    number: '01',
  },
  {
    icon: WalletCards,
    title: 'Explore creator portfolios',
    description: 'Follow a wallet across its Clanker launches and get a concise view of its fee activity.',
    number: '02',
  },
  {
    icon: Layers3,
    title: 'Go token by token',
    description: 'Open a token for fee breakdowns, market context, and available claim history.',
    number: '03',
  },
  {
    icon: Activity,
    title: 'Follow live Clanker data',
    description: 'FeeIntel reads the Clanker Public API for current Base token and fee information.',
    number: '04',
  },
]

const steps = [
  { number: '01', title: 'Start with the live index', description: 'Browse trending Clanker tokens and their latest available fee balances.' },
  { number: '02', title: 'Search a token or wallet', description: 'Paste a Base address to jump directly to token details or a creator portfolio.' },
  { number: '03', title: 'Understand the breakdown', description: 'Compare claimed and unclaimed amounts, then follow the source for more context.' },
]

export function LandingPage() {
  return (
    <PublicSiteShell activePage="home">
      <main className="landing-main">
      <section className="landing-hero">
        <div className="landing-hero-copy">
          <div className="landing-kicker"><span className="landing-kicker-dot" /> BUILT FOR THE CLANKER ECOSYSTEM</div>
          <h1>Fee intelligence for <span>Clanker tokens.</span></h1>
          <p className="landing-lede">A clearer view of creator fees on Base. Track token balances, explore creator portfolios, and get the context behind every fee.</p>
          <div className="landing-actions">
            <Link href="/dashboard" className="landing-button landing-button-primary">Open Dashboard <ArrowRight aria-hidden="true" /></Link>
            <Link href="/docs" className="landing-button landing-button-secondary"><BookOpen aria-hidden="true" /> Read Docs</Link>
          </div>
          <div className="landing-proof"><span className="proof-live"><i /> Clanker Public API</span><span className="proof-divider" /><span>Built for Base</span></div>
        </div>
        <LandingDashboardPreview />
      </section>
      <TrendingTokenTicker />

      <section className="landing-features" aria-labelledby="features-heading">
        <div className="landing-section-intro">
          <div className="landing-kicker"><span className="eyebrow-line" /> THE SIGNAL IN THE FEES</div>
          <h2 id="features-heading">Everything you need.<br /><span>Nothing you don&apos;t.</span></h2>
          <p>FeeIntel brings the fee data you care about into one focused workspace.</p>
        </div>
        <div className="feature-grid">
          {features.map(({ icon: Icon, title, description, number }) => (
            <article className="feature-card" key={title}>
              <div className="feature-card-top"><span className="feature-icon"><Icon aria-hidden="true" /></span><span className="feature-number">{number}</span></div>
              <h3>{title}</h3>
              <p>{description}</p>
              <span className="feature-card-line" aria-hidden="true" />
            </article>
          ))}
        </div>
      </section>

      <section className="landing-how" aria-labelledby="how-heading">
        <div className="how-heading">
          <div>
            <div className="landing-kicker"><span className="eyebrow-line" /> A CLEARER WAY TO EXPLORE</div>
            <h2 id="how-heading">From address to <span>insight.</span></h2>
          </div>
          <Link href="/docs" className="text-link">Learn how it works <ArrowUpRight aria-hidden="true" /></Link>
        </div>
        <div className="steps-grid">
          {steps.map((step) => (
            <article className="step-card" key={step.number}>
              <span className="step-number">{step.number}</span>
              <div className="step-connector" aria-hidden="true"><span /></div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-cta" aria-label="Explore FeeIntel">
        <div className="cta-orbit cta-orbit-one" aria-hidden="true" /><div className="cta-orbit cta-orbit-two" aria-hidden="true" />
        <div className="cta-icon"><Sparkles aria-hidden="true" /></div>
        <div className="cta-copy"><span>THE CLANKER FEE PICTURE</span><h2>Follow the fees, not the noise.</h2><p>Explore the live dashboard or learn how FeeIntel reads the data.</p></div>
        <div className="cta-actions"><Link href="/dashboard" className="landing-button landing-button-primary">Explore Dashboard <ArrowRight aria-hidden="true" /></Link><Link href="/docs" className="cta-docs-link">Read the docs</Link></div>
      </section>
      <div className="landing-search-hint"><Search aria-hidden="true" /><span>Know an address? Search any token or creator wallet from the dashboard.</span><Link href="/dashboard">Start searching <ArrowRight aria-hidden="true" /></Link></div>
      </main>
    </PublicSiteShell>
  )
}
