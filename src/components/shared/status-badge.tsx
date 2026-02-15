"use client";

import { Badge } from "@/components/ui/badge";
import { DocumentStatus } from "@/types/api";
import { STATUS_COLORS } from "@/lib/constants";

interface StatusBadgeProps {
  status: DocumentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={STATUS_COLORS[status]}>
      {status}
    </Badge>
  );
}
