# TN26 — Tamil Nadu 2026 Legislative Assembly Results

A live results dashboard for the 2026 Tamil Nadu Legislative Assembly elections. 234 constituencies, alliance-level rollups, per-AC drilldowns, and a parliament arc that reflects the running ECI tally.

Counting concluded on 2026-05-04. The app now serves a baked-in static snapshot of the final tally taken from the ECI fanout at the close of counting.

## Data source

All numbers come from the **Election Commission of India** — the per-AC candidate result pages under `results.eci.gov.in` (state code `S22`, election `ResultAcGenMay2026`). No third-party aggregators, no internal databases, no API keys: every figure on the dashboard is parsed from the ECI HTML pages.

The footer credits ECI / CEO Tamil Nadu and marks the dashboard as informational only. Treat this as a viewer over the official tally, not as a source of truth — for the canonical record refer to the ECI portal directly.

## Tech stack

- Next.js 16 (App Router) on React 19
- TypeScript, Tailwind 4
- SWR for client-side fetching, Zustand for view state
- Recharts for charts, Motion for transitions, Fuse.js for constituency search, Zod for response validation

No environment variables are required to run the app. There are no API keys anywhere in the codebase — the ECI HTML pages are public.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The dev server serves from `/`; production deploys mount under a `BASE_PATH` (see `next.config.ts`).

```bash
npm run build   # production build
npm run start   # serve the built app
```

## Project layout

```
src/
  app/                     # App Router routes
    page.tsx               # Home: hero arc + KPI stack + 234-cell stream
    constituency/          # Per-AC drilldown
    parties/ candidates/   # Reference views
    compare/ insights/ map/
    api/
      results/             # Final-tally JSON (static snapshot)
      results/raw/         # Pass-through to ECI summary JSON
      full-results/        # Alias of /api/results
      constituency/[acNo]/ # Single-AC detail
  components/
    charts/                # ParliamentArc, AllianceStream, etc.
    modules/               # KpiStack, AllianceLeaderboard, InsightStrip
    data-display/ shell/
  data/
    final-results.json     # Frozen ECI tally (served by /api/results)
    constituencies.ts parties.ts alliances.ts aggregate.ts
    party_lookup.ts synthetic.ts types.ts
  lib/
    eci-fanout.ts          # 234-fetch fanout against the ECI portal
    eci-html-parser.ts     # HTML → typed candidate records
    path.ts cn.ts
```

## API routes

| Route | Purpose |
| --- | --- |
| `GET /api/results` | Final aggregated tally (static, served from `final-results.json`). |
| `GET /api/full-results` | Alias of `/api/results`. |
| `GET /api/results/raw` | Lightweight pass-through to the ECI summary JSON for debugging. |
| `GET /api/constituency/[acNo]` | Per-constituency candidate detail. |

All routes run on the Node.js runtime and are pinned to `bom1` so that ECI's geo-fenced WAF accepts the request when fanout is active.

## Deployment

See [`DEPLOYMENT.md`](./DEPLOYMENT.md). The short version: push to a Git remote, deploy as a Next.js project, keep the region pinned to `bom1`, and point a CNAME at the deployment.

## Why a static snapshot now?

While counting was live, `/api/results` ran the full 234-page ECI fanout on every cache miss. Once the ECI pages froze, that traffic stopped being useful — and ECI's WAF blocks most cloud egress, so re-fetching from a hosting provider just produced 403s. The frozen tally was captured locally (the only network path the WAF accepts) and committed as `src/data/final-results.json`. The fanout code is still in the tree for reference and would work again if the same shape of election were re-run.

## Author

Built by Deraj Yojith. Issues and pull requests on GitHub are welcome.
