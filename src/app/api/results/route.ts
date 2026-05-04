import { NextResponse } from "next/server";
import { generateSyntheticResults } from "@/data/synthetic";
import type { LiveResults } from "@/data/types";
import { CONSTITUENCIES } from "@/data/constituencies";
import { partyToAlliance } from "@/data/aggregate";
import { ALLIANCES } from "@/data/alliances";
import { PARTIES } from "@/data/parties";
import { fetchAllAcs, buildLiveResults } from "@/lib/eci-fanout";

export const runtime = "edge";
export const preferredRegion = ["bom1"];
export const dynamic = "force-dynamic";

const ECI_URL = "https://results.eci.gov.in/ResultAcGenMay2026/election-json-S22-live.json";

type EciChartRow = [string, string, number, string, string]; // [party, stateCode, acNo, candidateName, color]
type EciTableRow = [string, string, number]; // [party, stateCode, acNo]
type EciStateBlock = {
  chartData?: EciChartRow[];
  tableData?: EciTableRow[];
};

const ECI_PARTY_ALIASES: Record<string, string> = {
  ADMK: "AIADMK",
  AMMKMNKZ: "AMMK",
  NA: "PENDING",
};

function normalizePartyCode(eciCode: string): string {
  return ECI_PARTY_ALIASES[eciCode] ?? eciCode;
}

/**
 * Fetch the lightweight summary JSON. Used as a fallback when the full HTML
 * fan-out fails (e.g. ECI HTML pages timing out, edge runtime resource limits).
 */
async function fetchSummaryJson(): Promise<
  | { ok: true; data: unknown; upstreamDate: string | null; upstreamLastModified: string | null }
  | { ok: false; reason: string }
> {
  try {
    const r = await fetch(`${ECI_URL}?t=${Date.now()}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Referer: "https://results.eci.gov.in/ResultAcGenMay2026/",
        Accept: "application/json,text/plain,*/*",
        "Cache-Control": "no-cache",
      },
      cache: "no-store",
    });
    if (!r.ok) return { ok: false, reason: `HTTP ${r.status}` };
    const ct = r.headers.get("content-type") ?? "";
    if (!ct.includes("json")) return { ok: false, reason: `non-json (${ct})` };
    const data = await r.json();
    return {
      ok: true,
      data,
      upstreamDate: r.headers.get("date"),
      upstreamLastModified: r.headers.get("last-modified"),
    };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "fetch failed" };
  }
}

function normalizeFromSummary(eci: unknown, dataAt: string): LiveResults | null {
  const block = (eci as Record<string, EciStateBlock>)?.S22;
  if (!block) return null;
  const chartData = block.chartData ?? [];
  const tableData = block.tableData ?? [];
  const rows: Array<{ party: string; acNo: number; candidate?: string }> =
    chartData.length > 0
      ? chartData.map((r) => ({ party: r[0], acNo: r[2], candidate: r[3] }))
      : tableData.map((r) => ({ party: r[0], acNo: r[2] }));
  if (rows.length === 0) return null;

  const leaderByAc = new Map<number, { party: string; candidate?: string }>();
  for (const r of rows) {
    const code = normalizePartyCode(r.party);
    if (code === "PENDING") continue;
    leaderByAc.set(r.acNo, { party: code, candidate: r.candidate });
  }

  const partyLeading: Record<string, number> = {};
  for (const v of leaderByAc.values()) {
    partyLeading[v.party] = (partyLeading[v.party] ?? 0) + 1;
  }
  const allianceLeading: Record<string, number> = {};
  for (const code of Object.keys(partyLeading)) {
    const a = partyToAlliance(code);
    allianceLeading[a] = (allianceLeading[a] ?? 0) + partyLeading[code];
  }

  return {
    updatedAt: dataAt,
    countingStartedAt: "2026-05-04T08:00:00+05:30",
    totalSeats: 234,
    majorityThreshold: 118,
    byAlliance: ALLIANCES.map((a) => ({
      allianceId: a.id,
      won: 0,
      leading: allianceLeading[a.id] ?? 0,
      voteShare: 0,
    })),
    byParty: PARTIES.map((p) => ({
      party: p.code,
      won: 0,
      leading: partyLeading[p.code] ?? 0,
      voteShare: 0,
    })),
    constituencies: CONSTITUENCIES.map((c) => {
      const lead = leaderByAc.get(c.id);
      if (!lead) {
        return {
          acNo: c.id,
          status: "pending" as const,
          roundsCompleted: 0,
          roundsTotal: 0,
          totalVotes: 0,
          candidates: [],
          leader: null,
        };
      }
      return {
        acNo: c.id,
        status: "leading" as const,
        roundsCompleted: 0,
        roundsTotal: 0,
        totalVotes: 0,
        candidates: lead.candidate
          ? [{ candidateId: c.id * 100 + 1, name: lead.candidate, party: lead.party, votes: 0 }]
          : [],
        leader: { candidateId: c.id * 100 + 1, party: lead.party, margin: 0 },
      };
    }),
  };
}

/**
 * Tiered data resolution:
 *   eci-html-fanout  → 234-AC HTML scrape with full votes/margins/vote share
 *   eci-summary      → light JSON (party tally only, no margins or votes)
 *   synthetic        → deterministic mock for offline / blocked dev
 *
 * The fan-out is the primary path. We only fall back when it returns < ~50%
 * of constituencies, which signals widespread ECI failure rather than a few
 * slow pages.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const source = url.searchParams.get("source");

  if (source === "synthetic") {
    const seed = Math.floor(Date.now() / 60_000);
    const data = generateSyntheticResults(seed, 0.45);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "s-maxage=20, stale-while-revalidate=60", "X-Source": "synthetic" },
    });
  }

  if (source === "summary") {
    const eci = await fetchSummaryJson();
    if (eci.ok) {
      const dataAt =
        eci.upstreamLastModified
          ? new Date(eci.upstreamLastModified).toISOString()
          : eci.upstreamDate
          ? new Date(eci.upstreamDate).toISOString()
          : new Date().toISOString();
      const norm = normalizeFromSummary(eci.data, dataAt);
      if (norm) {
        return NextResponse.json(norm, {
          headers: {
            "Cache-Control": "s-maxage=30, stale-while-revalidate=60",
            "X-Source": "eci-summary",
            "X-Eci-Data-At": dataAt,
          },
        });
      }
    }
  }

  // Default: full HTML fanout
  const startedAt = Date.now();
  const byAc = await fetchAllAcs();
  const elapsed = Date.now() - startedAt;

  if (byAc.size >= 117) {
    const data = buildLiveResults(byAc);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "s-maxage=30, stale-while-revalidate=60",
        "X-Source": "eci-html-fanout",
        "X-Acs-Fetched": String(byAc.size),
        "X-Fanout-Ms": String(elapsed),
      },
    });
  }

  // Fan-out failed badly → fall back to summary JSON
  const eci = await fetchSummaryJson();
  if (eci.ok) {
    const dataAt =
      eci.upstreamLastModified
        ? new Date(eci.upstreamLastModified).toISOString()
        : eci.upstreamDate
        ? new Date(eci.upstreamDate).toISOString()
        : new Date().toISOString();
    const norm = normalizeFromSummary(eci.data, dataAt);
    if (norm) {
      return NextResponse.json(norm, {
        headers: {
          "Cache-Control": "s-maxage=30, stale-while-revalidate=60",
          "X-Source": "eci-summary-fallback",
          "X-Eci-Data-At": dataAt,
          "X-Fanout-Got": String(byAc.size),
        },
      });
    }
  }

  // Last resort
  const seed = Math.floor(Date.now() / 60_000);
  const data = generateSyntheticResults(seed, 0.45);
  return NextResponse.json(data, {
    headers: { "Cache-Control": "s-maxage=20, stale-while-revalidate=60", "X-Source": "synthetic-fallback" },
  });
}
