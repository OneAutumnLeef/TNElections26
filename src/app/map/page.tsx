"use client";

import useSWR from "swr";
import type { LiveResults } from "@/data/types";
import { CONSTITUENCIES, CONSTITUENCY_BY_ID, constituencySlug } from "@/data/constituencies";
import { partyToAlliance } from "@/data/aggregate";
import { ALLIANCE_BY_ID } from "@/data/alliances";
import { partyColor } from "@/data/parties";
import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { api } from "@/lib/path";

type Mode = "winner" | "margin" | "swing";

export default function MapPage() {
  const { data } = useSWR<LiveResults>(api("/api/results"));
  const [hoverAc, setHoverAc] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>("winner");

  const acResults = useMemo(() => {
    const m = new Map<number, LiveResults["constituencies"][number]>();
    if (data) for (const c of data.constituencies) m.set(c.acNo, c);
    return m;
  }, [data]);

  // Group ACs by district. Order districts roughly north to south.
  const districtOrder = [
    "Thiruvallur", "Chennai", "Chengalpattu", "Kancheepuram",
    "Ranipet", "Vellore", "Tirupathur", "Krishnagiri", "Dharmapuri",
    "Tiruvannamalai", "Viluppuram", "Kallakurichi", "Salem", "Namakkal",
    "Erode", "Tiruppur", "The Nilgiris", "Coimbatore", "Dindigul",
    "Karur", "Tiruchirappalli", "Perambalur", "Ariyalur", "Cuddalore",
    "Mayiladuthurai", "Nagapattinam", "Thiruvarur", "Thanjavur", "Pudukkottai",
    "Sivaganga", "Madurai", "Theni", "Virudhunagar", "Ramanathapuram",
    "Thoothukudi", "Tenkasi", "Tirunelveli", "Kanniyakumari",
  ];

  const byDistrict = useMemo(() => {
    const map = new Map<string, typeof CONSTITUENCIES>();
    for (const c of CONSTITUENCIES) {
      const arr = map.get(c.district) ?? [];
      arr.push(c);
      map.set(c.district, arr);
    }
    return map;
  }, []);

  const hoverConst = hoverAc ? CONSTITUENCY_BY_ID[hoverAc] : null;
  const hoverResult = hoverAc ? acResults.get(hoverAc) : null;
  const hoverAlliance = hoverResult?.leader ? partyToAlliance(hoverResult.leader.party) : null;

  function cellColor(acNo: number): string {
    const r = acResults.get(acNo);
    const c = CONSTITUENCY_BY_ID[acNo];
    if (mode === "swing" && r?.leader && c) {
      const prev = partyToAlliance(c.prevWinner);
      const now = partyToAlliance(r.leader.party);
      if (prev === now) return "var(--border)";
      return ALLIANCE_BY_ID[now]?.color ?? "var(--border)";
    }
    if (!r?.leader) return "var(--border)";
    if (mode === "margin" && r.status === "won") {
      const intensity = Math.min(1, r.leader.margin / 80000);
      const base = partyColor(r.leader.party);
      return base + Math.round(60 + intensity * 195).toString(16).padStart(2, "0");
    }
    return partyColor(r.leader.party);
  }

  function cellOpacity(acNo: number): number {
    const r = acResults.get(acNo);
    if (!r?.leader) return 0.18;
    if (r.status === "won") return 1;
    if (r.status === "leading") return 0.55;
    return 0.3;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Constituency map</h1>
          <p className="text-xs text-(--text-muted)">
            All 234 ACs grouped by district (rough north-to-south layout). Hover for details, click to drill in.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-(--border) bg-(--bg-elevated) p-1 text-xs">
          {(["winner", "margin", "swing"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "rounded-md px-2.5 py-1 transition-colors",
                mode === m ? "bg-(--bg-overlay) text-(--text)" : "text-(--text-muted) hover:text-(--text)",
              )}
            >
              {m === "winner" ? "Leading party" : m === "margin" ? "Margin heat" : "Swing only"}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="card p-4 sm:p-5">
          <div className="flex flex-wrap gap-x-4 gap-y-3">
            {districtOrder.map((d) => {
              const arr = byDistrict.get(d);
              if (!arr) return null;
              return (
                <div key={d} className="space-y-1">
                  <div className="text-[9px] font-medium uppercase tracking-widest text-(--text-subtle)">
                    {d} <span className="text-(--text-subtle) opacity-50">· {arr.length}</span>
                  </div>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(20px,1fr))] gap-0.5" style={{ width: `${Math.min(arr.length, 8) * 22}px` }}>
                    {arr
                      .sort((a, b) => a.id - b.id)
                      .map((c) => {
                        const r = acResults.get(c.id);
                        const status = r?.status ?? "pending";
                        return (
                          <Link
                            key={c.id}
                            href={`/constituency/${constituencySlug(c.name)}`}
                            onMouseEnter={() => setHoverAc(c.id)}
                            onMouseLeave={() => setHoverAc(null)}
                            className="relative aspect-square rounded-[3px] outline-1 outline-transparent transition-all hover:scale-[1.18] hover:outline-(--border-strong) hover:z-10"
                            style={{
                              backgroundColor: cellColor(c.id),
                              opacity: cellOpacity(c.id),
                            }}
                            aria-label={`AC ${c.id} ${c.name}`}
                          >
                            {status === "won" && (
                              <span className="absolute inset-0 rounded-[3px] ring-1 ring-inset ring-white/20" />
                            )}
                          </Link>
                        );
                      })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hover panel */}
        <div className="card sticky top-28 h-fit p-4">
          {hoverConst ? (
            <div>
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="mono text-[10px] uppercase tracking-widest text-(--text-subtle)">
                    AC {hoverConst.id} · {hoverConst.district}
                  </div>
                  <div className="mt-0.5 text-base font-semibold">{hoverConst.name}</div>
                </div>
                <span className="rounded-md bg-(--bg-overlay) px-1.5 py-0.5 text-[10px] text-(--text-muted)">
                  {hoverConst.category}
                </span>
              </div>

              {hoverResult?.leader ? (
                <div className="mt-4 space-y-2.5">
                  <div className="flex items-baseline justify-between">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: partyColor(hoverResult.leader.party) }}
                    >
                      {hoverResult.leader.party}
                    </span>
                    <span className="mono text-xs uppercase tracking-widest" style={{ color: hoverAlliance ? ALLIANCE_BY_ID[hoverAlliance].color : "var(--text-muted)" }}>
                      {hoverResult.status}
                    </span>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-(--text-subtle)">Margin</div>
                    <div className="tabular text-xl font-semibold">
                      {hoverResult.leader.margin.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-(--text-subtle)">Round</div>
                    <div className="tabular text-sm">
                      {hoverResult.roundsCompleted} / {hoverResult.roundsTotal}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1 text-[10px]">
                    <span className="text-(--text-subtle)">Previous:</span>
                    <span className="rounded bg-(--bg-overlay) px-1.5 py-0.5 text-(--text-muted)">{hoverConst.prevWinner}</span>
                    {hoverConst.prevWinner !== hoverResult.leader.party && (
                      <span className="rounded bg-(--color-counting)/20 px-1.5 py-0.5" style={{ color: "var(--color-counting)" }}>
                        SWING
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-4 text-sm text-(--text-subtle)">
                  Counting not started. {hoverConst.candidates} candidates · {hoverConst.electors.toLocaleString("en-IN")} electors
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-(--text-subtle)">Hover over a constituency to see details.</div>
          )}
        </div>
      </div>
    </div>
  );
}
