// Alias of /api/results — kept so any external links to /api/full-results
// continue to resolve. Both serve the same static final snapshot now.

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
