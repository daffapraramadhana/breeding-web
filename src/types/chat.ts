export interface Conversation {
  id: string;
  tenantId: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  messages: MessagePreview[];
}

export interface MessagePreview {
  content: string;
  role: "USER" | "ASSISTANT";
  createdAt: string;
}

export interface ConversationWithMessages {
  id: string;
  tenantId: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: "USER" | "ASSISTANT";
  content: string;
  contextType: string | null;
  contextId: string | null;
  contextData: Record<string, unknown> | null;
  createdAt: string;
}

export interface AttachedContext {
  type: ContextType;
  id: string;
  label: string;
}

export type ContextType =
  | "project"
  | "coop"
  | "product"
  | "purchase_order"
  | "sales_order"
  | "goods_receipt"
  | "delivery"
  | "goods_transfer"
  | "goods_consumption"
  | "goods_return"
  | "internal_trade"
  | "inventory_stock";

export interface ContextTypeOption {
  type: ContextType;
  label: string;
  icon: string;
  searchEndpoint: string;
  displayField: string;
}

export interface TextDeltaEvent {
  type: "text_delta";
  text: string;
}

export interface MessageCompleteEvent {
  type: "message_complete";
  messageId: string;
}

export interface ErrorEvent {
  type: "error";
  message: string;
}

export type SSEEvent = TextDeltaEvent | MessageCompleteEvent | ErrorEvent;
