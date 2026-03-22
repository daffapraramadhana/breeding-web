"use client";

import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  sectionLabel?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, sectionLabel, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        {sectionLabel && (
          <p className="text-[10px] uppercase tracking-[2px] text-[var(--muted-foreground)] mb-1">
            {sectionLabel}
          </p>
        )}
        <h1 className="text-[24px] font-light tracking-[-0.5px] text-[var(--foreground)]">
          {title}
        </h1>
      </div>
      {actions && (
        <div className="flex items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
