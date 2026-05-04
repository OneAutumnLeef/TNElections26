"use client";

import type { LiveResults } from "@/data/types";
import { ALLIANCES, ALLIANCE_BY_ID } from "@/data/alliances";
import { FlowNum } from "@/components/data-display/NumberFlow";

export function AllianceLeaderboard({ results }: { results: LiveResults }) {
  const sorted = [...results.byAlliance].sort(
    (a, b) => b.won + b.leading - (a.won + a.leading),
  );
  const max = Math.max(1, ...sorted.map((a) => a.won + a.leading));

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-(--border) px-4 py-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">
          Alliance Tally
        </h3>
        <div className="flex items-center gap-3 text-[10px] text-(--text-subtle)">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-(--color-won)" /> Won
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-(--color-leading) opacity-60" /> Leading
          </span>
        </div>
      </div>
      <ul className="divide-y divide-(--border)">
        {sorted.filter((a) => a.won + a.leading > 0 || ["spa", "nda", "tvk", "ntk"].includes(a.allianceId)).map((a) => {
          const meta = ALLIANCE_BY_ID[a.allianceId];
          const total = a.won + a.leading;
          const wonPct = (a.won / max) * 100;
          const leadPct = (a.leading / max) * 100;
          return (
            <li key={a.allianceId} className="px-4 py-2.5">
              <div className="flex items-center gap-3">
                <div className="w-16 shrink-0">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: meta.color }}
                  >
                    {meta.short}
                  </span>
                </div>
                <div className="relative flex-1 overflow-hidden rounded-sm bg-(--bg-overlay) h-3">
                  <div
                    className="absolute inset-y-0 left-0 transition-[width] duration-700"
                    style={{ width: `${wonPct}%`, backgroundColor: meta.color }}
                  />
                  <div
                    className="absolute inset-y-0 transition-[width] duration-700"
                    style={{
                      left: `${wonPct}%`,
                      width: `${leadPct}%`,
                      backgroundColor: meta.color,
                      opacity: 0.45,
                    }}
                  />
                </div>
                <div className="w-16 shrink-0 text-right tabular text-sm font-semibold text-(--text)">
                  <FlowNum value={total} />
                </div>
              </div>
              <div className="ml-[5rem] mt-0.5 flex items-center gap-3 text-[10px] text-(--text-subtle)">
                <span className="tabular">won {a.won}</span>
                <span className="tabular">leading {a.leading}</span>
                <span className="ml-auto tabular">{a.voteShare > 0 ? `${a.voteShare.toFixed(1)}% vote` : "—"}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
