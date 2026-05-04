"use client";

import type { LiveResults } from "@/data/types";
import { TOTAL_ELECTORS, MAJORITY } from "@/data/aggregate";
import { FlowNum } from "@/components/data-display/NumberFlow";
import { ALLIANCE_BY_ID } from "@/data/alliances";
import { CONSTITUENCY_BY_ID } from "@/data/constituencies";
import { partyToAlliance } from "@/data/aggregate";

export function KpiStack({ results }: { results: LiveResults }) {
  const leader = [...results.byAlliance].sort((a, b) => b.won + b.leading - (a.won + a.leading))[0];
  const leaderTotal = leader ? leader.won + leader.leading : 0;
  const leaderName = leader ? ALLIANCE_BY_ID[leader.allianceId].short : "—";
  const leaderColor = leader ? ALLIANCE_BY_ID[leader.allianceId].color : "var(--text-muted)";

  // ECI live JSON has no won/leading split and no margins yet — use signals
  // we actually have: leader-assignment count and 2021-vs-now alliance flips.
  const called = results.constituencies.filter((c) => !!c.leader).length;
  const swings = results.constituencies.filter((c) => {
    if (!c.leader) return false;
    const meta = CONSTITUENCY_BY_ID[c.acNo];
    return partyToAlliance(meta.prevWinner) !== partyToAlliance(c.leader.party);
  }).length;

  const stats = [
    { label: "Total seats", value: 234, sub: "Tamil Nadu Legislative Assembly", strong: false },
    { label: "Majority threshold", value: MAJORITY, sub: "Half of 234 + 1", strong: false },
    { label: `${leaderName} projection`, value: leaderTotal, sub: "Won + leading", strong: true, color: leaderColor },
    { label: "Called so far", value: called, sub: `${Math.round((called / 234) * 100)}% of seats have a leader`, strong: false },
    { label: "Swings vs 2021", value: swings, sub: "Constituencies that flipped alliances", strong: false },
    { label: "Total electors", value: Math.round(TOTAL_ELECTORS / 100000), suffix: "L", sub: "5.73 Cr · 2026 roll", strong: false },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="card p-3 sm:p-4"
        >
          <div className="text-[10px] font-medium uppercase tracking-wider text-(--text-subtle)">
            {s.label}
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span
              className="tabular text-2xl sm:text-3xl font-semibold"
              style={s.strong ? { color: s.color } : undefined}
            >
              <FlowNum value={s.value} />
            </span>
            {s.suffix && <span className="text-sm text-(--text-muted)">{s.suffix}</span>}
          </div>
          <div className="mt-1 text-[11px] text-(--text-muted)">{s.sub}</div>
        </div>
      ))}
    </div>
  );
}
