"use client";

import useSWR from "swr";
import type { LiveResults } from "@/data/types";
import { CONSTITUENCY_BY_ID, constituencySlug } from "@/data/constituencies";
import { partyColor } from "@/data/parties";
import { partyToAlliance } from "@/data/aggregate";
import { ALLIANCE_BY_ID } from "@/data/alliances";
import Link from "next/link";
import { useMemo } from "react";
import { TrendingUp, AlertCircle, Crown, Sparkles, MapPin, Trophy, Flame, Award } from "lucide-react";
import { api } from "@/lib/path";

export default function InsightsPage() {
  const { data } = useSWR<LiveResults>(api("/api/results"));

  const insights = useMemo(() => {
    if (!data) return null;

    const called = data.constituencies.filter((c) => c.leader);
    const totalVoted = called.length;

    // Real-margin sections (now we have actual vote data, not just leader assignment)
    const withMargin = called.filter((c) => c.totalVotes > 0 && c.leader!.margin > 0);
    const closest = [...withMargin].sort((a, b) => a.leader!.margin - b.leader!.margin).slice(0, 8);
    const largestMargins = [...withMargin].sort((a, b) => b.leader!.margin - a.leader!.margin).slice(0, 8);

    // Swings: prev winner alliance != current leader alliance
    const swings = called
      .map((c) => {
        const meta = CONSTITUENCY_BY_ID[c.acNo];
        const prevA = partyToAlliance(meta.prevWinner);
        const nowA = partyToAlliance(c.leader!.party);
        return { c, meta, prevA, nowA, swung: prevA !== nowA };
      })
      .filter((x) => x.swung);

    // TVK headline — sort by margin so the strongest TVK contests come first
    const tvkLeads = called
      .filter((c) => c.leader!.party === "TVK")
      .sort((a, b) => b.leader!.margin - a.leader!.margin)
      .slice(0, 8);

    // Incumbents in trouble: 2021 winner = X but leader's party is different
    // (broader than alliance swing — even within-alliance party changes)
    const incumbentsAtRisk = called
      .map((c) => ({ c, meta: CONSTITUENCY_BY_ID[c.acNo] }))
      .filter(({ c, meta }) => meta.prevWinner !== c.leader!.party)
      .slice(0, 8);

    // District-level alliance flips
    type DistrictAgg = {
      district: string;
      total: number;
      called: number;
      byAlliance: Record<string, number>;
      prevByAlliance: Record<string, number>;
    };
    const districtAgg = new Map<string, DistrictAgg>();
    for (const c of data.constituencies) {
      const meta = CONSTITUENCY_BY_ID[c.acNo];
      const d = districtAgg.get(meta.district) ?? {
        district: meta.district,
        total: 0,
        called: 0,
        byAlliance: {},
        prevByAlliance: {},
      };
      d.total++;
      const prevA = partyToAlliance(meta.prevWinner);
      d.prevByAlliance[prevA] = (d.prevByAlliance[prevA] ?? 0) + 1;
      if (c.leader) {
        d.called++;
        const nowA = partyToAlliance(c.leader.party);
        d.byAlliance[nowA] = (d.byAlliance[nowA] ?? 0) + 1;
      }
      districtAgg.set(meta.district, d);
    }
    const districtFlips = Array.from(districtAgg.values())
      .map((d) => {
        const prevTop = topAlliance(d.prevByAlliance);
        const nowTop = topAlliance(d.byAlliance);
        return { ...d, prevTop, nowTop, flipped: prevTop !== nowTop && nowTop !== null };
      })
      .filter((d) => d.flipped)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    // Bellwether watch — districts of historic political weight
    const bellwetherDistricts = ["Madurai", "Coimbatore", "Tiruchirappalli", "Chennai", "Thanjavur"];
    const bellweather = called.filter((c) => {
      const meta = CONSTITUENCY_BY_ID[c.acNo];
      return bellwetherDistricts.includes(meta.district);
    }).slice(0, 8);

    return {
      totalVoted,
      swings,
      tvkLeads,
      incumbentsAtRisk,
      districtFlips,
      bellweather,
      closest,
      largestMargins,
      swingCount: swings.length,
    };
  }, [data]);

  if (!data || !insights) {
    return <div className="mx-auto max-w-7xl p-6 text-sm text-(--text-subtle)">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Insights</h1>
          <p className="text-xs text-(--text-muted)">
            Auto-generated narrative cards, refreshed every 60 seconds with the live ECI feed.
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-(--text-subtle)">
          <span className="tabular">{insights.totalVoted}/234 called</span>
          <span>·</span>
          <span className="tabular text-(--color-counting)">{insights.swingCount} swings</span>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section
          title="Closest contests right now"
          subtitle="Smallest margins live"
          Icon={Flame}
          accent="var(--color-counting)"
          empty="No live margins yet."
        >
          {insights.closest.map((c) => (
            <RowFromLeader
              key={c.acNo}
              c={c}
              accent={partyColor(c.leader!.party)}
              subtitleOverride={`${CONSTITUENCY_BY_ID[c.acNo].district} · round ${c.roundsCompleted}/${c.roundsTotal} · margin ${c.leader!.margin.toLocaleString("en-IN")}`}
            />
          ))}
        </Section>

        <Section
          title="Largest margins"
          subtitle="Dominant leads across the state"
          Icon={Award}
          accent="var(--color-won)"
          empty="—"
        >
          {insights.largestMargins.map((c) => (
            <RowFromLeader
              key={c.acNo}
              c={c}
              accent={partyColor(c.leader!.party)}
              subtitleOverride={`${CONSTITUENCY_BY_ID[c.acNo].district} · margin +${c.leader!.margin.toLocaleString("en-IN")}`}
            />
          ))}
        </Section>

        <Section
          title="The TVK breakthrough"
          subtitle={`Vijay's debut · ${insights.tvkLeads.length} leads listed (showing top by margin)`}
          Icon={Sparkles}
          accent="#A67C00"
          empty="No TVK leads yet."
        >
          {insights.tvkLeads.map((c) => (
            <RowFromLeader
              key={c.acNo}
              c={c}
              accent={partyColor(c.leader!.party)}
              subtitleOverride={`AC ${c.acNo} · ${CONSTITUENCY_BY_ID[c.acNo].district} · margin ${c.leader!.margin.toLocaleString("en-IN")}`}
            />
          ))}
        </Section>

        <Section
          title="Big swings vs 2021"
          subtitle={`${insights.swingCount} alliance flips so far`}
          Icon={TrendingUp}
          accent="var(--color-leading)"
          empty="No alliance swings yet."
        >
          {insights.swings.slice(0, 8).map(({ c, meta, prevA, nowA }) => {
            const prevColor = ALLIANCE_BY_ID[prevA].color;
            const nowColor = ALLIANCE_BY_ID[nowA].color;
            return (
              <li key={c.acNo}>
                <Link
                  href={`/constituency/${constituencySlug(meta.name)}`}
                  className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-2.5 transition-colors hover:bg-(--bg-overlay)"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{meta.name}</div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[10px]">
                      <span className="rounded px-1 py-0.5 font-medium" style={{ backgroundColor: `${prevColor}22`, color: prevColor }}>
                        {ALLIANCE_BY_ID[prevA].short}
                      </span>
                      <span className="text-(--text-subtle)">→</span>
                      <span className="rounded px-1 py-0.5 font-medium" style={{ backgroundColor: `${nowColor}22`, color: nowColor }}>
                        {ALLIANCE_BY_ID[nowA].short}
                      </span>
                      <span className="text-(--text-subtle)">·</span>
                      <span className="text-(--text-subtle)">{meta.district}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold tabular" style={{ color: partyColor(c.leader!.party) }}>
                      {c.leader!.party}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </Section>

        <Section
          title="Incumbents at risk"
          subtitle="2021 winner's party trailing or out"
          Icon={AlertCircle}
          accent="var(--color-live)"
          empty="No incumbent upsets."
        >
          {insights.incumbentsAtRisk.map(({ c, meta }) => (
            <li key={c.acNo}>
              <Link
                href={`/constituency/${constituencySlug(meta.name)}`}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-2.5 transition-colors hover:bg-(--bg-overlay)"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{meta.name}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-(--text-subtle)">
                    <span>was</span>
                    <span style={{ color: partyColor(meta.prevWinner) }} className="font-medium">{meta.prevWinner}</span>
                    <span>·</span>
                    <span>{meta.district}</span>
                  </div>
                </div>
                <div className="text-right text-sm font-semibold tabular" style={{ color: partyColor(c.leader!.party) }}>
                  {c.leader!.party}
                </div>
              </Link>
            </li>
          ))}
        </Section>

        <Section
          title="Districts that flipped"
          subtitle="Top alliance changed since 2021"
          Icon={MapPin}
          accent="var(--color-brand)"
          empty="No districts have flipped overall."
        >
          {insights.districtFlips.map((d) => {
            const prevColor = d.prevTop ? ALLIANCE_BY_ID[d.prevTop].color : "var(--text-subtle)";
            const nowColor = d.nowTop ? ALLIANCE_BY_ID[d.nowTop].color : "var(--text-subtle)";
            return (
              <li key={d.district} className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{d.district}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[10px]">
                    <span className="rounded px-1 py-0.5 font-medium" style={{ backgroundColor: `${prevColor}22`, color: prevColor }}>
                      {d.prevTop ? ALLIANCE_BY_ID[d.prevTop].short : "—"}
                    </span>
                    <span className="text-(--text-subtle)">→</span>
                    <span className="rounded px-1 py-0.5 font-medium" style={{ backgroundColor: `${nowColor}22`, color: nowColor }}>
                      {d.nowTop ? ALLIANCE_BY_ID[d.nowTop].short : "—"}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold tabular text-(--text)">{d.called}/{d.total}</div>
                  <div className="text-[10px] text-(--text-subtle)">seats called</div>
                </div>
              </li>
            );
          })}
        </Section>

        <Section
          title="Bellwether watch"
          subtitle="Historic swing districts"
          Icon={Crown}
          accent="var(--color-brand)"
          empty="No bellwether data yet."
        >
          {insights.bellweather.map((c) => (
            <RowFromLeader
              key={c.acNo}
              c={c}
              accent={partyColor(c.leader!.party)}
              subtitleOverride={`${CONSTITUENCY_BY_ID[c.acNo].district} · margin ${c.leader!.margin.toLocaleString("en-IN")}`}
            />
          ))}
        </Section>

        <Section
          title="Big winners by party"
          subtitle="Parties leading 5+ seats"
          Icon={Trophy}
          accent="var(--color-counting)"
          empty="—"
        >
          {[...data.byParty]
            .filter((p) => p.won + p.leading >= 5)
            .sort((a, b) => b.won + b.leading - (a.won + a.leading))
            .slice(0, 8)
            .map((p) => (
              <li key={p.party} className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: partyColor(p.party) }} />
                  <span className="text-sm font-medium" style={{ color: partyColor(p.party) }}>{p.party}</span>
                </div>
                <div className="text-right tabular text-sm font-semibold">{p.won + p.leading}</div>
              </li>
            ))}
        </Section>
      </div>
    </div>
  );
}

function topAlliance(map: Record<string, number>): string | null {
  let best: string | null = null;
  let max = 0;
  for (const [k, v] of Object.entries(map)) {
    if (v > max) {
      max = v;
      best = k;
    }
  }
  return best;
}

function Section({
  title, subtitle, Icon, accent, empty, children,
}: {
  title: string;
  subtitle?: string;
  Icon: typeof Trophy;
  accent: string;
  empty: string;
  children: React.ReactNode;
}) {
  const arr = Array.isArray(children) ? children : [children];
  const hasContent = arr.filter(Boolean).length > 0;
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-(--border) px-4 py-2.5">
        <span className="grid h-6 w-6 place-items-center rounded-md" style={{ backgroundColor: `${accent}22`, color: accent }}>
          <Icon size={13} />
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-xs font-semibold uppercase tracking-wider text-(--text)">{title}</h3>
          {subtitle && <div className="truncate text-[10px] text-(--text-subtle)">{subtitle}</div>}
        </div>
      </div>
      {hasContent ? (
        <ul className="divide-y divide-(--border)">{children}</ul>
      ) : (
        <div className="px-4 py-8 text-center text-xs text-(--text-subtle)">{empty}</div>
      )}
    </div>
  );
}

function RowFromLeader({ c, accent, subtitleOverride }: { c: LiveResults["constituencies"][number]; accent: string; subtitleOverride?: string }) {
  const meta = CONSTITUENCY_BY_ID[c.acNo];
  const candidate = c.candidates[0]?.name;
  return (
    <li>
      <Link
        href={`/constituency/${constituencySlug(meta.name)}`}
        className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-2.5 transition-colors hover:bg-(--bg-overlay)"
      >
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{meta.name}</div>
          <div className="truncate text-[10px] text-(--text-subtle)">
            {subtitleOverride ?? `${meta.district} · ${candidate ?? "—"}`}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold tabular" style={{ color: accent }}>
            {c.leader!.party}
          </div>
        </div>
      </Link>
    </li>
  );
}
