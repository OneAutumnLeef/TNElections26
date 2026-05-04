# Deploying TN26 to derajyojith.dev/tnelections26

Two pieces:

1. **Deploy this Next.js app to Vercel**, region pinned to Mumbai (`bom1`) so the ECI fan-out works.
2. **Wire `derajyojith.dev/tnelections26`** to the Vercel deployment via a rewrite from your portfolio.

Local dev still runs at `http://localhost:3000/` — `BASE_PATH` is unset in dev so the app serves from root.

---

## Step 1 — Push to GitHub

From `tn26/`:

```bash
git init
git add .
git commit -m "TN26 election dashboard initial deploy"
gh repo create derajyojith/tn26 --public --source=. --remote=origin --push
```

If you don't use the `gh` CLI: create the repo manually on github.com, then:

```bash
git remote add origin https://github.com/derajyojith/tn26.git
git branch -M main
git push -u origin main
```

## Step 2 — Deploy to Vercel

1. Go to https://vercel.com/new and import `derajyojith/tn26`.
2. Framework preset: **Next.js** (auto-detected).
3. **Environment variables** — add one:

   | Name | Value |
   |---|---|
   | `BASE_PATH` | `/tnelections26` |

   This makes the app expect to be served at `/tnelections26/*`. The `vercel.json` in the repo also sets it at build time, but adding it in the dashboard is belt-and-braces.

4. Region is already pinned to `bom1` (Mumbai) via `vercel.json` — no UI step needed.
5. Click **Deploy**.

After ~90 seconds you'll have a URL like `https://tn26.vercel.app`. Visit `https://tn26.vercel.app/tnelections26` to confirm the app loads. (Visiting `https://tn26.vercel.app/` will 404 — that's expected because the basePath is `/tnelections26`.)

## Step 3 — Wire derajyojith.dev/tnelections26 → Vercel

Pick the path that matches where your portfolio lives.

### 3A · Portfolio is on Vercel (recommended)

In your portfolio repo, edit `vercel.json` (create one if it doesn't exist):

```json
{
  "rewrites": [
    {
      "source": "/tnelections26",
      "destination": "https://tn26.vercel.app/tnelections26"
    },
    {
      "source": "/tnelections26/:path*",
      "destination": "https://tn26.vercel.app/tnelections26/:path*"
    }
  ]
}
```

Replace `tn26.vercel.app` with the actual deployment URL Vercel gave you. Push the portfolio repo — Vercel redeploys automatically.

`derajyojith.dev/tnelections26` now serves the dashboard. Internal navigation, asset URLs, and `/api/*` calls all stay under `/tnelections26/*` thanks to `basePath`, so the rewrite covers everything with one rule pair.

### 3B · Portfolio is on GitHub Pages / Netlify / static host with no rewrite support

GitHub Pages can't proxy to another origin, so `/tnelections26` cannot be a true subpath under `derajyojith.dev`. Two clean alternatives:

**Option 3B-i: Use a subdomain instead** (5 minutes, no portfolio changes)

In Vercel project settings → Domains, add `tn26.derajyojith.dev`. Vercel will give you a CNAME to add at your DNS provider:

```
tn26  CNAME  cname.vercel-dns.com
```

Then **clear** the `BASE_PATH` env var in Vercel (set it to empty string) and **remove** the `build.env.BASE_PATH` line from `vercel.json`. Redeploy. The dashboard now lives at `https://tn26.derajyojith.dev/`.

**Option 3B-ii: Migrate the portfolio to Vercel** so you can use 3A. Worth it if you want the canonical `/tnelections26` path.

### 3C · Cloudflare in front of GH Pages portfolio

If you're already on Cloudflare, you can do the rewrite there with a Worker or a Page Rule that proxies `derajyojith.dev/tnelections26/*` to `tn26.vercel.app/tnelections26/*`. This is more work than 3A but avoids moving the portfolio.

---

## Step 4 — Verify

After the rewrite/subdomain is live:

```bash
curl -I https://derajyojith.dev/tnelections26       # → 200
curl -I https://derajyojith.dev/tnelections26/api/results   # → 200, x-source: eci-html-fanout
curl -s https://derajyojith.dev/tnelections26/api/results | head -c 200
```

Expected response: `x-source: eci-html-fanout` and JSON with non-zero `byAlliance` totals.

If `x-source: synthetic-fallback` shows up, the bom1 region isn't reaching ECI — double-check `vercel.json` has `"regions": ["bom1"]` and that the route file exports `preferredRegion = ["bom1"]` (already set for `/api/results`, `/api/full-results`, `/api/constituency/[acNo]`).

---

## Vercel cost notes

- Hobby plan is free and sufficient. No paid features used.
- The full ECI fan-out makes 234 fetches per cold cache hit. With `s-maxage=30, stale-while-revalidate=60` and SWR polling at 60s, expect ~1 cold fan-out per minute per region under heavy load — well within the 100 GB-Hours/month limit.
- If you ever migrate to a paid plan, no config changes needed.

---

## Future-proofing

When the per-AC HTML stops being available (post-counting day), `/api/results` will fail the `byAc.size >= 117` check and fall back to the summary JSON, then synthetic. The dashboard keeps rendering — just with fewer details. No code change needed for graceful degradation.
