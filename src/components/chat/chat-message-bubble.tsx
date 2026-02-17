"use client";

import { Bot } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "./markdown-renderer";
import { CONTEXT_TYPES } from "./context-picker";
import type { ChatMessage } from "@/types/chat";

interface ChatMessageBubbleProps {
  message: ChatMessage;
  showTimestamp?: boolean;
}

export function ChatMessageBubble({
  message,
  showTimestamp = true,
}: ChatMessageBubbleProps) {
  const isUser = message.role === "USER";

  const contextConfig = message.contextType
    ? CONTEXT_TYPES.find((t) => t.type === message.contextType)
    : null;

  return (
    <div
      className={cn(
        "flex gap-2 animate-in fade-in slide-in-from-bottom-1 duration-150",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div className={cn("max-w-[85%] space-y-1", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-sm",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted rounded-bl-sm"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
        </div>

        {isUser && contextConfig && (
          <div className="text-xs text-muted-foreground flex justify-end">
            <span>
              📎 {contextConfig.icon} {contextConfig.label}
              {message.contextId ? `: ${message.contextId.slice(0, 8)}...` : ""}
            </span>
          </div>
        )}

        {showTimestamp && (
          <p
            className={cn(
              "text-[10px] text-muted-foreground",
              isUser ? "text-right" : "text-left"
            )}
          >
            {formatDistanceToNow(parseISO(message.createdAt), {
              addSuffix: true,
              locale: id,
            })}
          </p>
        )}
      </div>
    </div>
  );
}

interface StreamingBubbleProps {
  text: string;
}

export function StreamingBubble({ text }: StreamingBubbleProps) {
  return (
    <div className="flex gap-2 justify-start">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Bot className="h-4 w-4" />
      </div>
      <div className="max-w-[85%]">
        <div className="rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm">
          {text ? (
            <MarkdownRenderer content={text} />
          ) : (
            <span className="text-muted-foreground">...</span>
          )}
        </div>
      </div>
    </div>
  );
}
