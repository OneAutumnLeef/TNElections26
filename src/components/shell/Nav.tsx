"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Map as MapIcon, Users, Vote, GitCompare, Sparkles, Search } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/cn";
import { useState } from "react";
import { CommandPalette } from "./CommandPalette";

const NAV = [
  { href: "/", label: "Overview", icon: Activity },
  { href: "/map", label: "Map", icon: MapIcon },
  { href: "/parties", label: "Parties", icon: Vote },
  { href: "/candidates", label: "Candidates", icon: Users },
  { href: "/insights", label: "Insights", icon: Sparkles },
  { href: "/compare", label: "Compare", icon: GitCompare },
];

export function Nav() {
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-(--border) bg-(--bg)/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Link href="/" className="group flex items-center gap-2 text-sm font-semibold tracking-tight">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-(--color-brand) text-[10px] font-bold text-white">26</span>
            <span className="hidden sm:inline">TN26</span>
            <span className="hidden text-(--text-subtle) sm:inline">·</span>
            <span className="hidden text-xs font-normal text-(--text-muted) sm:inline">TN Elections 2026</span>
          </Link>

          <nav className="ml-4 flex items-center gap-1">
            {NAV.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "bg-(--color-brand-soft) text-(--text)"
                      : "text-(--text-muted) hover:bg-(--bg-overlay) hover:text-(--text)",
                  )}
                >
                  <Icon size={14} className={cn(active ? "text-(--color-brand)" : "")} />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-2 rounded-md border border-(--border) bg-(--bg-elevated) px-2.5 py-1.5 text-xs text-(--text-muted) transition-colors hover:border-(--border-strong) hover:text-(--text)"
            >
              <Search size={13} />
              <span className="hidden sm:inline">Jump to…</span>
              <kbd className="ml-1 hidden rounded bg-(--bg-overlay) px-1.5 py-0.5 font-mono text-[10px] text-(--text-subtle) sm:inline">⌘K</kbd>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
