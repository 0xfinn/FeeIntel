# FeeIntel

<p align="center">
  <img src="https://pbs.twimg.com/profile_images/2123363546503503872/Ohq5y6Dr.jpg" alt="FeeIntel" width="120" />
</p>

<p align="center">
  <strong>Fee intelligence for Clanker tokens on Base.</strong><br/>
  Track creator earnings, claimed vs unclaimed balances, and token portfolios.
</p>

<p align="center">
  <a href="https://www.feeintel.world/">Website</a> ·
  <a href="https://x.com/feeintel">X / Twitter</a> ·
  <a href="https://t.me/FinneganShaw">Telegram</a>
</p>

---

## What is FeeIntel?

FeeIntel gives creators and traders a clear view of fee activity across Clanker tokens on Base.

- **Live dashboard** — trending tokens with market data + fee balances  
- **Token detail** — claimed / unclaimed fees, fee config, recent on-chain events  
- **Creator portfolio** — every token a wallet launched + its fee performance  
- **Period filters** — 24h / 7d fee activity  

Built for people who want signal, not noise.

---

## Stack

| Layer        | Tech                          |
|--------------|-------------------------------|
| Framework    | Next.js 16 (App Router)       |
| UI           | React 19 + Tailwind CSS 4     |
| Data         | SWR + Clanker Public API      |
| Language     | TypeScript                    |
| Deploy       | Vercel                        |

---

## Project structure

```text
app/
  api/clanker/[...path]/   # Proxied Clanker API (allowlisted)
  dashboard/               # Ecosystem overview
  token/[address]/         # Token fee detail
  creator/[address]/       # Creator portfolio
  docs/                    # Docs page
components/                # UI components
lib/
  clanker-api.ts           # Fetch helpers, fee parsing, formatting
  feeintel-data.ts         # Shared types & formatters
```

---

## Getting started

```bash
# Install
pnpm install

# Development
pnpm dev

# Production build
pnpm build && pnpm start
```

Open [http://localhost:3000](http://localhost:3000).

> No environment variables required for the public Clanker API.

---

## API proxy

Client requests go through `/api/clanker/...` and only these paths are allowed:

- `tokens/trending`
- `tokens/fetch-deployed-by-address`
- `tokens/0x…/fees`
- `tokens/0x…/market`
- `wallet/0x…/creator-fees`

Responses are cached briefly (`s-maxage=15`).

---

## Links

|                     | URL                                      |
|---------------------|------------------------------------------|
| **Website**         | [feeintel.world](https://www.feeintel.world/) |
| **X (Project)**     | [@feeintel](https://x.com/feeintel)      |
| **X (Builder)**     | [@Finnegan_Shaw](https://x.com/Finnegan_Shaw) |
| **Telegram**        | [t.me/FinneganShaw](https://t.me/FinneganShaw) |

---

## Disclaimer

FeeIntel is an independent analytics frontend.  
All fee and market data is sourced from the **Clanker Public API**.  
This project is not affiliated with Clanker.

---

<p align="center">
  Built by <a href="https://x.com/Finnegan_Shaw">Finnegan Shaw</a>
</p>
```
