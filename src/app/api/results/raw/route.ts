// Debug endpoint: returns the raw ECI JSON verbatim so we can inspect the
// schema once counting starts and counts populate. Use to fix the parser in
// /api/results when the column order is confirmed.

export const runtime = "nodejs";
export const preferredRegion = ["bom1"];
export const dynamic = "force-dynamic";
export const maxDuration = 15;

const ECI_URL = "https://results.eci.gov.in/ResultAcGenMay2026/election-json-S22-live.json";

export async function GET() {
  try {
    const r = await fetch(`${ECI_URL}?t=${Date.now()}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Referer: "https://results.eci.gov.in/ResultAcGenMay2026/",
      },
      cache: "no-store",
    });
    const body = await r.text();
    return new Response(body, {
      status: r.status,
      headers: {
        "Content-Type": r.headers.get("content-type") ?? "application/json",
        "X-Eci-Status": String(r.status),
      },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "fetch failed" }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }
}
