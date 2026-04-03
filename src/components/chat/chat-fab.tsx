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
            className="group fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex h-11 items-center justify-center gap-2 rounded-full px-5 bg-primary/90 backdrop-blur-sm border border-primary/20 shadow-lg shadow-primary/10 text-primary-foreground transition-all duration-300 hover:scale-105"
          >
            {/* Glow ring on hover */}
            <span className="absolute inset-0 rounded-full bg-primary/20 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100" />

            <Sparkles className="relative h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
            <span className="text-sm font-medium">AI Assistant</span>

            {hasUnread && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive animate-pulse" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={12}>
          <p>AI Assistant</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
