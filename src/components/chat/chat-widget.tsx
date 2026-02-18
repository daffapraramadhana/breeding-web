"use client";

import { useChat } from "@/hooks/use-chat";
import { ChatFab } from "./chat-fab";
import { ChatPanel } from "./chat-panel";

export function ChatWidget() {
  const {
    state,
    togglePanel,
    closePanel,
    setView,
    setInputText,
    setAttachedContext,
    loadConversations,
    openConversation,
    startNewConversation,
    removeConversation,
    sendMessage,
  } = useChat();

  return (
    <>
      {!state.isOpen && (
        <ChatFab onClick={togglePanel} hasUnread={state.hasUnread} />
      )}

      {state.isOpen && (
        <ChatPanel
          view={state.view}
          conversations={state.conversations}
          conversationsLoading={state.conversationsLoading}
          conversationsLoaded={state.conversationsLoaded}
          hasMore={state.hasMore}
          currentPage={state.currentPage}
          activeConversation={state.activeConversation}
          messages={state.messages}
          messagesLoading={state.messagesLoading}
          isStreaming={state.isStreaming}
          streamingText={state.streamingText}
          inputText={state.inputText}
          attachedContext={state.attachedContext}
          onClose={closePanel}
          onSetView={setView}
          onLoadConversations={loadConversations}
          onOpenConversation={openConversation}
          onNewConversation={startNewConversation}
          onDeleteConversation={removeConversation}
          onSetInputText={setInputText}
          onSendMessage={sendMessage}
          onSetAttachedContext={setAttachedContext}
        />
      )}
    </>
  );
}
