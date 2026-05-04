"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CONSTITUENCIES, constituencySlug } from "@/data/constituencies";
import { PARTIES } from "@/data/parties";
import { cn } from "@/lib/cn";

type Item = { type: "constituency" | "party" | "page"; label: string; sub?: string; href: string };

const PAGES: Item[] = [
  { type: "page", label: "Overview", href: "/" },
  { type: "page", label: "Map", href: "/map" },
  { type: "page", label: "Parties", href: "/parties" },
  { type: "page", label: "Candidates", href: "/candidates" },
  { type: "page", label: "Insights", href: "/insights" },
  { type: "page", label: "Compare", href: "/compare" },
];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo<Item[]>(() => {
    const base: Item[] = [
      ...PAGES,
      ...CONSTITUENCIES.map((c) => ({
        type: "constituency" as const,
        label: c.name,
        sub: `AC ${c.id} · ${c.district}`,
        href: `/constituency/${constituencySlug(c.name)}`,
      })),
      ...PARTIES.map((p) => ({
        type: "party" as const,
        label: p.code,
        sub: p.name,
        href: `/parties#${p.id}`,
      })),
    ];
    if (!q) return base.slice(0, 60);
    const needle = q.toLowerCase();
    return base
      .filter((i) => i.label.toLowerCase().includes(needle) || i.sub?.toLowerCase().includes(needle))
      .slice(0, 60);
  }, [q]);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        // toggle by dispatching a custom event consumed by parent? Instead, click button.
        // For simplicity, just open via state via event:
        document.getElementById("__cmdk_open__")?.click();
      }
      if (!open) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => Math.min(a + 1, items.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
      }
      if (e.key === "Enter") {
        const it = items[active];
        if (it) {
          router.push(it.href);
          onClose();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, items, active, onClose, router]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-start justify-center pt-24" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative z-10 w-[min(92vw,560px)] overflow-hidden rounded-2xl border border-(--border-strong) bg-(--bg-elevated) shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
          }}
          placeholder="Jump to a constituency, party, or page…"
          className="w-full border-b border-(--border) bg-transparent px-4 py-3 text-sm outline-none placeholder:text-(--text-subtle)"
        />
        <ul className="max-h-[55vh] overflow-y-auto p-1.5">
          {items.length === 0 && (
            <li className="px-3 py-6 text-center text-xs text-(--text-subtle)">No matches</li>
          )}
          {items.map((it, i) => (
            <li key={`${it.type}-${it.href}-${i}`}>
              <button
                onMouseEnter={() => setActive(i)}
                onClick={() => {
                  router.push(it.href);
                  onClose();
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  active === i ? "bg-(--bg-overlay)" : "hover:bg-(--bg-overlay)",
                )}
              >
                <TypeBadge type={it.type} />
                <span className="text-(--text)">{it.label}</span>
                {it.sub && <span className="ml-auto text-xs text-(--text-subtle)">{it.sub}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: Item["type"] }) {
  const map: Record<Item["type"], string> = {
    constituency: "AC",
    party: "PT",
    page: "→",
  };
  return (
    <span className="mono w-7 shrink-0 rounded bg-(--bg-overlay) px-1 py-0.5 text-center text-[10px] uppercase tracking-wider text-(--text-subtle)">
      {map[type]}
    </span>
  );
}
