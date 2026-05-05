"use client";

import useSWR from "swr";
import type { LiveResults } from "@/data/types";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { api } from "@/lib/path";

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return "just now";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m ago`;
}

export function StatusStrip() {
  const { data, error } = useSWR<LiveResults>(api("/api/results"));
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const updated = data?.updatedAt;
  const decided = data
    ? data.constituencies.filter(
        (c) => c.status === "won" || (c.leader && c.totalVotes > 0),
      ).length
    : 0;
  const total = data?.totalSeats ?? 234;
  const pct = total > 0 ? Math.round((decided / total) * 100) : 0;
  // Counting wrapped 2026-05-04. The strip shows FINAL state.
  const wonCount = data ? data.constituencies.filter((c) => c.status === "won").length : 0;
  const isFinal = !!data && wonCount === total;
  const live = !isFinal && !!data && !error;
  const preCounting = false;

  return (
    <div className="border-b border-(--border) bg-(--bg-elevated)/60 backdrop-blur">
      <div className="mx-auto flex h-9 max-w-7xl items-center gap-3 px-4 text-[11px] sm:px-6">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-block h-1.5 w-1.5 rounded-full",
              isFinal
                ? "bg-(--color-won)"
                : live
                ? "bg-(--color-live) pulse-live"
                : "bg-(--text-subtle)",
            )}
          />
          <span className="mono font-medium tracking-wider text-(--text)">
            {isFinal ? "FINAL" : live ? "LIVE" : "OFFLINE"}
          </span>
        </div>

        <Sep />

        <span className="mono text-(--text-muted)">
          {decided}/{total} <span className="text-(--text-subtle)">decided</span>
        </span>

        <div className="hidden h-1 w-24 overflow-hidden rounded-full bg-(--bg-overlay) sm:block">
          <div
            className="h-full bg-(--color-brand) transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        <Sep />

        <span className="mono text-(--text-muted) hidden md:inline">
          Counting started{" "}
          <span className="text-(--text)">{data ? "08:00 IST" : "—"}</span>
        </span>

        <span className="ml-auto mono text-(--text-muted)">
          updated <span className="text-(--text)">{updated ? formatRelative(updated) : "—"}</span>
          <span className="hidden text-(--text-subtle) lg:inline"> · auto refresh 60s</span>
          <span className="hidden">{tick}</span>
        </span>
      </div>
    </div>
  );
}

function Sep() {
  return <span className="h-3 w-px bg-(--border)" aria-hidden />;
}
