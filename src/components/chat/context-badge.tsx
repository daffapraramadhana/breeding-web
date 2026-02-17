"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AttachedContext } from "@/types/chat";
import { CONTEXT_TYPES } from "./context-picker";

interface ContextBadgeProps {
  context: AttachedContext;
  onRemove: () => void;
}

export function ContextBadge({ context, onRemove }: ContextBadgeProps) {
  const typeConfig = CONTEXT_TYPES.find((t) => t.type === context.type);
  const icon = typeConfig?.icon || "📎";
  const label = typeConfig?.label || context.type;

  return (
    <Badge
      variant="secondary"
      className="gap-1 pr-1 text-xs"
    >
      <span>{icon}</span>
      <span>
        {label}: {context.label}
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
        aria-label="Hapus lampiran"
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}
