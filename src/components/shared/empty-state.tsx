"use client";

import { Package } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[18px] bg-[var(--glass-bg)] border border-[var(--glass-border)] py-16 px-6 text-center backdrop-blur-[var(--glass-blur)]">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--muted)]">
        <Package className="h-6 w-6 text-[var(--muted-foreground)]" />
      </div>
      <h3 className="text-[15px] font-medium text-[var(--foreground)]">{title || "No data found"}</h3>
      {description && <p className="mt-1 text-[13px] text-[var(--muted-foreground)]">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
