"use client";

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2" aria-label="AI sedang mengetik">
      <div className="flex gap-1">
        <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
        <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
        <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
      </div>
      <span className="text-xs text-muted-foreground ml-1">
        AI sedang mengetik...
      </span>
    </div>
  );
}
