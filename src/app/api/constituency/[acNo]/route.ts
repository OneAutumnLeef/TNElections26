/**
 * Per-AC final results, derived from the static results snapshot.
 * Reshapes the LiveResults constituency entry into the per-AC response
 * format used by the constituency drilldown page.
 */

import { NextResponse } from "next/server";
import finalResults from "@/data/final-results.json";

export const runtime = "nodejs";
export const preferredRegion = ["bom1"];
export const dynamic = "force-static";

type Constituency = (typeof finalResults)["constituencies"][number];

const FINAL_AT = "2026-05-04T17:00:00Z";

function reshape(c: Constituency) {
  // Full-results candidates are already sorted by votes desc.
  const sorted = c.candidates;
  const totalVotes = c.totalVotes;
  const leaderEntry = sorted[0] ?? null;
  const runnerEntry = sorted[1] ?? null;
  const leaderMargin =
    leaderEntry && runnerEntry ? leaderEntry.votes - runnerEntry.votes : 0;

  const candidates = sorted.map((cand, i) => ({
    name: cand.name,
    party: cand.party,
    status: i === 0 ? "won" : "trailing",
    votes: cand.votes,
    margin:
      i === 0
        ? leaderMargin
        : leaderEntry
        ? cand.votes - leaderEntry.votes
        : 0,
  }));

  return {
    acNo: c.acNo,
    roundsCompleted: c.roundsCompleted,
    roundsTotal: c.roundsTotal,
    totalVotes,
    candidates,
    leader: leaderEntry
      ? {
          name: leaderEntry.name,
          party: leaderEntry.party,
          status: "won" as const,
          votes: leaderEntry.votes,
          margin: leaderMargin,
        }
      : null,
    runnerUp: runnerEntry
      ? {
          name: runnerEntry.name,
          party: runnerEntry.party,
          status: "trailing" as const,
          votes: runnerEntry.votes,
          margin: -leaderMargin,
        }
      : null,
    updatedAt: FINAL_AT,
    source: "static-final",
  };
}

export async function GET(_req: Request, ctx: { params: Promise<{ acNo: string }> }) {
  const { acNo } = await ctx.params;
  const n = parseInt(acNo, 10);
  if (!Number.isFinite(n) || n < 1 || n > 234) {
    return NextResponse.json({ error: "invalid acNo" }, { status: 400 });
  }
  const c = finalResults.constituencies.find((x) => x.acNo === n);
  if (!c) {
    return NextResponse.json({ acNo: n, error: "no data" }, { status: 404 });
  }
  return NextResponse.json(reshape(c), {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      "X-Source": "static-final",
    },
  });
}
