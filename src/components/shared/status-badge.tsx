"use client";

import { Badge } from "@/components/ui/badge";
import { STATUS_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="ghost"
      className={cn(
        "rounded-[6px] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.3px] border-0",
        STATUS_COLORS[status] ?? "bg-[var(--muted)] text-[var(--muted-foreground)]"
      )}
    >
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
