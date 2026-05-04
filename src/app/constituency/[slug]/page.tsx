"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import { CONSTITUENCY_BY_SLUG, CONSTITUENCY_BY_ID, constituencySlug } from "@/data/constituencies";
import { partyColor } from "@/data/parties";
import { partyToAlliance } from "@/data/aggregate";
import { ALLIANCE_BY_ID } from "@/data/alliances";
import { AllianceTag } from "@/components/data-display/AllianceTag";
import { ChevronLeft, ChevronRight, Trophy, Activity, Users } from "lucide-react";

type EciCandidate = { name: string; party: string; status: "won" | "leading" | "trailing" | "counting"; votes: number; margin: number };
type AcLive = {
  acNo: number;
  roundsCompleted: number;
  roundsTotal: number;
  totalVotes: number;
  candidates: EciCandidate[];
  leader: EciCandidate | null;
  runnerUp: EciCandidate | null;
  updatedAt?: string;
  error?: string;
};

export default function ConstituencyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const c = CONSTITUENCY_BY_SLUG[slug];
  if (!c) notFound();

  const { data: live } = useSWR<AcLive>(`/api/constituency/${c.id}`, { refreshInterval: 60_000 });
  const result = live;
  const candidates = live?.candidates ?? [];
  const totalVotes = live?.totalVotes ?? 0;

  const prev = c.id > 1 ? CONSTITUENCY_BY_ID[c.id - 1] : null;
  const next = c.id < 234 ? CONSTITUENCY_BY_ID[c.id + 1] : null;
  const winnerAlliance = result?.leader ? partyToAlliance(result.leader.party) : null;
  const winnerColor = result?.leader ? partyColor(result.leader.party) : "var(--text-muted)";

  // Margin info — sign indicates leading/trailing relative to leader.
  // The leader.margin is positive (votes ahead of #2). For others, recompute
  // their gap from the leader for context.
  const leaderVotes = result?.leader?.votes ?? candidates[0]?.votes ?? 0;

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6 sm:py-8">
      {/* Breadcrumb / nav */}
      <div className="flex items-center justify-between text-xs">
        <Link href="/candidates" className="text-(--text-muted) hover:text-(--text)">← All constituencies</Link>
        <div className="flex items-center gap-1">
          {prev && (
            <Link href={`/constituency/${constituencySlug(prev.name)}`} className="flex items-center gap-1 rounded-md border border-(--border) px-2 py-1 text-(--text-muted) hover:text-(--text)">
              <ChevronLeft size={12} /> {prev.name}
            </Link>
          )}
          {next && (
            <Link href={`/constituency/${constituencySlug(next.name)}`} className="flex items-center gap-1 rounded-md border border-(--border) px-2 py-1 text-(--text-muted) hover:text-(--text)">
              {next.name} <ChevronRight size={12} />
            </Link>
          )}
        </div>
      </div>

      {/* Header */}
      <header className="card relative overflow-hidden">
        <div
          className="absolute inset-x-0 top-0 h-1 transition-colors"
          style={{ backgroundColor: winnerColor }}
        />
        <div className="grid grid-cols-1 gap-6 px-5 py-6 sm:grid-cols-[1fr_auto] sm:px-7">
          <div>
            <div className="mono text-[10px] uppercase tracking-widest text-(--text-subtle)">
              AC {c.id} · {c.district} District
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{c.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded bg-(--bg-overlay) px-1.5 py-0.5 text-(--text-muted)">{c.category}</span>
              <span className="text-(--text-subtle)">·</span>
              <span className="text-(--text-muted) tabular">{c.electors.toLocaleString("en-IN")} electors</span>
              <span className="text-(--text-subtle)">·</span>
              <span className="text-(--text-muted) tabular">{c.candidates} candidates</span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="text-(--text-subtle)">2021 winner</span>
              <span style={{ color: partyColor(c.prevWinner) }} className="font-semibold">{c.prevWinner}</span>
            </div>
          </div>

          {result?.leader && (
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-widest text-(--text-subtle)">Now leading</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold tabular" style={{ color: winnerColor }}>
                  {result.leader.party}
                </span>
                {winnerAlliance && <AllianceTag id={winnerAlliance} size="sm" />}
              </div>
              <div className="text-base font-medium tabular text-(--text)">
                {result.leader.name}
              </div>
              <div className="text-sm tabular text-(--text-muted)">
                Margin {Math.abs(result.leader.margin).toLocaleString("en-IN")}
              </div>
              <div className="mono text-[10px] uppercase tracking-widest text-(--text-subtle)">
                Round {result.roundsCompleted} / {result.roundsTotal} ·
                <span className="ml-1" style={{ color: result.leader.status === "won" ? "var(--color-won)" : "var(--color-leading)" }}>
                  {result.leader.status}
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<Users size={14} />} label="Male" value={c.male.toLocaleString("en-IN")} />
        <Stat icon={<Users size={14} />} label="Female" value={c.female.toLocaleString("en-IN")} />
        <Stat icon={<Users size={14} />} label="Third gender" value={c.thirdGender.toLocaleString("en-IN")} />
        <Stat icon={<Activity size={14} />} label="Turnout (est.)" value={totalVotes > 0 ? `${((totalVotes / c.electors) * 100).toFixed(1)}%` : "—"} />
      </div>

      {/* Candidate breakdown */}
      <section className="card">
        <div className="flex items-center justify-between border-b border-(--border) px-4 py-2.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">
            Candidate breakdown
          </h2>
          <span className="text-[10px] text-(--text-subtle)">
            {candidates.length} contested · {totalVotes > 0 ? `${totalVotes.toLocaleString("en-IN")} votes counted` : "awaiting counts"}
          </span>
        </div>
        {candidates.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-(--text-subtle)">
            {live?.error ? "ECI page not yet available." : "Loading candidate data…"}
          </div>
        )}
        <ul className="divide-y divide-(--border)">
          {candidates.map((cand, i) => {
            const isLeader = i === 0 && totalVotes > 0;
            const pct = totalVotes > 0 ? (cand.votes / totalVotes) * 100 : 0;
            const gap = leaderVotes > 0 && i > 0 ? leaderVotes - cand.votes : null;
            return (
              <li
                key={`${cand.name}-${i}`}
                className="grid grid-cols-[36px_1fr_120px_90px] items-center gap-3 px-4 py-3"
              >
                <div className="grid h-9 w-9 place-items-center rounded-full text-xs font-semibold" style={{ backgroundColor: `${partyColor(cand.party)}22`, color: partyColor(cand.party) }}>
                  {i + 1}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{cand.name}</span>
                    {isLeader && <Trophy size={12} className="shrink-0" style={{ color: partyColor(cand.party) }} />}
                    {cand.status === "won" && <span className="rounded bg-(--color-won)/15 px-1 py-0.5 text-[9px] uppercase tracking-wider" style={{ color: "var(--color-won)" }}>WON</span>}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-(--text-muted)">
                    <span style={{ color: partyColor(cand.party) }} className="font-medium">{cand.party}</span>
                    <span className="text-(--text-subtle)">·</span>
                    <span className="capitalize text-(--text-subtle)">{cand.status}</span>
                    {gap !== null && gap > 0 && (
                      <>
                        <span className="text-(--text-subtle)">·</span>
                        <span className="tabular text-(--text-subtle)">behind by {gap.toLocaleString("en-IN")}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="relative h-2 overflow-hidden rounded-sm bg-(--bg-overlay)">
                  <div
                    className="absolute inset-y-0 left-0 transition-[width] duration-700"
                    style={{ width: `${pct}%`, backgroundColor: partyColor(cand.party) }}
                  />
                </div>
                <div className="text-right tabular text-sm">
                  {cand.votes > 0 ? cand.votes.toLocaleString("en-IN") : <span className="text-(--text-subtle)">—</span>}
                  <div className="text-[10px] text-(--text-subtle)">{pct > 0 ? `${pct.toFixed(1)}%` : ""}</div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-(--text-subtle)">
        {icon} {label}
      </div>
      <div className="mt-1 tabular text-base font-semibold">{value}</div>
    </div>
  );
}
