"use client";

import NumberFlow from "@number-flow/react";
import { cn } from "@/lib/cn";

export function FlowNum({ value, className }: { value: number; className?: string }) {
  return (
    <NumberFlow
      value={value}
      className={cn("tabular", className)}
      transformTiming={{ duration: 700, easing: "cubic-bezier(0.22,1,0.36,1)" }}
      spinTiming={{ duration: 700, easing: "cubic-bezier(0.22,1,0.36,1)" }}
      data-numeric
    />
  );
}
