"use client";

import { useState } from "react";
import useSWR from "swr";
import type { LiveResults } from "@/data/types";
import { ALLIANCES, ALLIANCE_BY_ID } from "@/data/alliances";

export default function ComparePage() {
  const { data } = useSWR<LiveResults>("/api/results");
  const [a, setA] = useState("spa");
  const [b, setB] = useState("nda");

  if (!data) return <div className="mx-auto max-w-7xl p-6 text-sm text-(--text-subtle)">Loading…</div>;

  const A = data.byAlliance.find((x) => x.allianceId === a)!;
  const B = data.byAlliance.find((x) => x.allianceId === b)!;
  const Ameta = ALLIANCE_BY_ID[a as keyof typeof ALLIANCE_BY_ID];
  const Bmeta = ALLIANCE_BY_ID[b as keyof typeof ALLIANCE_BY_ID];

  const rows = [
    { label: "Won", left: A.won, right: B.won },
    { label: "Leading", left: A.leading, right: B.leading },
    { label: "Total (won + leading)", left: A.won + A.leading, right: B.won + B.leading },
    { label: "Vote share", left: A.voteShare, right: B.voteShare, isPercent: true },
    { label: "Seats contested", left: Ameta.seatsContested, right: Bmeta.seatsContested },
    { label: "Women candidates", left: Ameta.womenCandidates, right: Bmeta.womenCandidates },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6 sm:py-8">
      <header>
        <h1 className="text-lg font-semibold tracking-tight">Compare</h1>
        <p className="text-xs text-(--text-muted)">Side-by-side alliance performance.</p>
      </header>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-(--border) px-4 py-3">
          <Picker value={a} onChange={setA} alignRight />
          <span className="text-(--text-subtle) text-xs">vs</span>
          <Picker value={b} onChange={setB} />
        </div>

        <div className="grid grid-cols-[1fr_180px_1fr] divide-y divide-(--border)">
          {rows.map((r) => {
            const fmt = (v: number) => r.isPercent ? `${v.toFixed(1)}%` : v.toLocaleString("en-IN");
            const max = Math.max(1, r.left, r.right);
            return (
              <div key={r.label} className="contents">
                <div className="px-4 py-3 text-right">
                  <div className="tabular text-base font-semibold">{fmt(r.left)}</div>
                  <div className="ml-auto mt-1 h-1.5 overflow-hidden rounded-sm bg-(--bg-overlay)" style={{ width: `${(r.left / max) * 100}%` }}>
                    <div className="h-full" style={{ backgroundColor: Ameta.color }} />
                  </div>
                </div>
                <div className="px-2 py-3 text-center text-[10px] uppercase tracking-widest text-(--text-subtle)">
                  {r.label}
                </div>
                <div className="px-4 py-3">
                  <div className="tabular text-base font-semibold">{fmt(r.right)}</div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-sm bg-(--bg-overlay)" style={{ width: `${(r.right / max) * 100}%` }}>
                    <div className="h-full" style={{ backgroundColor: Bmeta.color }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Picker({ value, onChange, alignRight }: { value: string; onChange: (v: string) => void; alignRight?: boolean }) {
  const meta = ALLIANCE_BY_ID[value as keyof typeof ALLIANCE_BY_ID];
  return (
    <div className={alignRight ? "text-right" : ""}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-(--border) bg-(--bg) px-3 py-2 text-sm font-semibold outline-none focus:border-(--color-brand)"
        style={{ color: meta.color }}
      >
        {ALLIANCES.map((al) => (
          <option key={al.id} value={al.id}>{al.short} — {al.name}</option>
        ))}
      </select>
    </div>
  );
}
