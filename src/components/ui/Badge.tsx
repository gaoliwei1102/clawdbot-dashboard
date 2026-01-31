import * as React from "react";
import { cn } from "../../lib/cn";

export type BadgeVariant = "neutral" | "ok" | "warn" | "bad";

const variants: Record<BadgeVariant, string> = {
  neutral: "border-zinc-700 bg-zinc-950 text-zinc-200",
  ok: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  warn: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  bad: "border-red-500/30 bg-red-500/10 text-red-200"
};

export function Badge({
  className,
  variant = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium tabular-nums",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
