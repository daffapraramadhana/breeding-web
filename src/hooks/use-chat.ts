"use client";

import { useReducer, useCallback } from "react";
import {
  createConversation,
  listConversations,
  getConversation,
  deleteConversation,
  sendMessageSSE,
} from "@/lib/chat-api";
import type {
  Conversation,
  ChatMessage,
  ConversationWithMessages,
  AttachedContext,
} from "@/types/chat";

interface ChatState {
  isOpen: boolean;
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
  attachedContext: AttachedContext | null;
  inputText: string;
  hasUnread: boolean;
}

type ChatAction =
  | { type: "TOGGLE_PANEL" }
  | { type: "CLOSE_PANEL" }
  | { type: "SET_VIEW"; view: "list" | "conversation" }
  | { type: "SET_CONVERSATIONS_LOADING"; loading: boolean }
  | {
      type: "SET_CONVERSATIONS";
      conversations: Conversation[];
      hasMore: boolean;
      page: number;
    }
  | { type: "APPEND_CONVERSATIONS"; conversations: Conversation[]; hasMore: boolean; page: number }
  | { type: "REMOVE_CONVERSATION"; id: string }
  | { type: "SET_ACTIVE_CONVERSATION"; conversation: ConversationWithMessages }
  | { type: "SET_MESSAGES_LOADING"; loading: boolean }
  | { type: "ADD_USER_MESSAGE"; message: ChatMessage }
  | { type: "SET_STREAMING"; streaming: boolean }
  | { type: "APPEND_STREAMING_TEXT"; text: string }
  | { type: "FINALIZE_STREAMING"; messageId: string }
  | { type: "SET_ATTACHED_CONTEXT"; context: AttachedContext | null }
  | { type: "SET_INPUT_TEXT"; text: string }
  | { type: "CLEAR_UNREAD" }
  | { type: "UPDATE_CONVERSATION_TITLE"; id: string; title: string };

const initialState: ChatState = {
  isOpen: false,
  view: "list",
  conversations: [],
  conversationsLoading: false,
  conversationsLoaded: false,
  hasMore: false,
  currentPage: 1,
  activeConversation: null,
  messages: [],
  messagesLoading: false,
  isStreaming: false,
  streamingText: "",
  attachedContext: null,
  inputText: "",
  hasUnread: false,
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "TOGGLE_PANEL":
      return {
        ...state,
        isOpen: !state.isOpen,
        hasUnread: !state.isOpen ? false : state.hasUnread,
      };
    case "CLOSE_PANEL":
      return { ...state, isOpen: false };
    case "SET_VIEW":
      return { ...state, view: action.view };
    case "SET_CONVERSATIONS_LOADING":
      return { ...state, conversationsLoading: action.loading };
    case "SET_CONVERSATIONS":
      return {
        ...state,
        conversations: action.conversations,
        hasMore: action.hasMore,
        currentPage: action.page,
        conversationsLoading: false,
        conversationsLoaded: true,
      };
    case "APPEND_CONVERSATIONS":
      return {
        ...state,
        conversations: [...state.conversations, ...action.conversations],
        hasMore: action.hasMore,
        currentPage: action.page,
        conversationsLoading: false,
        conversationsLoaded: true,
      };
    case "REMOVE_CONVERSATION":
      return {
        ...state,
        conversations: state.conversations.filter((c) => c.id !== action.id),
        activeConversation:
          state.activeConversation?.id === action.id
            ? null
            : state.activeConversation,
        view:
          state.activeConversation?.id === action.id ? "list" : state.view,
      };
    case "SET_ACTIVE_CONVERSATION":
      return {
        ...state,
        activeConversation: action.conversation,
        messages: action.conversation.messages,
        view: "conversation",
        messagesLoading: false,
      };
    case "SET_MESSAGES_LOADING":
      return { ...state, messagesLoading: action.loading };
    case "ADD_USER_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.message],
        inputText: "",
        attachedContext: null,
      };
    case "SET_STREAMING":
      return {
        ...state,
        isStreaming: action.streaming,
        streamingText: action.streaming ? "" : state.streamingText,
      };
    case "APPEND_STREAMING_TEXT":
      return {
        ...state,
        streamingText: state.streamingText + action.text,
      };
    case "FINALIZE_STREAMING": {
      const assistantMessage: ChatMessage = {
        id: action.messageId,
        conversationId: state.activeConversation?.id || "",
        role: "ASSISTANT",
        content: state.streamingText,
        contextType: null,
        contextId: null,
        contextData: null,
        createdAt: new Date().toISOString(),
      };
      return {
        ...state,
        messages: [...state.messages, assistantMessage],
        isStreaming: false,
        streamingText: "",
        hasUnread: !state.isOpen,
      };
    }
    case "SET_ATTACHED_CONTEXT":
      return { ...state, attachedContext: action.context };
    case "SET_INPUT_TEXT":
      return { ...state, inputText: action.text };
    case "CLEAR_UNREAD":
      return { ...state, hasUnread: false };
    case "UPDATE_CONVERSATION_TITLE":
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.id ? { ...c, title: action.title } : c
        ),
        activeConversation:
          state.activeConversation?.id === action.id
            ? { ...state.activeConversation, title: action.title }
            : state.activeConversation,
      };
    default:
      return state;
  }
}

export function useChat() {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  const togglePanel = useCallback(() => dispatch({ type: "TOGGLE_PANEL" }), []);
  const closePanel = useCallback(() => dispatch({ type: "CLOSE_PANEL" }), []);
  const setView = useCallback(
    (view: "list" | "conversation") => dispatch({ type: "SET_VIEW", view }),
    []
  );
  const setInputText = useCallback(
    (text: string) => dispatch({ type: "SET_INPUT_TEXT", text }),
    []
  );
  const setAttachedContext = useCallback(
    (context: AttachedContext | null) =>
      dispatch({ type: "SET_ATTACHED_CONTEXT", context }),
    []
  );
  const clearUnread = useCallback(() => dispatch({ type: "CLEAR_UNREAD" }), []);

  const loadConversations = useCallback(
    async (page = 1) => {
      dispatch({ type: "SET_CONVERSATIONS_LOADING", loading: true });
      try {
        const result = await listConversations(page, 20);
        if (page === 1) {
          dispatch({
            type: "SET_CONVERSATIONS",
            conversations: result.data,
            hasMore: page < result.meta.totalPages,
            page,
          });
        } else {
          dispatch({
            type: "APPEND_CONVERSATIONS",
            conversations: result.data,
            hasMore: page < result.meta.totalPages,
            page,
          });
        }
      } catch {
        dispatch({ type: "SET_CONVERSATIONS_LOADING", loading: false });
      }
    },
    []
  );

  const openConversation = useCallback(async (id: string) => {
    dispatch({ type: "SET_MESSAGES_LOADING", loading: true });
    dispatch({ type: "SET_VIEW", view: "conversation" });
    try {
      const conversation = await getConversation(id);
      dispatch({ type: "SET_ACTIVE_CONVERSATION", conversation });
    } catch {
      dispatch({ type: "SET_MESSAGES_LOADING", loading: false });
      dispatch({ type: "SET_VIEW", view: "list" });
    }
  }, []);

  const startNewConversation = useCallback(async () => {
    try {
      const conversation = await createConversation();
      const conversationWithMessages: ConversationWithMessages = {
        ...conversation,
        messages: [],
      };
      dispatch({
        type: "SET_ACTIVE_CONVERSATION",
        conversation: conversationWithMessages,
      });
    } catch {
      // error handled silently
    }
  }, []);

  const removeConversation = useCallback(async (id: string) => {
    try {
      await deleteConversation(id);
      dispatch({ type: "REMOVE_CONVERSATION", id });
    } catch {
      // error handled silently
    }
  }, []);

  const sendMessage = useCallback(async () => {
    if (!state.inputText.trim() || !state.activeConversation || state.isStreaming) return;

    const content = state.inputText.trim();
    const context = state.attachedContext;
    const conversationId = state.activeConversation.id;
    const isFirstMessage = state.messages.length === 0;

    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversationId,
      role: "USER",
      content,
      contextType: context?.type || null,
      contextId: context?.id || null,
      contextData: null,
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: "ADD_USER_MESSAGE", message: userMessage });
    dispatch({ type: "SET_STREAMING", streaming: true });

    try {
      await sendMessageSSE(
        conversationId,
        {
          content,
          ...(context && { context: { type: context.type, id: context.id } }),
        },
        {
          onTextDelta: (text) =>
            dispatch({ type: "APPEND_STREAMING_TEXT", text }),
          onComplete: (messageId) => {
            dispatch({ type: "FINALIZE_STREAMING", messageId });
            if (isFirstMessage) {
              const title = content.length > 100 ? content.slice(0, 100) + "..." : content;
              dispatch({
                type: "UPDATE_CONVERSATION_TITLE",
                id: conversationId,
                title,
              });
            }
          },
          onError: (message) => {
            dispatch({ type: "SET_STREAMING", streaming: false });
            const errorMessage: ChatMessage = {
              id: `error-${Date.now()}`,
              conversationId,
              role: "ASSISTANT",
              content: `⚠️ ${message}`,
              contextType: null,
              contextId: null,
              contextData: null,
              createdAt: new Date().toISOString(),
            };
            dispatch({ type: "ADD_USER_MESSAGE", message: errorMessage });
          },
        }
      );
    } catch (err) {
      dispatch({ type: "SET_STREAMING", streaming: false });
      const errorMsg =
        err instanceof Error ? err.message : "Gagal menghubungi server.";
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        conversationId,
        role: "ASSISTANT",
        content: `⚠️ ${errorMsg}`,
        contextType: null,
        contextId: null,
        contextData: null,
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: "ADD_USER_MESSAGE", message: errorMessage });
    }
  }, [state.inputText, state.activeConversation, state.isStreaming, state.attachedContext, state.messages.length]);

  return {
    state,
    togglePanel,
    closePanel,
    setView,
    setInputText,
    setAttachedContext,
    clearUnread,
    loadConversations,
    openConversation,
    startNewConversation,
    removeConversation,
    sendMessage,
  };
}
