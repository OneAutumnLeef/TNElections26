# Deploying TN26 to tn26.derajyojith.dev

Three steps, ~10 minutes total.

## 1. Push to GitHub

From `tn26/`:

```bash
git init
git add .
git commit -m "TN26 election dashboard initial deploy"
gh repo create derajyojith/tn26 --public --source=. --remote=origin --push
```

If you don't use the `gh` CLI, create the repo manually on github.com, then:

```bash
git remote add origin https://github.com/derajyojith/tn26.git
git branch -M main
git push -u origin main
```

## 2. Deploy to Vercel

1. Go to https://vercel.com/new and import `derajyojith/tn26`.
2. Framework preset: **Next.js** (auto-detected).
3. **Do not set any environment variables** — `BASE_PATH` stays empty so the app serves from root.
4. Region is already pinned to `bom1` (Mumbai) via `vercel.json` — required for the ECI fanout to clear Akamai's geo-fence.
5. Click **Deploy**.

After ~90 seconds you'll have a URL like `https://tn26-xxx.vercel.app`. Open it — you should see the parliament arc with live ECI data.

## 3. Wire up tn26.derajyojith.dev

In the Vercel project: **Settings → Domains → Add Domain** → enter `tn26.derajyojith.dev`.

Vercel will tell you to add this DNS record:

```
Type:   CNAME
Name:   tn26
Value:  cname.vercel-dns.com
```

Add it at whoever runs DNS for `derajyojith.dev` (Cloudflare, Namecheap, Porkbun, GoDaddy, Squarespace, etc.). DNS usually propagates in <5 minutes.

If you're on Cloudflare, set the proxy to **DNS only** (grey cloud, not orange) — Vercel handles SSL natively and the proxied mode can interfere with their cert provisioning.

## 4. Verify

Once DNS resolves:

```bash
curl -I https://tn26.derajyojith.dev                 # → 200
curl -s https://tn26.derajyojith.dev/api/results | head -c 200
```

Expected: `x-source: eci-html-fanout` in headers, JSON with non-zero `byAlliance` totals.

If `x-source: synthetic-fallback` shows up, the deployment is not running in `bom1` and ECI is blocking it — double-check `vercel.json` has `"regions": ["bom1"]` and redeploy.

---

## Local dev

Unchanged — `npm run dev` still serves at `http://localhost:3000/` from root.

## Cost

Vercel hobby plan is free and sufficient. The full ECI fanout makes 234 fetches per cold cache miss; with `s-maxage=30, stale-while-revalidate=60` plus SWR polling at 60s, expect ~1 cold fanout per minute per region under load — well within free-tier quotas.

## Future-proofing

Once counting concludes and the per-AC HTML pages stop updating, `/api/results` falls back through tiers automatically:
1. ECI HTML fanout (`x-source: eci-html-fanout`)
2. ECI summary JSON (`x-source: eci-summary-fallback`)
3. Synthetic deterministic data (`x-source: synthetic-fallback`)

The dashboard keeps rendering through all three. No code changes needed.
