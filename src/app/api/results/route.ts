/**
 * Final results endpoint.
 *
 * Counting wrapped on 2026-05-04. The dashboard now serves a static snapshot
 * of the final ECI tally — no live fetching, no synthetic fallback. The
 * snapshot was captured from the live ECI fanout while the dev server was
 * running on the user's home ISP (the only network path ECI's Akamai WAF
 * allowed). All cloud egress is blocked, so re-fetching from Vercel would
 * just produce 403s.
 */

import { NextResponse } from "next/server";
import finalResults from "@/data/final-results.json";

export const runtime = "nodejs";
export const preferredRegion = ["bom1"];
export const dynamic = "force-static";

const FINAL_AT = "2026-05-04T17:00:00Z";

export async function GET() {
  const data = { ...finalResults, updatedAt: FINAL_AT };
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      "X-Source": "static-final",
    },
  });
}
