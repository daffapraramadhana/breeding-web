"use client";

import { useEffect, useRef, useCallback } from "react";
import { Bot } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatMessageBubble, StreamingBubble } from "./chat-message-bubble";
import { TypingIndicator } from "./typing-indicator";
import type { ChatMessage } from "@/types/chat";

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingText: string;
}

export function ChatMessages({
  messages,
  isLoading,
  isStreaming,
  streamingText,
}: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const userScrolled = useRef(false);

  const scrollToBottom = useCallback(() => {
    if (!userScrolled.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, scrollToBottom]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 100;
    const isNearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    userScrolled.current = !isNearBottom;
  }

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`flex gap-2 ${i % 2 === 0 ? "" : "justify-end"}`}>
            {i % 2 === 0 && <Skeleton className="h-7 w-7 rounded-full shrink-0" />}
            <Skeleton className="h-16 w-[70%] rounded-2xl" />
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col items-center justify-center h-full text-center py-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <p className="mt-4 font-medium text-sm">
            Halo! Saya asisten AI untuk peternakan Anda.
          </p>
          <div className="mt-3 text-xs text-muted-foreground text-left max-w-[280px] space-y-1">
            <p>Beberapa hal yang bisa saya bantu:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Analisis data batch ternak</li>
              <li>Review Purchase Order & Sales Order</li>
              <li>Analisis P&L dan keuangan</li>
              <li>Cek stok dan inventori</li>
              <li>Rekomendasi operasional</li>
            </ul>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Ketik pesan atau lampirkan data untuk memulai!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 space-y-3"
    >
      {messages.map((msg) => (
        <ChatMessageBubble key={msg.id} message={msg} />
      ))}

      {isStreaming && <StreamingBubble text={streamingText} />}
      {isStreaming && !streamingText && <TypingIndicator />}

      <div ref={bottomRef} />
    </div>
  );
}
