import { fetchApi } from "@/lib/api";
import type {
  Conversation,
  ConversationWithMessages,
} from "@/types/chat";
import { PaginatedResponse } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

// Conversations

export async function createConversation(title?: string) {
  return fetchApi<Conversation>("/chat/conversations", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export async function listConversations(page = 1, limit = 20) {
  return fetchApi<PaginatedResponse<Conversation>>(
    `/chat/conversations?page=${page}&limit=${limit}`
  );
}

export async function getConversation(id: string) {
  return fetchApi<ConversationWithMessages>(`/chat/conversations/${id}`);
}

export async function deleteConversation(id: string) {
  return fetchApi<Conversation>(`/chat/conversations/${id}`, {
    method: "DELETE",
  });
}

// Streaming Message (SSE)

export async function sendMessageSSE(
  conversationId: string,
  body: { content: string; context?: { type: string; id: string } },
  callbacks: {
    onTextDelta: (text: string) => void;
    onComplete: (messageId: string) => void;
    onError: (message: string) => void;
  }
): Promise<void> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const response = await fetch(
    `${API_URL}/chat/conversations/${conversationId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    let message = "Failed to send message";
    try {
      const error = await response.json();
      message = error.message || message;
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const event = JSON.parse(line.slice(6));
          if (event.type === "text_delta") {
            callbacks.onTextDelta(event.text);
          } else if (event.type === "message_complete") {
            callbacks.onComplete(event.messageId);
          } else if (event.type === "error") {
            callbacks.onError(event.message);
          }
        } catch {
          // skip malformed SSE lines
        }
      }
    }
  }
}
