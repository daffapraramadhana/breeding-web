"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus, Trash2, Bot, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import type { Conversation } from "@/types/chat";

interface ConversationListProps {
  conversations: Conversation[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onNewConversation: () => void;
  onOpenConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
}

export function ConversationList({
  conversations,
  isLoading,
  hasMore,
  onLoadMore,
  onNewConversation,
  onOpenConversation,
  onDeleteConversation,
}: ConversationListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function handleDelete() {
    if (deleteId) {
      onDeleteConversation(deleteId);
      setDeleteId(null);
    }
  }

  if (isLoading && conversations.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="p-3">
        <Button
          onClick={onNewConversation}
          className="w-full"
          aria-label="Mulai percakapan baru"
        >
          <MessageSquarePlus className="mr-2 h-4 w-4" />
          Percakapan Baru
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <MessageSquarePlus className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm font-medium">Belum ada percakapan</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-[200px]">
              Mulai percakapan baru untuk bertanya tentang data peternakan Anda
            </p>
          </div>
        ) : (
          <>
            {conversations.map((conv) => {
              const lastMsg = conv.messages?.[0];
              return (
                <div
                  key={conv.id}
                  className="group flex items-start gap-2 rounded-lg border p-3 hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => onOpenConversation(conv.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onOpenConversation(conv.id);
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {conv.title}
                    </p>
                    {lastMsg && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                        {lastMsg.role === "ASSISTANT" ? (
                          <Bot className="h-3 w-3 shrink-0" />
                        ) : (
                          <User className="h-3 w-3 shrink-0" />
                        )}
                        {lastMsg.content.slice(0, 80)}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(parseISO(conv.updatedAt), {
                        addSuffix: true,
                        locale: id,
                      })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(conv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 transition-opacity"
                    aria-label="Hapus percakapan"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              );
            })}
            {hasMore && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={onLoadMore}
                disabled={isLoading}
              >
                {isLoading ? "Memuat..." : "Muat lebih banyak..."}
              </Button>
            )}
          </>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus percakapan ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
