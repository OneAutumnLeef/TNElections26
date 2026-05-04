/**
 * Per-AC live data: fetches and parses ECI's candidateswise HTML page.
 * Used by the constituency detail page for full candidate breakdown,
 * round status, vote counts, and margins.
 */

import { NextResponse } from "next/server";
import { parseEciCandidatesPage } from "@/lib/eci-html-parser";
import { normalizePartyName } from "@/data/party_lookup";

export const runtime = "edge";
export const preferredRegion = ["bom1"];
export const dynamic = "force-dynamic";

const ECI_BASE = "https://results.eci.gov.in/ResultAcGenMay2026";

export async function GET(_req: Request, ctx: { params: Promise<{ acNo: string }> }) {
  const { acNo } = await ctx.params;
  const n = parseInt(acNo, 10);
  if (!Number.isFinite(n) || n < 1 || n > 234) {
    return NextResponse.json({ error: "invalid acNo" }, { status: 400 });
  }

  // Try both candidate URL variants — ECI has used both spellings historically.
  const candidates = [
    `${ECI_BASE}/candidateswise-S22${n}.htm`,
    `${ECI_BASE}/ConstituencywiseS22${n}.htm`,
  ];

  let html: string | null = null;
  let usedUrl: string | null = null;
  let upstreamDate: string | null = null;
  for (const url of candidates) {
    try {
      const r = await fetch(`${url}?t=${Date.now()}`, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Referer: `${ECI_BASE}/`,
          Accept: "text/html,application/xhtml+xml,*/*",
        },
        cache: "no-store",
      });
      if (r.ok) {
        const ct = r.headers.get("content-type") ?? "";
        if (ct.includes("html")) {
          html = await r.text();
          usedUrl = url;
          upstreamDate = r.headers.get("date");
          break;
        }
      }
    } catch {
      // try next variant
    }
  }

  if (!html) {
    return NextResponse.json(
      { acNo: n, error: "ECI unreachable or no matching page" },
      { status: 502 },
    );
  }

  const parsed = parseEciCandidatesPage(html, n);
  // Normalize full party names to canonical short codes
  parsed.candidates = parsed.candidates.map((c) => ({ ...c, party: normalizePartyName(c.party) }));
  if (parsed.leader) parsed.leader = { ...parsed.leader, party: normalizePartyName(parsed.leader.party) };
  if (parsed.runnerUp) parsed.runnerUp = { ...parsed.runnerUp, party: normalizePartyName(parsed.runnerUp.party) };

  return NextResponse.json(
    {
      ...parsed,
      updatedAt: upstreamDate ? new Date(upstreamDate).toISOString() : new Date().toISOString(),
      source: usedUrl,
    },
    {
      headers: {
        "Cache-Control": "s-maxage=30, stale-while-revalidate=60",
        "X-Source": "eci-live-html",
      },
    },
  );
}
