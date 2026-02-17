"use client";

import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, SendHorizonal } from "lucide-react";
import { ContextBadge } from "./context-badge";
import { ContextPicker } from "./context-picker";
import type { AttachedContext } from "@/types/chat";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isStreaming: boolean;
  attachedContext: AttachedContext | null;
  onAttachContext: (context: AttachedContext | null) => void;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  isStreaming,
  attachedContext,
  onAttachContext,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 120) + "px";
    }
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isStreaming) {
        onSend();
      }
    }
  }

  const canSend = value.trim().length > 0 && !isStreaming;

  return (
    <div className="border-t bg-background p-3">
      {attachedContext && (
        <div className="mb-2">
          <ContextBadge
            context={attachedContext}
            onRemove={() => onAttachContext(null)}
          />
        </div>
      )}

      <div className="flex items-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => setPickerOpen(true)}
          disabled={isStreaming}
          aria-label="Lampirkan data"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ketik pesan..."
          rows={1}
          disabled={isStreaming}
          className="flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
          style={{ maxHeight: 120 }}
        />

        <Button
          type="button"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={onSend}
          disabled={!canSend}
          aria-label="Kirim pesan"
        >
          <SendHorizonal className="h-4 w-4" />
        </Button>
      </div>

      <ContextPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(ctx) => onAttachContext(ctx)}
      />
    </div>
  );
}
