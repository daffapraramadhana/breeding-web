"use client";

import { Sparkles } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatFabProps {
  onClick: () => void;
  hasUnread: boolean;
}

export function ChatFab({ onClick, hasUnread }: ChatFabProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            aria-label="Buka AI Assistant"
            className="group fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-[14px] bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] shadow-[var(--glass-shadow)] text-[var(--foreground)] transition-all duration-300 hover:scale-110 sm:h-12 sm:w-12"
          >
            {/* Glow ring on hover */}
            <span className="absolute inset-0 rounded-full bg-primary/20 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100" />

            <Sparkles className="relative h-6 w-6 transition-transform duration-300 group-hover:rotate-12 sm:h-5 sm:w-5" />

            {hasUnread && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive animate-pulse" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" sideOffset={12}>
          <p>AI Assistant</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
