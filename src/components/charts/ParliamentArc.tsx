"use client";

import { ALLIANCES } from "@/data/alliances";
import type { AllianceId } from "@/data/types";

const TOTAL = 234;
const ROWS = 9;
const OUTER_RADIUS = 180;
const INNER_RADIUS = 95; // leaves a clear hole in the center for labels

type Props = {
  byAlliance: Array<{ allianceId: AllianceId; won: number; leading: number }>;
  width?: number;
  height?: number;
};

function dotPositions() {
  // Distribute 234 dots across concentric semicircle rows.
  // Outer rows get more dots (longer arc length).
  const rowCounts: number[] = [];
  const base: number[] = [];
  for (let i = 0; i < ROWS; i++) base.push(20 + i * 2); // outer rows have more
  base.reverse(); // index 0 = outermost
  const sum = base.reduce((s, v) => s + v, 0);
  for (let i = 0; i < ROWS; i++) {
    rowCounts[i] = Math.round((base[i] / sum) * TOTAL);
  }
  let total = rowCounts.reduce((s, v) => s + v, 0);
  while (total < TOTAL) {
    rowCounts[0]++;
    total++;
  }
  while (total > TOTAL) {
    rowCounts[0]--;
    total--;
  }

  const positions: Array<{ x: number; y: number }> = [];
  for (let r = 0; r < ROWS; r++) {
    const t = r / (ROWS - 1);
    const radius = OUTER_RADIUS - t * (OUTER_RADIUS - INNER_RADIUS);
    const count = rowCounts[r];
    for (let i = 0; i < count; i++) {
      const a = count === 1 ? 0.5 : i / (count - 1);
      // angle: π (left) → 0 (right)
      const angle = Math.PI - a * Math.PI;
      positions.push({
        x: Math.cos(angle) * radius,
        y: -Math.sin(angle) * radius,
      });
    }
  }
  // Sort left → right by signed angle from -π/2 axis. atan2(x, -y) gives
  // -π/2 for far left, 0 for top, +π/2 for far right.
  positions.sort((p, q) => Math.atan2(p.x, -p.y) - Math.atan2(q.x, -q.y));
  return positions;
}

const POSITIONS = dotPositions();

export function ParliamentArc({ byAlliance, width = 560, height = 280 }: Props) {
  // Left → right ordering: opposition (SPA) on the left, centrist (TVK) in
  // the middle, ruling/incumbent (NDA) on the right. Smaller blocs flank.
  const order: AllianceId[] = ["spa", "others", "independent", "tvk", "ajpk", "ntk", "nda"];
  const assignment: Array<{ alliance: AllianceId; status: "won" | "leading" | "empty" }> = [];
  for (const a of order) {
    const block = byAlliance.find((b) => b.allianceId === a);
    if (!block) continue;
    for (let i = 0; i < block.won; i++) assignment.push({ alliance: a, status: "won" });
    for (let i = 0; i < block.leading; i++) assignment.push({ alliance: a, status: "leading" });
  }
  while (assignment.length < TOTAL) assignment.push({ alliance: "independent", status: "empty" });
  if (assignment.length > TOTAL) assignment.length = TOTAL;

  const totalWon = byAlliance.reduce((s, b) => s + b.won, 0);
  const totalLeading = byAlliance.reduce((s, b) => s + b.leading, 0);
  const sorted = [...byAlliance].sort((a, b) => b.won + b.leading - (a.won + a.leading));
  const leaderBlock = sorted[0];
  const leader = ALLIANCES.find((a) => a.id === leaderBlock?.allianceId);
  const leaderTotal = leaderBlock ? leaderBlock.won + leaderBlock.leading : 0;
  const crossesMajority = leaderTotal >= 118;

  // Label positions (group origin is at the chart's bottom-center via
  // translate below). Positive y is BELOW the arc, where we have empty space.
  const groupTopY = OUTER_RADIUS + 20; // arc top is at y=-OUTER_RADIUS
  const groupOriginViewBoxY = groupTopY + 12;

  return (
    <svg viewBox={`-${width / 2} 0 ${width} ${height}`} width="100%" height="100%" className="overflow-visible">
      <g transform={`translate(0, ${groupOriginViewBoxY})`}>
        {/* Faint majority guide arc */}
        <path
          d={`M ${-OUTER_RADIUS} 0 A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 0 1 ${OUTER_RADIUS} 0`}
          fill="none"
          stroke="var(--border)"
          strokeWidth={1}
          strokeDasharray="2 4"
        />
        <text
          x={0}
          y={-OUTER_RADIUS - 14}
          textAnchor="middle"
          style={{ fill: "var(--text-subtle)" }}
          className="text-[10px] tracking-[0.2em]"
        >
          MAJORITY · 118
        </text>

        {POSITIONS.map((p, i) => {
          const a = assignment[i];
          const alliance = ALLIANCES.find((x) => x.id === a?.alliance);
          const color = alliance?.color ?? "var(--border)";
          const fill = a.status === "empty" ? "var(--border)" : color;
          const opacity = a.status === "leading" ? 0.62 : a.status === "empty" ? 0.35 : 1;
          return <circle key={i} cx={p.x} cy={p.y} r={5.4} fill={fill} opacity={opacity} />;
        })}

        {/* Center hole — big leader number, clearly inside the inner radius */}
        <text
          x={0}
          y={-INNER_RADIUS / 2 - 6}
          textAnchor="middle"
          style={{ fill: "var(--text-subtle)" }}
          className="text-[10px] tracking-[0.2em]"
        >
          LEADING
        </text>
        {leader && leaderTotal > 0 ? (
          <>
            <text
              x={0}
              y={-INNER_RADIUS / 2 + 28}
              textAnchor="middle"
              className="text-[40px] font-semibold tabular"
              style={{ fill: leader.color }}
            >
              {leaderTotal}
            </text>
            <text
              x={0}
              y={-INNER_RADIUS / 2 + 46}
              textAnchor="middle"
              style={{ fill: leader.color }}
              className="text-[11px] font-medium tracking-wider"
            >
              {leader.short}
            </text>
          </>
        ) : (
          <text x={0} y={-INNER_RADIUS / 2 + 28} textAnchor="middle" className="text-[40px] font-semibold tabular" style={{ fill: "var(--text)" }}>
            —
          </text>
        )}

        {/* Footer line — below the arc */}
        <text
          x={0}
          y={28}
          textAnchor="middle"
          style={{ fill: "var(--text-muted)" }}
          className="text-[11px] tabular"
        >
          {totalWon > 0 ? `${totalWon} won · ` : ""}
          {totalLeading} leading · {totalWon + totalLeading}/234 called
        </text>
        {crossesMajority && leader && (
          <text
            x={0}
            y={48}
            textAnchor="middle"
            style={{ fill: leader.color }}
            className="text-[11px] font-medium tracking-wider"
          >
            ▲ MAJORITY CROSSED
          </text>
        )}
      </g>
    </svg>
  );
}
