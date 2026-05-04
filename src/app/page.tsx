"use client";

import useSWR from "swr";
import type { LiveResults } from "@/data/types";
import { ParliamentArc } from "@/components/charts/ParliamentArc";
import { AllianceStream } from "@/components/charts/AllianceStream";
import { KpiStack } from "@/components/modules/KpiStack";
import { AllianceLeaderboard } from "@/components/modules/AllianceLeaderboard";
import { InsightStrip } from "@/components/modules/InsightStrip";
import { api } from "@/lib/path";

export default function Home() {
  const { data, isLoading } = useSWR<LiveResults>(api("/api/results"));

  if (!data || isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid h-72 place-items-center text-sm text-(--text-subtle)">Loading live data…</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-6 sm:px-6 sm:py-8">
      {/* Hero */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <div className="card relative overflow-hidden bg-dotgrid">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-(--color-brand) to-transparent opacity-50" />
          <div className="px-5 pb-3 pt-5 sm:px-7">
            <div className="flex items-baseline justify-between">
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-(--text)">
                  Tamil Nadu 2026
                </h1>
                <p className="text-xs text-(--text-muted)">
                  Live results · Legislative Assembly · 234 constituencies
                </p>
              </div>
              <div className="hidden text-right text-[10px] uppercase tracking-widest text-(--text-subtle) sm:block">
                Counting Day · 04 May 2026
              </div>
            </div>
          </div>
          <ParliamentArc byAlliance={data.byAlliance} />
        </div>
        <KpiStack results={data} />
      </section>

      {/* Alliance leaderboard */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AllianceLeaderboard results={data} />
        <InsightStrip results={data} />
      </section>

      {/* 234-cell stream */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-(--border) px-4 py-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">
            Constituency Stream · 234 seats left → right
          </h3>
          <span className="text-[10px] text-(--text-subtle)">click anywhere to drill in</span>
        </div>
        <AllianceStream results={data} />
      </section>
    </div>
  );
}
