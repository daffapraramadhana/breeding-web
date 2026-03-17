"use client";

import { Badge } from "@/components/ui/badge";
import { STATUS_COLORS } from "@/lib/constants";

export function StatusBadge({ status }: { status: string }) {
  const colorClass = STATUS_COLORS[status] || "bg-gray-100 text-gray-800 border-gray-200";
  return (
    <Badge variant="outline" className={colorClass}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
