import { partyColor } from "@/data/parties";
import { cn } from "@/lib/cn";

export function PartyDot({ code, withLabel = false, className }: { code: string; withLabel?: boolean; className?: string }) {
  const color = partyColor(code);
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {withLabel && <span className="text-xs text-(--text-muted)">{code}</span>}
    </span>
  );
}
