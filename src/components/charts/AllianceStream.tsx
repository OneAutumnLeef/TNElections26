"use client";

import { ALLIANCES } from "@/data/alliances";
import type { LiveResults } from "@/data/types";
import { partyToAlliance } from "@/data/aggregate";

export function AllianceStream({ results }: { results: LiveResults }) {
  const cells: { color: string; status: "won" | "leading" | "pending" }[] = [];
  for (const c of results.constituencies) {
    if (c.status === "won" && c.leader) {
      const a = partyToAlliance(c.leader.party);
      const alliance = ALLIANCES.find((x) => x.id === a);
      cells.push({ color: alliance?.color ?? "var(--border)", status: "won" });
    } else if (c.leader) {
      const a = partyToAlliance(c.leader.party);
      const alliance = ALLIANCES.find((x) => x.id === a);
      cells.push({ color: alliance?.color ?? "var(--border)", status: "leading" });
    } else {
      cells.push({ color: "var(--border)", status: "pending" });
    }
  }
  // Pad to 234
  while (cells.length < 234) cells.push({ color: "var(--border)", status: "pending" });

  return (
    <div className="flex w-full select-none">
      {cells.map((c, i) => (
        <div
          key={i}
          title={`AC ${i + 1}`}
          className="h-7 flex-1 transition-opacity"
          style={{
            backgroundColor: c.color,
            opacity: c.status === "won" ? 1 : c.status === "leading" ? 0.55 : 0.18,
            marginRight: i === 233 ? 0 : 1,
          }}
        />
      ))}
    </div>
  );
}
