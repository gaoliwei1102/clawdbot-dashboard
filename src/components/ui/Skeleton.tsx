import * as React from "react";
import { cn } from "../../lib/cn";

// ui-skills: prefer skeletons; no animation unless explicitly requested.
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-md bg-zinc-900", className)} {...props} />;
}

