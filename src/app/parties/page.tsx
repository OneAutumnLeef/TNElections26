"use client";

import useSWR from "swr";
import type { LiveResults } from "@/data/types";
import { PARTIES, partyColor } from "@/data/parties";
import { ALLIANCE_BY_ID } from "@/data/alliances";
import { FlowNum } from "@/components/data-display/NumberFlow";
import { AllianceTag } from "@/components/data-display/AllianceTag";
import { api } from "@/lib/path";

export default function PartiesPage() {
  const { data } = useSWR<LiveResults>(api("/api/results"));

  if (!data) return <div className="mx-auto max-w-7xl p-6 text-sm text-(--text-subtle)">Loading…</div>;

  const byCode = new Map(data.byParty.map((p) => [p.party, p]));
  const sorted = [...PARTIES]
    .map((p) => {
      const r = byCode.get(p.code);
      return {
        ...p,
        won: r?.won ?? 0,
        leading: r?.leading ?? 0,
        voteShare: r?.voteShare ?? 0,
        won2021: p.won2021 ?? 0,
        delta: (r?.won ?? 0) + (r?.leading ?? 0) - (p.won2021 ?? 0),
      };
    })
    .filter((p) => p.seatsContested > 0)
    .sort((a, b) => b.won + b.leading - (a.won + a.leading));

  const maxTotal = Math.max(1, ...sorted.map((p) => p.won + p.leading));

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-6 sm:px-6 sm:py-8">
      <header>
        <h1 className="text-lg font-semibold tracking-tight">Party performance</h1>
        <p className="text-xs text-(--text-muted)">Sorted by current seat count (won + leading) · 2021 baseline shown for swing.</p>
      </header>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-[1fr_60px_60px_70px_1fr_70px] items-center gap-2 border-b border-(--border) px-4 py-2 text-[10px] font-medium uppercase tracking-widest text-(--text-subtle)">
          <div>Party</div>
          <div className="text-right">Won</div>
          <div className="text-right">Leading</div>
          <div className="text-right">2021</div>
          <div>Win conversion (contested → won)</div>
          <div className="text-right">Δ</div>
        </div>
        <ul className="divide-y divide-(--border)">
          {sorted.map((p) => {
            const total = p.won + p.leading;
            const widthPct = (total / maxTotal) * 100;
            const conversionPct = (total / Math.max(1, p.seatsContested)) * 100;
            return (
              <li key={p.id} className="grid grid-cols-[1fr_60px_60px_70px_1fr_70px] items-center gap-2 px-4 py-3 transition-colors hover:bg-(--bg-overlay)">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold" style={{ color: partyColor(p.code) }}>{p.code}</span>
                      <AllianceTag id={p.alliance} size="xs" />
                    </div>
                    <div className="truncate text-[11px] text-(--text-muted)">{p.name}</div>
                  </div>
                </div>
                <div className="text-right tabular text-sm font-semibold">
                  <FlowNum value={p.won} />
                </div>
                <div className="text-right tabular text-sm text-(--text-muted)">
                  <FlowNum value={p.leading} />
                </div>
                <div className="text-right tabular text-sm text-(--text-subtle)">{p.won2021 || "—"}</div>
                <div>
                  <div className="relative h-2 overflow-hidden rounded-sm bg-(--bg-overlay)">
                    <div
                      className="absolute inset-y-0 left-0 transition-[width] duration-700"
                      style={{ width: `${widthPct}%`, backgroundColor: p.color }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] text-(--text-subtle)">
                    <span className="tabular">{p.seatsContested} contested</span>
                    <span className="tabular">{conversionPct.toFixed(0)}%</span>
                  </div>
                </div>
                <div className={"text-right tabular text-sm font-semibold " + (p.delta > 0 ? "text-(--color-won)" : p.delta < 0 ? "text-(--color-live)" : "text-(--text-subtle)")}>
                  {p.delta > 0 ? "+" : ""}{p.delta}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
