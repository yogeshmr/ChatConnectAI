import useSWR from "swr";
import { useState } from "react";
import type { Message, Conversation } from "db/schema";

export function useChat() {
  const [activeConversationId, setActiveConversationId] = useState<number>();

  const { data: conversations = [], mutate: mutateConversations } = useSWR<Conversation[]>(
    "/api/conversations"
  );

  const { data: messages = [], mutate: mutateMessages } = useSWR<Message[]>(
    activeConversationId ? `/api/conversations/${activeConversationId}/messages` : null
  );

  const [isLoading, setIsLoading] = useState(false);

  const createConversation = async () => {
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
      });
      const newConversation = await response.json();
      await mutateConversations();
      setActiveConversationId(newConversation.id);
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  const sendMessage = async (content: string) => {
    if (!activeConversationId) return;

    setIsLoading(true);
    try {
      await fetch(`/api/conversations/${activeConversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      await mutateMessages();
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectConversation = (id: number) => {
    setActiveConversationId(id);
  };

  return {
    conversations,
    messages,
    activeConversationId,
    isLoading,
    createConversation,
    sendMessage,
    selectConversation,
  };
}
