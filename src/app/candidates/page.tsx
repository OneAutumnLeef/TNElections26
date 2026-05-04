"use client";

import { useMemo, useState } from "react";
import { CONSTITUENCIES, constituencySlug, DISTRICTS } from "@/data/constituencies";
import { PARTIES, partyColor } from "@/data/parties";
import { AllianceTag } from "@/components/data-display/AllianceTag";
import Link from "next/link";

export default function CandidatesPage() {
  const [q, setQ] = useState("");
  const [district, setDistrict] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [prevParty, setPrevParty] = useState<string>("");

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return CONSTITUENCIES.filter((c) => {
      if (district && c.district !== district) return false;
      if (category && c.category !== category) return false;
      if (prevParty && c.prevWinner !== prevParty) return false;
      if (needle && !c.name.toLowerCase().includes(needle) && !c.district.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [q, district, category, prevParty]);

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-6 sm:px-6 sm:py-8">
      <header className="space-y-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Candidates & constituencies</h1>
          <p className="text-xs text-(--text-muted)">Browse all 234 constituencies. Click any to see candidate-level vote counts.</p>
        </div>

        <div className="card flex flex-wrap items-center gap-3 p-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by constituency or district…"
            className="min-w-[200px] flex-1 rounded-md border border-(--border) bg-(--bg) px-3 py-1.5 text-sm outline-none placeholder:text-(--text-subtle) focus:border-(--color-brand)"
          />
          <Select value={district} onChange={setDistrict} placeholder="All districts" options={DISTRICTS} />
          <Select value={category} onChange={setCategory} placeholder="All categories" options={["General", "SC", "ST"]} />
          <Select value={prevParty} onChange={setPrevParty} placeholder="2021 winner" options={["DMK", "AIADMK", "INC", "BJP", "PMK", "VCK", "CPI", "CPI(M)"]} />
          <span className="ml-auto text-xs text-(--text-subtle) tabular">
            {filtered.length} of 234
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((c) => {
          const partyMeta = PARTIES.find((p) => p.code === c.prevWinner);
          return (
            <Link
              key={c.id}
              href={`/constituency/${constituencySlug(c.name)}`}
              className="card group relative overflow-hidden p-3 transition-colors hover:border-(--border-strong)"
            >
              <div
                className="absolute left-0 top-0 h-full w-1 transition-all group-hover:w-1.5"
                style={{ backgroundColor: partyColor(c.prevWinner) }}
              />
              <div className="flex items-baseline justify-between">
                <span className="mono text-[10px] uppercase tracking-widest text-(--text-subtle)">
                  AC {c.id}
                </span>
                <span className="rounded bg-(--bg-overlay) px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-(--text-muted)">
                  {c.category}
                </span>
              </div>
              <div className="mt-1 truncate text-sm font-semibold">{c.name}</div>
              <div className="text-[11px] text-(--text-muted)">{c.district}</div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-(--text-subtle)">
                <span className="tabular">{c.electors.toLocaleString("en-IN")} electors</span>
                <span className="tabular">{c.candidates} candidates</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[10px]">
                <span className="text-(--text-subtle)">2021:</span>
                <span style={{ color: partyColor(c.prevWinner) }} className="font-medium">{c.prevWinner}</span>
                {partyMeta && <AllianceTag id={partyMeta.alliance} size="xs" />}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Select({ value, onChange, placeholder, options }: { value: string; onChange: (v: string) => void; placeholder: string; options: string[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-(--border) bg-(--bg) px-2.5 py-1.5 text-xs outline-none focus:border-(--color-brand)"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}
