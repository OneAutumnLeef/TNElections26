import { ALLIANCE_BY_ID } from "@/data/alliances";
import type { AllianceId } from "@/data/types";
import { cn } from "@/lib/cn";

export function AllianceTag({ id, size = "sm", className }: { id: AllianceId; size?: "xs" | "sm" | "md"; className?: string }) {
  const a = ALLIANCE_BY_ID[id];
  if (!a) return null;
  const cls = size === "xs" ? "text-[10px] px-1.5 py-0.5" : size === "md" ? "text-sm px-2.5 py-1" : "text-xs px-2 py-0.5";
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-md font-medium tracking-wide", cls, className)}
      style={{ backgroundColor: `${a.color}22`, color: a.color }}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: a.color }} />
      {a.short}
    </span>
  );
}
