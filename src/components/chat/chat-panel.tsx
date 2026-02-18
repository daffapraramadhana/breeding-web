"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bot, Minus, X } from "lucide-react";
import { ConversationList } from "./conversation-list";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import type {
  Conversation,
  ConversationWithMessages,
  ChatMessage,
  AttachedContext,
} from "@/types/chat";

interface ChatPanelProps {
  view: "list" | "conversation";
  conversations: Conversation[];
  conversationsLoading: boolean;
  conversationsLoaded: boolean;
  hasMore: boolean;
  currentPage: number;
  activeConversation: ConversationWithMessages | null;
  messages: ChatMessage[];
  messagesLoading: boolean;
  isStreaming: boolean;
  streamingText: string;
  inputText: string;
  attachedContext: AttachedContext | null;
  onClose: () => void;
  onSetView: (view: "list" | "conversation") => void;
  onLoadConversations: (page?: number) => void;
  onOpenConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onSetInputText: (text: string) => void;
  onSendMessage: () => void;
  onSetAttachedContext: (context: AttachedContext | null) => void;
}

export function ChatPanel({
  view,
  conversations,
  conversationsLoading,
  conversationsLoaded,
  hasMore,
  currentPage,
  activeConversation,
  messages,
  messagesLoading,
  isStreaming,
  streamingText,
  inputText,
  attachedContext,
  onClose,
  onSetView,
  onLoadConversations,
  onOpenConversation,
  onNewConversation,
  onDeleteConversation,
  onSetInputText,
  onSendMessage,
  onSetAttachedContext,
}: ChatPanelProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (view === "conversation") {
          onSetView("list");
        } else {
          onClose();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [view, onClose, onSetView]);

  useEffect(() => {
    if (view === "list" && !conversationsLoaded && !conversationsLoading) {
      onLoadConversations(1);
    }
  }, [view, conversationsLoaded, conversationsLoading, onLoadConversations]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col bg-background border rounded-xl shadow-2xl overflow-hidden w-[100vw] h-[100dvh] sm:w-[380px] sm:h-[min(600px,calc(100dvh-2rem))] lg:w-[420px] sm:bottom-6 sm:right-6 bottom-0 right-0 sm:rounded-xl rounded-none animate-in slide-in-from-bottom-4 fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3 bg-background">
        <div className="flex items-center gap-2">
          {view === "conversation" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onSetView("list")}
              aria-label="Kembali ke daftar"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">
                {view === "conversation" && activeConversation
                  ? activeConversation.title
                  : "AI Assistant"}
              </p>
              {view === "list" && (
                <p className="text-[10px] text-muted-foreground">
                  Breeding App
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hidden sm:flex"
            onClick={onClose}
            aria-label="Minimize"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
            aria-label="Tutup chat"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Body */}
      {view === "list" ? (
        <ConversationList
          conversations={conversations}
          isLoading={conversationsLoading}
          hasMore={hasMore}
          onLoadMore={() => onLoadConversations(currentPage + 1)}
          onNewConversation={onNewConversation}
          onOpenConversation={onOpenConversation}
          onDeleteConversation={onDeleteConversation}
        />
      ) : (
        <>
          <ChatMessages
            messages={messages}
            isLoading={messagesLoading}
            isStreaming={isStreaming}
            streamingText={streamingText}
          />
          <ChatInput
            value={inputText}
            onChange={onSetInputText}
            onSend={onSendMessage}
            isStreaming={isStreaming}
            attachedContext={attachedContext}
            onAttachContext={onSetAttachedContext}
          />
        </>
      )}
    </div>
  );
}
