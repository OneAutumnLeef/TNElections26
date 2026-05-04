"use client";

import type { LiveResults } from "@/data/types";
import { CONSTITUENCY_BY_ID, constituencySlug } from "@/data/constituencies";
import { partyColor } from "@/data/parties";
import { partyToAlliance } from "@/data/aggregate";
import { ALLIANCE_BY_ID } from "@/data/alliances";
import Link from "next/link";
import { ArrowUpRight, AlertCircle, TrendingUp, Sparkles } from "lucide-react";
import { useMemo } from "react";

type Insight = {
  kind: "tvk" | "swing" | "incumbent";
  title: string;
  body: string;
  href: string;
  accent: string;
  Icon: typeof TrendingUp;
};

export function InsightStrip({ results }: { results: LiveResults }) {
  const insights = useMemo<Insight[]>(() => {
    const out: Insight[] = [];
    const called = results.constituencies.filter((c) => c.leader);

    // 1. TVK headline — pick the highest-AC TVK win as a representative
    const tvk = called.find((c) => c.leader!.party === "TVK");
    if (tvk) {
      const meta = CONSTITUENCY_BY_ID[tvk.acNo];
      const cand = tvk.candidates[0]?.name;
      const tvkCount = called.filter((c) => c.leader!.party === "TVK").length;
      out.push({
        kind: "tvk",
        title: `TVK leading ${tvkCount} seats`,
        body: cand ? `${cand} ahead in ${meta.name}` : `Strong showing in ${meta.name}`,
        href: `/constituency/${constituencySlug(meta.name)}`,
        accent: "#A67C00",
        Icon: Sparkles,
      });
    }

    // 2. Most striking alliance swing
    const swing = called.find((c) => {
      const meta = CONSTITUENCY_BY_ID[c.acNo];
      return partyToAlliance(meta.prevWinner) !== partyToAlliance(c.leader!.party);
    });
    if (swing) {
      const meta = CONSTITUENCY_BY_ID[swing.acNo];
      const swingCount = called.filter((c) => {
        const m = CONSTITUENCY_BY_ID[c.acNo];
        return partyToAlliance(m.prevWinner) !== partyToAlliance(c.leader!.party);
      }).length;
      out.push({
        kind: "swing",
        title: `${swingCount} alliance flips`,
        body: `${meta.name}: ${meta.prevWinner} → ${swing.leader!.party}`,
        href: `/constituency/${constituencySlug(meta.name)}`,
        accent: partyColor(swing.leader!.party),
        Icon: TrendingUp,
      });
    }

    // 3. Incumbent at risk — different party, same alliance still counts as a story
    const incumbent = called.find((c) => {
      const meta = CONSTITUENCY_BY_ID[c.acNo];
      return meta.prevWinner !== c.leader!.party;
    });
    if (incumbent) {
      const meta = CONSTITUENCY_BY_ID[incumbent.acNo];
      const incumbentCount = called.filter((c) => {
        const m = CONSTITUENCY_BY_ID[c.acNo];
        return m.prevWinner !== c.leader!.party;
      }).length;
      out.push({
        kind: "incumbent",
        title: `${incumbentCount} incumbents trailing`,
        body: `${meta.name}: was ${meta.prevWinner}, now ${incumbent.leader!.party}`,
        href: `/constituency/${constituencySlug(meta.name)}`,
        accent: "var(--color-live)",
        Icon: AlertCircle,
      });
    }

    return out.slice(0, 3);
  }, [results]);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-(--border) px-4 py-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">
          Insights · Live narrative
        </h3>
        <Link href="/insights" className="text-[10px] text-(--text-subtle) hover:text-(--text)">
          all insights →
        </Link>
      </div>
      <ul className="divide-y divide-(--border)">
        {insights.map((i, idx) => (
          <li key={idx}>
            <Link
              href={i.href}
              className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-(--bg-overlay)"
            >
              <span
                className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md"
                style={{ backgroundColor: `${i.accent}22`, color: i.accent }}
              >
                <i.Icon size={14} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: i.accent }}>
                    {i.title}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-sm text-(--text)">{i.body}</p>
              </div>
              <ArrowUpRight size={14} className="mt-1 shrink-0 text-(--text-subtle) transition-colors group-hover:text-(--text)" />
            </Link>
          </li>
        ))}
        {insights.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-(--text-subtle)">
            Insights will appear as counting progresses.
          </li>
        )}
      </ul>
    </div>
  );
}
