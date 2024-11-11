import useSWR from "swr";
import { useState } from "react";
import type { Message, Conversation } from "db/schema";
import { useToast } from "@/hooks/use-toast";

export function useChat() {
  const [activeConversationId, setActiveConversationId] = useState<number>();
  const { toast } = useToast();

  const { data: conversations = [], mutate: mutateConversations } = useSWR<Conversation[]>(
    "/api/conversations"
  );

  const { data: messages = [], mutate: mutateMessages } = useSWR<Message[]>(
    activeConversationId ? `/api/conversations/${activeConversationId}/messages` : null
  );

  const [isLoading, setIsLoading] = useState(false);

  const resetChat = async () => {
    setActiveConversationId(undefined);
    await Promise.all([
      mutateMessages([]),
      mutateConversations([])
    ]);
  };

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
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive",
      });
    }
  };

  const updateConversation = async (id: number, updates: Partial<Conversation>) => {
    try {
      await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      await mutateConversations();
    } catch (error) {
      console.error("Failed to update conversation:", error);
      toast({
        title: "Error",
        description: "Failed to update conversation",
        variant: "destructive",
      });
    }
  };

  const deleteConversations = async (ids: number[]) => {
    try {
      await fetch(`/api/conversations`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (ids.includes(activeConversationId!)) {
        setActiveConversationId(undefined);
      }
      await mutateConversations();
    } catch (error) {
      console.error("Failed to delete conversations:", error);
      toast({
        title: "Error",
        description: "Failed to delete conversations",
        variant: "destructive",
      });
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
      await Promise.all([
        mutateMessages(),
        mutateConversations(), // Refresh conversations to update lastActive
      ]);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
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
    updateConversation,
    deleteConversations,
    sendMessage,
    selectConversation,
    resetChat,
  };
}
